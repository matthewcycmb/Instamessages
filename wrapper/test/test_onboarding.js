// Exercises the bundled onboarding page (wrapper/dist/index.html): the
// once-per-install gate, the Mac bypass, the full v2 walk (S1 -> S3 ranges
// -> S4 ranges -> S5/S6/S7 dark impact -> S8a/S8b -> S10 privacy) with the
// sheet's disclosed math, the S4 gating rule, the tap lock that stops
// spam-throughs, and the once-per-install flag being set at the login
// handoff, not later. The S2 motive screen was removed on Aug 11.
//
//   node test_onboarding.js          (jsdom already installed for test_cage)
//
// Same trick as test_cage.js: jsdom locks window.location, so the page's
// scripts are extracted from the markup and run with a shadowed `location`
// recorder. dom.went holds every place the page tried to navigate.
const fs = require('fs');
const assert = require('assert');
const { JSDOM } = require('jsdom');

const HTML = fs.readFileSync(__dirname + '/../dist/index.html', 'utf8');
const SCRIPTS = [...HTML.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
assert.strictEqual(SCRIPTS.length, 3,
  'expected the branch script, the Mac welcome script and the flow script');

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1';
const DESKTOP = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15';
const INBOX = 'https://www.instagram.com/direct/inbox/';

const open = [];
function boot(opts = {}) {
  const dom = new JSDOM(HTML, {
    url: 'https://tauri.localhost/',
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  Object.defineProperty(dom.window.navigator, 'userAgent',
    { value: opts.ua || IPHONE, configurable: true });
  if (opts.onboarded) dom.window.localStorage.konvoOnboarded = '1';
  if (opts.macWelcomed) dom.window.localStorage.konvoMacWelcomed = '1';
  // The bridge mock splits streams: appearance changes and funnel events.
  dom.appearance = [];
  dom.events = [];
  dom.tracked = [];
  dom.nav = [];
  dom.window.webkit = { messageHandlers: { konvoStore: {
    postMessage: m => {
      if (m.cmd === 'appearance') dom.appearance.push(m.productId);
      if (m.cmd === 'track') {
        dom.events.push(m.event);
        dom.tracked.push(m);
      }
      // The login handoff goes through native: a page-driven navigation to
      // instagram.com is a universal link on iOS and opens the Instagram
      // APP instead, stranding the user outside Konvo.
      if (m.cmd === 'go') dom.nav.push(m.productId);
    } } } };
  dom.went = [];
  dom.window.__loc = { replace: t => dom.went.push(t) };
  for (const s of SCRIPTS) {
    dom.window.eval(`(function (location) {${s}})(window.__loc)`);
  }
  open.push(dom);
  return dom;
}
const settle = ms => new Promise(r => setTimeout(r, ms));
process.on('exit', () => open.forEach(d => d.window.close()));

(async () => {
  // 1. The Mac gets ONE welcome screen on a fresh install - never the phone
  //    quiz, and never again after the first run. Before this, a Mac user
  //    double-clicked Konvo and landed on an Instagram login with no context.
  const mac = boot({ ua: DESKTOP });
  const macAgain = boot({ ua: DESKTOP, macWelcomed: true });
  const again = boot({ onboarded: true });
  await settle(200);
  assert.deepStrictEqual(mac.went, [], 'a fresh Mac must stay on the welcome screen');
  assert(mac.window.document.documentElement.classList.contains('macwelcome'),
    'a fresh Mac must show the welcome screen');
  assert(!mac.window.document.documentElement.classList.contains('onboard'),
    'the Mac must never get the phone quiz');
  mac.window.document.getElementById('macgo').click();
  assert.deepStrictEqual(mac.went, [INBOX], 'Continue must hand the Mac to the inbox');
  assert.strictEqual(mac.window.localStorage.konvoMacWelcomed, '1',
    'the Mac flag must be set before leaving, or a quit mid-navigation replays it');
  assert.deepStrictEqual(macAgain.went, [INBOX],
    'a returning Mac must go straight to the inbox');
  assert(!macAgain.window.document.documentElement.classList.contains('macwelcome'),
    'a returning Mac must not see the welcome screen again');

  // 2. Once per install, hard requirement: the flag short-circuits every
  //    later launch into today's splash behavior, and unpins appearance.
  assert.deepStrictEqual(again.went, [INBOX],
    'an onboarded iPhone must go straight to the inbox');
  assert.deepStrictEqual(again.appearance, ['auto'],
    'a returning iPhone must hand appearance to the phone immediately');

  // 3. A fresh iPhone stays, on S1.
  const d = boot();
  const doc = d.window.document;
  assert.strictEqual(d.went.length, 0, 'a fresh install must not navigate away');
  assert(doc.getElementById('s1').classList.contains('on'), 'S1 must be showing');

  // 4. The whole walk with the sheet's own example numbers (2 h 30 m total,
  //    10-20 messaging): 7 years lost, 6 back. Every wait sits past the tap
  //    lock (600ms per slide, longer on the reveals).
  const tap = sel => {
    const el = doc.querySelector(sel);
    assert(el, sel + ' must exist');
    el.click();
  };
  tap('#s1 [data-next]');                       // Get started
  assert(doc.getElementById('s2a').classList.contains('on'),
    'Get started must land on attribution - one tap, then the quiz');
  assert(!doc.getElementById('s2'), 'the motive screen must be gone from the document');
  assert(!doc.getElementById('s1b'), 'the email screen must be gone from the document');
  await settle(1100);
  tap("#s2a .opt[data-src='tiktok']");
  await settle(1500);                           // beat + slide + nav lock
  assert(doc.getElementById('s3').classList.contains('on'),
    'an attribution tap must advance straight to screen time');
  assert(d.events.includes('attribution'), 'the source must be tracked');
  tap("#s3 .opt[data-m='150']");                // 2 - 3 hours
  await settle(1400);                           // 250ms beat + slide + lock
  assert(doc.getElementById('s4').classList.contains('on'),
    'screen-time ranges must auto-advance too - no Continue on option screens');
  assert(!doc.querySelector('#s4 .opt.sel'),
    'S4 must arrive with nothing selected - a pre-selection with no Continue button is a dead end');
  await settle(1100);
  tap("#s4 .opt[data-m='20']:not([data-est])"); // 10 - 20 mins
  await settle(400);                            // past the 250ms beat only
  assert(doc.getElementById('s4b').classList.contains('on'),
    'S4 must advance into the calculating beat');
  assert.strictEqual(doc.getElementById('p-time').textContent,
    '2 h 30 m a day on Instagram', 'the loader must echo the slider answer');
  assert.strictEqual(doc.getElementById('p-msg').textContent,
    'About 20 minutes messaging', 'the loader must echo the range answer');
  await settle(3400);                           // the calculating sequence
  assert(doc.getElementById('s5').classList.contains('on'),
    'the calculating beat must auto-advance into the dark reveal');
  assert(doc.querySelector('#s4b .pill:last-child').classList.contains('done'),
    'every calculating pill must complete before the reveal');
  assert.strictEqual(doc.getElementById('years-lost').textContent, '7 years',
    '150 min over full days across 60 years is 6.25, and the figure rounds up');
  assert.deepStrictEqual(d.appearance, ['dark'],
    'entering S5 must pin the letterbox dark');

  //    The tap lock: S5 just appeared, so an immediate tap (a spammer, or a
  //    ghost tap from the previous screen) must NOT advance.
  doc.getElementById('s5').click();
  assert(doc.getElementById('s5').classList.contains('on'),
    'a tap during the reveal dwell must be ignored - no spamming through');
  await settle(2600);                           // past the S5 dwell
  doc.getElementById('s5').click();             // Tap to continue
  assert(doc.getElementById('s6').classList.contains('on'),
    'after the dwell the same tap must advance');
  assert.strictEqual(doc.getElementById('col-now-v').textContent, '2 h 30 m / day');
  assert.strictEqual(doc.getElementById('col-dm-v').textContent, '20 m / day');
  await settle(1500);                           // past the S6 dwell
  tap('#s6 [data-next]');                       // See what changes
  assert(doc.getElementById('s7').classList.contains('on'));
  assert.strictEqual(doc.getElementById('years-back').textContent, '6 years',
    '130 protectable minutes is 5.42 years, and the figure rounds up');
  await settle(1900);                           // past the S7 dwell
  tap('#s7 [data-next]');                       // See what stays
  assert(doc.getElementById('s8a').classList.contains('on'));
  assert.strictEqual(d.appearance[d.appearance.length - 1], 'auto',
    'leaving the dark stretch must hand appearance back to the phone');
  await settle(1100);
  tap('#s8a [data-next]');                      // Next
  assert(doc.getElementById('s8b').classList.contains('on'));
  await settle(1100);
  tap('#s8b [data-next]');                      // Next
  assert(doc.getElementById('s8c').classList.contains('on'),
    'the pass hero must follow: users must learn the five-minute unlock exists');
  assert(/You are given 2 passes a day/.test(doc.getElementById('s8c').textContent)
    && doc.querySelector('#s8c img[src="pass-hero.png"]'),
    'the pass hero must show the sheet mockup');
  await settle(1100);
  tap('#s8c [data-next]');                      // Continue
  assert(doc.getElementById('s10').classList.contains('on'),
    'the hero slides must hand straight to privacy - the pact screen is gone');
  assert(!doc.getElementById('s9t').classList.contains('on'),
    'the testimonial screen must stay skipped while QUOTES is empty (release blocker)');
  assert(!d.window.localStorage.konvoOnboarded,
    'the flag must not exist before the login handoff');
  await settle(1100);
  tap('#signin');                               // Got it, sign in
  assert.strictEqual(d.window.localStorage.konvoOnboarded, '1',
    'S10 must set the once-per-install flag at the handoff, not at the paywall');
  assert(d.nav.length === 1 && d.nav[0].startsWith(INBOX + '#konvo='),
    'the handoff must go through NATIVE navigation and carry the weekly hours');
  assert(Number(d.nav[0].split('=')[1]) >= 1,
    'weekly hours floor at 1 so the pre-paywall screen never says zero');
  assert.deepStrictEqual(d.went, [],
    'the page must not navigate itself: that is the universal link that opens Instagram');
  assert(doc.getElementById('s11').classList.contains('on'),
    'the handoff spinner must be the last thing shown');
  assert(d.events.includes('login_started'),
    'the handoff must track login_started');
  const quiz = d.tracked.filter(m => m.event === 'quiz_answered');
  assert(quiz.length === 2, 'both quiz answers must be tracked');
  assert(quiz.every(m => m.props.answer && m.props.answer.length),
    'each quiz_answered must carry the chosen option label as answer');
  assert(d.tracked.find(m => m.event === 'attribution').props.source,
    'attribution must carry the source enum');
  assert(d.events.includes('onboarding_screen_viewed'),
    'screen views must be tracked');

  // 5. The gating rule: a 15-minute total disables every messaging range it
  //    cannot contain (including the 20-minute "I don't know" estimate).
  const one = boot();
  const od = one.window.document;
  const otap = sel => od.querySelector(sel).click();
  otap('#s1 [data-next]');
  await settle(1100);
  otap("#s2a .opt[data-src='friend']");
  await settle(1500);                           // beat + slide + nav lock
  otap("#s3 .opt[data-m='45']");                // < 1 hour: the lowest range
  await settle(1400);
  const opts = [...od.querySelectorAll('#s4 .opt')];
  assert(opts.length > 0, 'S4 must offer messaging ranges');
  for (const o of opts) {
    const over = +o.dataset.m > 45;
    assert.strictEqual(o.hasAttribute('disabled'), over,
      `messaging range ${o.dataset.m} must be ${over ? 'disabled' : 'available'} under a 1 hour total`);
  }
  const alive = od.querySelector('#s4 .opt:not([disabled])');
  alive.click();
  await settle(6300);                           // beat + calculating + S5 dwell
  assert(/years$/.test(od.getElementById('years-lost').textContent),
    'the projection must render a years figure at the minimum');
  od.getElementById('s5').click();
  await settle(1500);
  const dm = od.getElementById('col-dm-v').textContent;
  assert(/^\d+ m \/ day$/.test(dm), 'the messaging column must show the chosen range');
  otap('#s6 [data-next]');
  await settle(1900);
  const back = od.getElementById('years-back').textContent;
  assert(/^\d+ years$/.test(back),
    'years back must render from the minimum answers, as a whole number');
  assert(parseFloat(back) > 0, 'years back must never be zero - the sentence would read as nothing to gain');
  otap('#s7 [data-next]');
  await settle(1100);
  otap('#s8a [data-next]');
  await settle(1100);
  otap('#s8b [data-next]');
  await settle(1100);
  otap('#s8c [data-next]');
  await settle(1100);
  otap('#signin');
  assert(one.nav[0].startsWith(INBOX + '#konvo='),
    'the handoff carries the hours even from the minimum answers');

  console.log('ALL ONBOARDING TESTS PASS');
  process.exit(0);
})();
