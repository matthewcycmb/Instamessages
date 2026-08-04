// Exercises the bundled onboarding page (wrapper/dist/index.html): the
// once-per-install gate, the Mac bypass, the full v2 walk (S1 -> S2 motive
// -> S3 slider -> S4 ranges -> S5/S6/S7 dark impact -> S8a/S8b -> S10
// privacy) with the sheet's disclosed math, the S4 gating rule, the tap
// lock that stops spam-throughs, and the flag + #konvo fragment being set
// at the login handoff, not later.
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
assert.strictEqual(SCRIPTS.length, 2,
  'expected exactly the branch script and the flow script');

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
  // The bridge mock splits streams: appearance changes and funnel events.
  dom.appearance = [];
  dom.events = [];
  dom.window.webkit = { messageHandlers: { konvoStore: {
    postMessage: m => {
      if (m.cmd === 'appearance') dom.appearance.push(m.productId);
      if (m.cmd === 'track') dom.events.push(m.event);
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
  // 1. The Mac loads this same file and must behave exactly like the old
  //    splash: straight to the inbox, no quiz, ever. The redirect defers
  //    until the splash has painted, hence the settle.
  const mac = boot({ ua: DESKTOP });
  const again = boot({ onboarded: true });
  await settle(200);
  assert.deepStrictEqual(mac.went, [INBOX], 'the Mac must skip onboarding');
  assert.notStrictEqual(mac.window.document.documentElement.className, 'onboard');

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
  //    10-20 messaging): 6.3 years lost, 5.4 back, 15 hours a week, and the
  //    motive sentence built from the S2 option lowercased. Every wait sits
  //    past the tap lock (600ms per slide, longer on the reveals).
  const tap = sel => {
    const el = doc.querySelector(sel);
    assert(el, sel + ' must exist');
    el.click();
  };
  tap('#s1 [data-next]');                       // Get started
  assert(doc.getElementById('s2').classList.contains('on'));
  await settle(1100);
  tap("#s2 .opt[data-mot='ownProjects']");
  await settle(1400);                           // 250ms beat + slide + lock
  assert(doc.getElementById('s3').classList.contains('on'),
    'motive options must auto-advance without a Continue button');
  tap('#s3 .btn');                              // Continue at the 2 h 30 m default
  assert(doc.getElementById('s4').classList.contains('on'));
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
  assert.strictEqual(doc.getElementById('years-lost').textContent, '6.3 years',
    '150 min over full days across 60 years is 6.3 to one decimal');
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
  assert.strictEqual(doc.getElementById('years-back').textContent, '5.4 years',
    '130 protectable minutes is 5.4 years to one decimal');
  assert.strictEqual(doc.getElementById('motive-line').textContent,
    'of your life to achieve your dreams and work on my own projects.',
    'the S7 payoff must be the complete sentence with the S2 option lowercased');
  await settle(1900);                           // past the S7 dwell
  tap('#s7 [data-next]');                       // See what stays
  assert(doc.getElementById('s8a').classList.contains('on'));
  assert.strictEqual(d.appearance[d.appearance.length - 1], 'light',
    'leaving the dark stretch must re-pin light');
  await settle(1100);
  tap('#s8a [data-next]');                      // Next
  assert(doc.getElementById('s8b').classList.contains('on'));
  await settle(1100);
  tap('#s8b [data-next]');                      // Continue
  assert(doc.getElementById('s9').classList.contains('on'),
    'the pact must come before the privacy screen');
  await settle(1100);
  tap('#s9 [data-next]');                       // I commit
  assert(doc.getElementById('s10').classList.contains('on'));
  assert(!doc.getElementById('s9t').classList.contains('on'),
    'the testimonial screen must stay skipped while QUOTES is empty (release blocker)');
  assert(!d.window.localStorage.konvoOnboarded,
    'the flag must not exist before the login handoff');
  await settle(1100);
  tap('#signin');                               // Got it, sign in
  assert.strictEqual(d.window.localStorage.konvoOnboarded, '1',
    'S10 must set the once-per-install flag at the handoff, not at the paywall');
  assert.deepStrictEqual(d.went, [INBOX + '#konvo=ownProjects.15'],
    'the handoff must carry the motive and weekly hours in the fragment');
  assert(doc.getElementById('s11').classList.contains('on'),
    'the handoff spinner must be the last thing shown');
  assert(d.events.includes('login_started'),
    'the handoff must track login_started');
  assert(d.events.filter(e => e === 'quiz_answered').length === 3,
    'all three quiz answers must be tracked (lean payloads, no values)');
  assert(d.events.includes('onboarding_screen_viewed'),
    'screen views must be tracked');

  // 5. The gating rule: a 15-minute total disables every messaging range it
  //    cannot contain (including the 20-minute "I don't know" estimate).
  const one = boot();
  const od = one.window.document;
  od.getElementById('slider').value = '15';
  od.getElementById('slider').dispatchEvent(new one.window.Event('input'));
  const otap = sel => od.querySelector(sel).click();
  otap('#s1 [data-next]');
  await settle(1100);
  otap("#s2 .opt[data-mot='presentWithPeople']");
  await settle(1400);
  otap('#s3 .btn');
  await settle(1100);
  const dead = [...od.querySelectorAll('#s4 .opt[disabled]')];
  assert.strictEqual(dead.length, 5,
    'every range above a 15-minute total must be disabled');
  const alive = od.querySelector('#s4 .opt:not([disabled])');
  assert.strictEqual(alive.dataset.m, '10', 'only "< 10 mins" can remain');
  alive.click();
  await settle(6300);                           // beat + calculating + S5 dwell
  assert.strictEqual(od.getElementById('years-lost').textContent, '0.6 years',
    'the projection stays honest at the minimum');
  od.getElementById('s5').click();
  await settle(1500);
  assert.strictEqual(od.getElementById('col-dm-v').textContent, '10 m / day');
  otap('#s6 [data-next]');
  await settle(1900);
  assert.strictEqual(od.getElementById('years-back').textContent, '0.2 years');
  otap('#s7 [data-next]');
  await settle(1100);
  otap('#s8a [data-next]');
  await settle(1100);
  otap('#s8b [data-next]');
  await settle(1100);
  otap('#s9 [data-next]');
  await settle(1100);
  otap('#signin');
  assert.deepStrictEqual(one.went, [INBOX + '#konvo=presentWithPeople.1'],
    'weekly hours floor at 1 so the paywall sentence never says zero');

  console.log('ALL ONBOARDING TESTS PASS');
  process.exit(0);
})();
