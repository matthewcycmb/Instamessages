// Exercises the cage's logic against fake Instagram markup. This is the only
// automated check the wrapper has: everything else lives in Instagram's own
// page, which cannot be tested without a device.
//
//   npm install jsdom          (once, in this directory)
//   python3 extract.py && node --check cage.js && node test_cage.js
//
// Always run extract.py first - it pulls CAGE_SCRIPT out of lib.rs exactly as
// rustc lexes it, and fails if a stray quote-hash has closed the raw string.
const fs = require('fs');
const assert = require('assert');
const { JSDOM } = require('jsdom');

const CAGE = fs.readFileSync(__dirname + '/cage.js', 'utf8');
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1';
const DESKTOP = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Safari/605.1.15';

const open = [];
function boot(path, html, opts = {}) {
  const dom = new JSDOM(`<body>${html}</body>`, {
    url: 'https://www.instagram.com' + path,
    runScripts: 'outside-only',
    pretendToBeVisual: true,
  });
  // jsdom ignores the userAgent option here, and the cage branches on it.
  Object.defineProperty(dom.window.navigator, 'userAgent',
    { value: opts.ua || IPHONE, configurable: true });
  // The paywall's auth gate is the ds_user_id cookie: present for a
  // signed-in user unless the case is explicitly loggedOut. The fetch
  // (the badge poll) never resolves, as before.
  if (!opts.loggedOut) dom.window.document.cookie = 'ds_user_id=1234567';
  // Beta builds prepend window.__konvoBeta=true before the cage runs.
  if (opts.beta) dom.window.__konvoBeta = true;
  dom.window.fetch = () => new Promise(() => {});
  // Paywall state, seeded before the cage runs: `paid` is the offline cache a
  // paying user relies on; `bridge` stands in for KonvoStore.swift and gets
  // every postMessage the wall sends, replying via __konvoStoreReply.
  if (opts.paid) dom.window.localStorage.setItem('konvoPaid', '1');
  if (opts.patch) dom.window.localStorage.setItem('konvoPatch', JSON.stringify(opts.patch));
  if (opts.bridge) dom.window.webkit = { messageHandlers: { konvoStore: {
    postMessage: m => opts.bridge(m, dom) } } };
  // jsdom refuses to navigate and locks window.location, so shadow `location`
  // with a recorder. dom.went holds every place the cage tried to send us.
  dom.went = [];
  const q = path.indexOf('?');
  dom.window.__loc = {
    hostname: 'www.instagram.com',
    pathname: q < 0 ? path : path.slice(0, q),
    search: q < 0 ? '' : path.slice(q),
    hash: opts.hash || '',
    href: 'https://www.instagram.com' + path,
    replace: t => dom.went.push(t),
    assign: t => dom.went.push(t),
    reload: () => dom.went.push('reload'),
  };
  dom.window.eval(`(function (location) {${CAGE}})(window.__loc)`);
  open.push(dom);
  return dom;
}
const settle = ms => new Promise(r => setTimeout(r, ms || 1000));
// The cage installs setIntervals; without this node never exits.
process.on('exit', () => open.forEach(d => d.window.close()));

(async () => {
  // 1. Everything feed-shaped stays caged. Home is in the list: in-app posting
  //    is gone, so nothing needs "/" to be reachable, and the feed can no
  //    longer render even behind CSS. The two exemptions — a sent reel (7) and
  //    stories (8) — are each asserted in both directions below.
  const leaks = ['/', '/?variant=following', '/reels/', '/explore/',
    '/someuser/reels/', '/someuser/tagged/'].map(p => [p, boot(p, '')]);
  await settle();
  for (const [p, d] of leaks) {
    assert(d.went.includes('/direct/inbox/'), `${p} must be caged`);
  }

  // 2. What the injected CSS does and does not shut. jsdom will not evaluate
  //    :has(), so assert on the rules themselves.
  const sheets = [...boot('/direct/inbox/', '')
    .window.document.querySelectorAll('style')].map(s => s.textContent).join('');
  assert(!/aria-label="Notifications"/.test(sheets),
    'the notifications heart must stay visible on the phone');
  const deskSheets = [...boot('/direct/inbox/', '', { ua: DESKTOP })
    .window.document.querySelectorAll('style')].map(s => s.textContent).join('');
  assert(!/aria-label="Notifications"/.test(deskSheets),
    'the desktop heart stays - flip-flopped twice, re-added by request 2026-07-31');
  // Avatars used to be inert (pointer-events:none) because profiles were
  // unreachable. Profiles are a deliberate doorway now, and that rule also
  // killed taps on the notes tray - which is built out of avatars - so
  // liking a friend's note did nothing. Avatars must stay TAPPABLE.
  assert(!/pointer-events:\s*none/.test(sheets),
    'avatars must stay tappable - notes are avatars, and profiles are open now');
  assert(!/a:has\(svg\[aria-label="Messages"\]\)/.test(sheets),
    'Messages must stay: it is the only way back to the inbox from a profile');
  assert(/aria-label="New post"/.test(sheets),
    'the + stays hidden: builds 28-29 proved web posting routes through "/" (settled 2026-07-31)');

  // 3. The nav's Profile entry is an avatar link with no nav ancestor and no
  //     aria-label - only its position outside <main> tells it apart from the
  //     faces that must stay visible.
  const avatar = '<a href="/me/"><img alt="me\'s profile picture"><span>Profile</span></a>';
  const rail = boot('/direct/inbox/', avatar + '<main>' + avatar + '</main>');
  await settle();
  const links = [...rail.window.document.querySelectorAll('a[href="/me/"]')];
  assert(links[0].style.display === 'none', "the nav's Profile entry must be hidden");
  assert(links[1].style.display !== 'none',
    'avatars inside main are content - hiding them leaves a hole in the profile header');

  // 4. Profiles themselves are open now: you cannot message someone you just
  //     met without first reaching their profile.
  const profiles = ['/someuser/', '/some.user_1', '/accounts/edit/',
    '/p/abc/', '/tv/xyz/'].map(p => [p, boot(p, '')]);
  await settle();
  for (const [p, d] of profiles) {
    assert(!d.went.includes('/direct/inbox/'), `${p} must not be caged`);
  }

  // 5. Tapping media in a thread must now REACH Instagram, so the reel someone
  //    sent actually plays. This assertion is the exact inverse of what it used
  //    to be: the swallower that blocked these taps has been deleted. Covers all
  //    three shapes the tap really lands on: the <video>, a poster <img>
  //    thumbnail (what a sent reel renders as), and a transparent overlay
  //    sitting on top of the thumbnail.
  const shapes = {
    video: '<div id="bubble"><video src="r.mp4"></video></div>',
    thumbnail: '<div id="bubble"><img src="poster.jpg"></div>',
    overlay: '<div id="bubble"><div id="hit"><img src="poster.jpg"></div></div>',
  };
  for (const [name, html] of Object.entries(shapes)) {
    const d = boot('/direct/t/123/', html);
    let viewerOpened = false;
    d.window.document.getElementById('bubble')      // Instagram's own handler
      .addEventListener('click', () => { viewerOpened = true; });
    const target = name === 'overlay' ? '#hit' : (name === 'video' ? 'video' : 'img');
    const ev = new d.window.MouseEvent('click', { bubbles: true, cancelable: true });
    d.window.document.querySelector(target).dispatchEvent(ev);
    assert(viewerOpened, `${name}: tap must reach Instagram so the reel plays`);
    assert(!ev.defaultPrevented, `${name}: tap must not be swallowed any more`);
  }

  // ...and ordinary taps in a thread must still work, as they always did.
  const composer = boot('/direct/t/123/', '<div id="send"><span>Send</span></div>');
  let sent = false;
  composer.window.document.getElementById('send').addEventListener('click', () => { sent = true; });
  composer.window.document.querySelector('span').dispatchEvent(
    new composer.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  assert(sent, 'non-media taps in a thread must still work');

  // 5b. A link someone sent goes to the real browser, not nowhere and not
  //     into the cage. Instagram's own links must be left alone, or every
  //     in-app navigation would be handed to Safari.
  const link = boot('/direct/t/123/',
    '<a href="https://canva.link/u471" target="_blank">Untitled design</a>' +
    '<a href="https://www.instagram.com/direct/t/9/" id="own">thread</a>');
  const opened = [];
  link.window.__TAURI_INTERNALS__ = { invoke: (cmd, args) => { opened.push([cmd, args.url]); return Promise.resolve(); } };
  const ext = new link.window.MouseEvent('click', { bubbles: true, cancelable: true });
  link.window.document.querySelector('a[target="_blank"]').dispatchEvent(ext);
  assert(ext.defaultPrevented, 'an external link must not be left to window.open');
  assert.deepStrictEqual(opened, [['plugin:opener|open_url', 'https://canva.link/u471']],
    'the link should have been handed to the real browser');
  const own = new link.window.MouseEvent('click', { bubbles: true, cancelable: true });
  link.window.document.getElementById('own').dispatchEvent(own);
  assert(!own.defaultPrevented, "Instagram's own links must stay in the app");
  assert.strictEqual(opened.length, 1, 'only external links go to the browser');

  // 5c. Mobile DM bubbles and story link stickers use window.open, a silent
  //     no-op in a webview - the tap died there, on device, twice. It must
  //     route out like a click, with Meta's l.instagram.com linkshim
  //     unwrapped so the browser gets the real destination, and identical
  //     back-to-back opens (anchor handler + Instagram's own window.open on
  //     one tap) must collapse into one Safari tab.
  const sticker = boot('/stories/bob/314/', '');
  const stickerOpened = [];
  sticker.window.__TAURI_INTERNALS__ =
    { invoke: (cmd, args) => { stickerOpened.push(args.url); return Promise.resolve(); } };
  sticker.window.open('https://l.instagram.com/?u=https%3A%2F%2Fshop.example%2Fx&e=ATO');
  assert.deepStrictEqual(stickerOpened, ['https://shop.example/x'],
    'a story link sticker must reach the real browser, unwrapped');
  sticker.window.open('https://l.instagram.com/?u=https%3A%2F%2Fshop.example%2Fx&e=ATO');
  assert.strictEqual(stickerOpened.length, 1, 'one tap must not open Safari twice');
  sticker.window.open('https://www.instagram.com/p/abc/');
  assert.strictEqual(stickerOpened.length, 1, "Instagram's own new-tab opens stay in the app");
  assert.strictEqual(sticker.window.__loc.href, 'https://www.instagram.com/p/abc/',
    'an in-app new-tab open must navigate in place instead');

  //     ...and a linkshim-wrapped <a> in a DM goes out unwrapped, not into
  //     the cage as an instagram.com navigation.
  const shim = boot('/direct/t/123/',
    '<a href="https://l.instagram.com/?u=https%3A%2F%2Fnews.example%2Fa" target="_blank">news</a>');
  const shimOpened = [];
  shim.window.__TAURI_INTERNALS__ =
    { invoke: (cmd, args) => { shimOpened.push(args.url); return Promise.resolve(); } };
  const sev = new shim.window.MouseEvent('click', { bubbles: true, cancelable: true });
  shim.window.document.querySelector('a').dispatchEvent(sev);
  assert(sev.defaultPrevented, 'a linkshim anchor must not navigate the webview');
  assert.deepStrictEqual(shimOpened, ['https://news.example/a'],
    'the linkshim must unwrap to the real URL');

  // 6. Regression guard: inbox rows use avatar images as their tap target, so
  //    the media blocker must not reach the conversation list.
  const list = boot('/direct/inbox/', '<div id="row"><img src="avatar.jpg"><span>aliisa</span></div>');
  let openedChat = false;
  list.window.document.getElementById('row').addEventListener('click', () => { openedChat = true; });
  list.window.document.querySelector('img').dispatchEvent(
    new list.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  assert(openedChat, 'tapping a conversation avatar must still open the chat');

  // 7. A reel someone sent is watchable, but only that one. The permalink and
  //    the feed differ by a single letter, so both directions are asserted:
  //    tightening the pattern back to /reels?/ re-cages what a friend sent,
  //    loosening it to /reel/ opens the infinite feed.
  const reel = boot('/reel/Cabc123/', '', { ua: DESKTOP });
  await settle();
  assert(!reel.went.includes('/direct/inbox/'), 'a sent reel must be watchable');
  const feed = boot('/reels/', '', { ua: DESKTOP });
  await settle();
  assert(feed.went.includes('/direct/inbox/'), 'the reels feed must stay caged');

  // ...and there must be no way to swipe, scroll, or arrow out of it into the
  // next one. wheel is the Mac, touchmove is the phone, and neither handler is
  // UA-gated - so the phone gets its own boot rather than a second dispatch
  // against the desktop one.
  const wheel = new reel.window.Event('wheel', { bubbles: true, cancelable: true });
  reel.window.document.body.dispatchEvent(wheel);
  assert(wheel.defaultPrevented, 'scrolling out of a reel must be blocked');

  const phone = boot('/reel/Cabc123/', '', { ua: IPHONE });
  await settle();
  assert(!phone.went.includes('/direct/inbox/'), 'a sent reel must be watchable on the phone too');
  const swipe = new phone.window.Event('touchmove', { bubbles: true, cancelable: true });
  phone.window.document.body.dispatchEvent(swipe);
  assert(swipe.defaultPrevented, 'swiping out of a reel must be blocked');

  // ...and the phone's viewer, which never changes the URL, so it is recognised
  // by a <video> that fills the viewport instead. Confirmed on device: without
  // this, swiping in the phone's player walks into suggested reels. jsdom has no
  // layout, so the rect is stubbed - the height ratio is the whole assertion.
  const player = boot('/direct/t/123/', '<video src="r.mp4"></video>', { ua: IPHONE });
  const vid = player.window.document.querySelector('video');
  vid.getBoundingClientRect = () => ({ height: player.window.innerHeight });
  const flick = new player.window.Event('touchmove', { bubbles: true, cancelable: true });
  let instagramSaw = false;
  player.window.document.body.addEventListener('touchmove', () => { instagramSaw = true; });
  player.window.document.body.dispatchEvent(flick);
  assert(flick.defaultPrevented, 'swiping in the phone player must be blocked');
  assert(!instagramSaw, "the swipe must never reach Instagram's own handler");

  // ...but a small video bubble in a thread is not the player, so the
  // conversation still scrolls past it.
  const bubble = boot('/direct/t/123/', '<video src="r.mp4"></video>', { ua: IPHONE });
  bubble.window.document.querySelector('video').getBoundingClientRect =
    () => ({ height: 120 });
  const past = new bubble.window.Event('touchmove', { bubbles: true, cancelable: true });
  bubble.window.document.body.dispatchEvent(past);
  assert(!past.defaultPrevented, 'a thread with a video clip must still scroll');

  // ...and /reel/ with no code after it is the feed by another name.
  const bare = boot('/reel/', '', { ua: DESKTOP });
  await settle();
  assert(bare.went.includes('/direct/inbox/'), 'bare /reel/ must stay caged');

  // ...and the player must not be silent. Instagram ships it muted; a reel a
  // friend sent is meant to be heard. Small video bubbles in a thread keep
  // Instagram's own muted autoplay, which is what you want scrolling a chat.
  const sound = boot('/direct/t/123/',
    '<video id="big"></video><video id="small"></video><audio id="track"></audio>',
    { ua: IPHONE });
  const big = sound.window.document.getElementById('big');
  const small = sound.window.document.getElementById('small');
  const track = sound.window.document.getElementById('track');
  for (const e of [big, small, track]) e.muted = true;
  big.getBoundingClientRect = () => ({ height: sound.window.innerHeight });
  small.getBoundingClientRect = () => ({ height: 100 });
  track.getBoundingClientRect = () => ({ height: 0 });
  big.dispatchEvent(new sound.window.Event('playing'));
  assert(!big.muted, 'the reel player must be unmuted');
  assert(!track.muted, 'a separate audio stream must be unmuted too');
  assert(small.muted, 'a clip in the thread behind the player must stay muted');

  // ...and muting it by hand must stick, which is why this is driven by media
  // events rather than by sweep.
  big.muted = true;
  sound.window.document.body.appendChild(sound.window.document.createElement('div'));
  await settle(50);
  assert(big.muted, 'unmute must not fight the user muting it back');

  const down = new reel.window.KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true });
  reel.window.document.body.dispatchEvent(down);
  assert(down.defaultPrevented, 'arrowing to the next reel must be blocked');
  const space = new reel.window.KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
  reel.window.document.body.dispatchEvent(space);
  assert(!space.defaultPrevented, 'space must still pause the video');

  // ...and none of that may leak into a thread, where scrolling back through
  // the conversation is the whole point.
  const thread = boot('/direct/t/123/', '', { ua: IPHONE });
  const scroll = new thread.window.Event('touchmove', { bubbles: true, cancelable: true });
  thread.window.document.body.dispatchEvent(scroll);
  assert(!scroll.defaultPrevented, 'a thread must still scroll');

  // 8. Stories are watchable: viewer and highlights URLs survive on both
  //    platforms. The way out needs no lock of its own — the viewer only walks
  //    people you follow, and its exit lands on "/", which test 1 cages.
  const stories = ['/stories/bob/3141/', '/stories/highlights/17/'].flatMap(p =>
    [[p, boot(p, '', { ua: DESKTOP })], [p, boot(p, '')]]);
  await settle();
  for (const [p, d] of stories) {
    assert(!d.went.includes('/direct/inbox/'), `${p} must be watchable`);
  }

  // 8b. A post page is not the reel player: a tall video post must not trip
  //     the gesture lock, or comments stop scrolling and the desktop's
  //     next/prev arrows through a profile's grid die.
  const post = boot('/p/abc123/', '<video src="v.mp4"></video>', { ua: DESKTOP });
  post.window.document.querySelector('video').getBoundingClientRect =
    () => ({ height: post.window.innerHeight });
  const postWheel = new post.window.Event('wheel', { bubbles: true, cancelable: true });
  post.window.document.body.dispatchEvent(postWheel);
  assert(!postWheel.defaultPrevented, 'a post page must scroll even with a tall video');

  // 9. The phone's notifications doorway. The mobile inbox renders no tab bar
  //    (confirmed by screenshot on device), so the cage injects its own heart
  //    linking to Instagram's activity page - phone-only.
  const heartPhone = boot('/direct/inbox/', '');
  const h = heartPhone.window.document.getElementById('im-heart');
  // /notifications/ on the phone, /accounts/activity/ on the Mac: measured
  // on device - pushing the desktop path made Instagram render
  // /notifications/ anyway, which is what the full page load was for.
  assert(h && h.getAttribute('href') === '/notifications/',
    'the phone inbox must carry the injected heart, pointed at the phone route');
  assert(!boot('/direct/inbox/', '', { ua: DESKTOP }).window.document.getElementById('im-heart'),
    'no heart on the Mac - tried in build 25, reverted same-day');
  const activity = boot('/accounts/activity/', '');
  await settle();
  assert(!activity.went.includes('/direct/inbox/'), 'the activity page must stay reachable');

  // The build-29 /create/story/ probe is gone: tested on device 2026-07-31,
  // Instagram redirected it through "/", so no posting doorway may exist.
  assert(!heartPhone.window.document.getElementById('im-create'),
    'the story probe must stay deleted - the experiment is settled');

  // 10. The paywall sequence. iOS is the paid platform: an unpaid iPhone at
  //     the inbox gets S12 connected -> S12b loader -> perks comparison ->
  //     S13 three-package paywall, on real timers. The Mac never does, a
  //     cached konvoPaid suppresses it with no bridge round-trip, and it
  //     only rises at the inbox, never over a thread.
  const wallFresh = boot('/direct/inbox/', '');
  const wallDesk = boot('/direct/inbox/', '', { ua: DESKTOP });
  const wallPaid = boot('/direct/inbox/', '', { paid: true });
  const wallThread = boot('/direct/t/123/', '');
  const wallOut = boot('/direct/inbox/', '', { loggedOut: true });
  const wallBeta = boot('/direct/inbox/', '', { beta: true });
  await settle(1300);   // auth check, then the next ensure tick
  const wdoc = wallFresh.window.document;
  const payText = () => wdoc.getElementById('im-pay').textContent;
  assert(wdoc.getElementById('im-pay'), 'an unpaid iPhone inbox must get the wall');
  assert(/Instagram connected\./.test(payText()),
    'the sequence must open on the connected confirmation');
  assert(!wallDesk.window.document.getElementById('im-pay'),
    'no paywall on the Mac');
  assert(!wallPaid.window.document.getElementById('im-pay'),
    'a cached konvoPaid must suppress the wall without any bridge');
  assert(!wallThread.window.document.getElementById('im-pay'),
    'the wall only rises at the inbox');
  //     The trap this closes: /direct/inbox/ renders for a beat before
  //     Instagram bounces a signed-out visitor, and a wall raised there
  //     takes money from someone who then lands on a login page.
  assert(!wallOut.window.document.getElementById('im-pay'),
    'no verified Instagram session, no paywall - ever');
  //     Beta builds now walk the SAME wall as everyone else - skipping it
  //     produced zero pricing data from eighteen testers. What they get is
  //     an escape hatch, and it exists only in a beta binary: a store build
  //     has no such markup and no handler, so no remote config can conjure
  //     one.
  assert(wallBeta.window.document.getElementById('im-pay'),
    'a beta build must raise the real wall - that is where the pricing data comes from');
  await settle(2600);  // the loader (auth tick + slow cadence + crossfade)
  assert(/Setting up your Konvo/.test(payText()),
    'connected must auto-advance into the honest loader');
  assert(/Friends' stories kept/.test(payText()),
    'every loader line is a real cage rule');
  await settle(5200);  // ~7.6s in: the perks comparison
  assert(/Why this one works/.test(payText()),
    'the loader must auto-advance into the comparison');
  assert(/Going back takes a decision/.test(payText()),
    'every row is a true structural claim');
  const wtap = act => {
    const el = wdoc.querySelector(`[data-act='${act}']`);
    assert(el, `the ${act} control must exist on the current page`);
    el.dispatchEvent(new wallFresh.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  };
  // Perks now lead through the delete-Instagram step: Konvo replaces
  // Instagram rather than sitting beside it, and the ask lands right after
  // the comparison that justifies it.
  wtap('goodbye');
  await settle(400);
  assert(/Delete Instagram/.test(payText()),
    'the perks page must lead to the delete step');
  assert(/Your account does not change/.test(payText()),
    'the delete step must say nothing is lost - it is a true claim and it defuses the ask');
  wtap('pay');
  await settle(450);   // crossfade
  assert(/How your free trial works/.test(payText()),
    'Continue on the perks page must reach S13');
  assert(/First 14 days free, then \$29\.99 a year\./.test(payText()),
    'the headline states the real yearly charge');
  assert(/\$2\.50/.test(payText()) && /per month/.test(payText()),
    'the Annual card prices by the month, the number shoppers compare');
  assert(/SAVE 50%/.test(payText()),
    'the honest computed discount must show on the Annual card');
  assert(/Try for \$0\.00/.test(payText()),
    'the trial CTA is Try for $0.00');
  assert(/No commitment, cancel anytime/.test(payText()),
    'the reassurance row sits above the CTA');
  assert(/Pay once, keep it/.test(payText()),
    'the Lifetime card carries its badge');
  assert(/In 7 days/.test(payText()) && /In 14 days/.test(payText()),
    'three nodes only: today, halfway, charge - the page must fit one screen');
  assert(!/In 12 days/.test(payText()),
    'the fourth node is gone');
  assert(/We'll remind you before anything is charged\./.test(payText()),
    'the reminder promise rides the halfway node');

  //     The three packages are side-by-side selectable; each tells its own
  //     truth. Monthly: no trial language. Lifetime: one-step, one-time.
  wtap('pk-m');
  assert(/\$4\.99 a month, cancel anytime\./.test(payText()),
    'the Monthly card must state its own price');
  assert(!/days free/.test(payText()),
    'no trial language may survive on Monthly');
  assert(/Continue with Monthly/.test(payText()),
    'Monthly must have its own CTA');
  wtap('pk-l');
  assert(/\$79\.99 once\. Lifetime access\./.test(payText()),
    'Lifetime states the one-time price and the exact phrase Lifetime access');
  assert(/Pay \$79\.99 once\. That's it\./.test(payText()),
    'the Lifetime timeline is a one-step confirmation');
  assert(/Get Lifetime access/.test(payText()),
    'the Lifetime CTA');
  assert(/Pay once\. No subscription\./.test(payText()),
    'the Lifetime reassurance replaces cancel-anytime');
  assert(!/forever/i.test(payText()),
    'the word forever is banned copy');
  wtap('pk-y');
  assert(/First 14 days free/.test(payText()) && /In 14 days/.test(payText()),
    'flipping back to Annual must restore the trial story');

  //     The x does not dismiss: it reveals the not-ready section and flips
  //     to the Monthly story. The wall itself never goes away unpaid.
  wtap('notready');
  assert(/Not ready to commit for a year\? Monthly is \$4\.99/.test(payText()),
    'the x must concede into the softer monthly path');
  assert(/Continue with Monthly/.test(payText()),
    'the not-ready state shows the Monthly story');
  assert(wdoc.getElementById('im-pay'), 'the wall must survive the x');
  wtap('pk-y');
  assert(/Try for \$0\.00/.test(payText()),
    'Annual must still be reachable after not-ready');

  //     Live values beat the stand-ins: a bridge that answers products
  //     reprices the whole page, including a 7-day ASC trial. The paywall
  //     never hardcodes money (locked decision).
  const posted = [];
  const answer = replies => (m, d) => {
    posted.push(m.cmd + ':' + (m.event || m.productId || ''));
    if (m.cmd in replies) d.window.__konvoStoreReply(m.id, replies[m.cmd]);
  };
  const LIVE_PRODUCTS = { ok: true,
    yearly: { price: 'US$39.99', perWeek: 'US$0.77', perMonth: 'US$3.33',
      savePct: 33, trialDays: 7 },
    monthly: { price: 'US$4.99' }, lifetime: { price: 'US$99.99' } };
  const live = boot('/direct/inbox/', '', { bridge: answer({
    entitlements: { entitled: false },
    products: LIVE_PRODUCTS,
  }) });
  await settle(8400);
  const ldoc0 = live.window.document;
  const ltap = act => ldoc0.querySelector(`[data-act='${act}']`).dispatchEvent(
    new live.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  // Same route as a real user: perks -> delete step -> price.
  ltap('goodbye');
  await settle(400);
  ltap('pay');
  await settle(450);
  const ltext = ldoc0.getElementById('im-pay').textContent;
  assert(/First 7 days free, then US\$39\.99 a year\./.test(ltext),
    'live values must replace the stand-ins');
  assert(/US\$3\.33/.test(ltext),
    'the card must carry the live per-month price');
  assert(/SAVE 33%/.test(ltext),
    'the discount must be the live-computed percentage');
  assert(/US\$99\.99/.test(ltext),
    'the Lifetime card must carry the live price');
  assert(/In 4 days/.test(ltext) && /In 7 days/.test(ltext),
    'halfway and charge nodes must follow the live trial length');
  assert(posted.includes('products:'),
    'the sequence must ask the bridge for products');
  assert(posted.includes('track:login_succeeded') &&
    posted.includes('track:paywall_viewed'),
    'the funnel events must reach the bridge');

  //     A trial-ineligible user gets the no-trial Annual story.
  const noTrial = boot('/direct/inbox/', '', { bridge: answer({
    entitlements: { entitled: false },
    products: { ok: true, yearly: { price: '$29.99', perWeek: '$0.58',
      perMonth: '$2.50', savePct: 50 }, monthly: { price: '$4.99' },
      lifetime: { price: '$79.99' } },
  }) });
  await settle(8400);
  // Perks -> delete step -> price, as a real user walks it.
  noTrial.window.document.querySelector("[data-act='goodbye']").dispatchEvent(
    new noTrial.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  await settle(400);
  noTrial.window.document.querySelector("[data-act='pay']").dispatchEvent(
    new noTrial.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  await settle(450);
  const ntext = noTrial.window.document.getElementById('im-pay').textContent;
  assert(/How your plan works/.test(ntext) && !/days free/.test(ntext),
    'no trial may be described when the user is ineligible');
  assert(/Continue with Annual/.test(ntext) && /In 12 months/.test(ntext),
    'the ineligible Annual story is renewal framing');
  assert(/\$2\.50\/month/.test(ntext),
    'the ineligible headline prices by the month too');

  //     The #konvo fragment from the onboarding persists into this origin,
  //     and the paywall speaks the complete motive sentence.
  const quiz = boot('/direct/inbox/', '', { hash: '#konvo=ownProjects.15' });
  await settle(8400);
  assert.strictEqual(quiz.window.localStorage.getItem('konvoQuiz'), 'ownProjects.15',
    'the fragment must persist into instagram.com-origin storage');
  quiz.window.document.querySelector("[data-act='goodbye']").dispatchEvent(
    new quiz.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  await settle(400);
  quiz.window.document.querySelector("[data-act='pay']").dispatchEvent(
    new quiz.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  await settle(450);
  assert(/About 15 hours a week for projects you care about\./.test(
    quiz.window.document.getElementById('im-pay').textContent),
    'the paywall must speak the complete motive sentence');

  //     A trial purchase lands on S14 activation: recap, notification ask
  //     (granted -> reminder set), then Open Konvo drops the wall.
  const buyer = boot('/direct/inbox/', '', { bridge: answer({
    entitlements: { entitled: false },
    products: LIVE_PRODUCTS,
    purchase: { ok: true, entitled: true },
    notify: { ok: true, granted: true },
  }) });
  await settle(8400);
  const bdoc = buyer.window.document;
  const btap = act => bdoc.querySelector(`[data-act='${act}']`).dispatchEvent(
    new buyer.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  btap('goodbye');
  await settle(400);
  btap('pay');
  await settle(450);
  btap('buy-y');
  await settle(450);   // crossfade to S14
  assert(posted.includes('purchase:konvo.pro.yearly'),
    'the Annual CTA must purchase the yearly product');
  const stext = bdoc.getElementById('im-pay').textContent;
  assert(/You're in\./.test(stext) && /Feed, Reels, Explore: gone\./.test(stext),
    'S14 opens on the confirmation');
  assert(/Free until/.test(stext),
    'a trial purchase gets the recap line');
  assert(/Turn on notifications/.test(stext),
    'the trial S14 carries the notification ask');
  btap('notify');
  await settle(100);
  assert(posted.includes('notify:'),
    'the ask must reach the bridge only on tap');
  assert(/Reminder set for/.test(bdoc.getElementById('im-pay').textContent),
    'a granted permission must confirm the reminder date');
  assert(posted.includes('track:notification_permission_result'),
    'the permission result must be tracked');
  btap('done');
  await settle(950);   // the wall fades off over .8s
  assert(!bdoc.getElementById('im-pay'), 'Open Konvo must drop the wall');
  assert.strictEqual(buyer.window.localStorage.getItem('konvoPaid'), '1',
    'a purchase must fill the offline cache');
  assert(posted.includes('track:onboarding_completed'),
    'completing the funnel must be tracked');

  //     Lifetime: its own recap, no notification ask, distinct product id.
  const lifer = boot('/direct/inbox/', '', { bridge: answer({
    entitlements: { entitled: false },
    products: LIVE_PRODUCTS,
    purchase: { ok: true, entitled: true },
  }) });
  await settle(8400);
  const ftap = act => lifer.window.document.querySelector(`[data-act='${act}']`)
    .dispatchEvent(new lifer.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  ftap('goodbye');
  await settle(400);
  ftap('pay');
  await settle(450);
  ftap('pk-l');
  ftap('buy-l');
  await settle(450);
  assert(posted.includes('purchase:konvo.pro.lifetime'),
    'the Lifetime CTA must purchase the non-consumable');
  const ftext = lifer.window.document.getElementById('im-pay').textContent;
  assert(/Lifetime access active\./.test(ftext),
    'a lifetime purchase gets its own recap');
  assert(!/Turn on notifications/.test(ftext),
    'no notification ask for lifetime - nothing to remind about');

  //     Monthly through its own card and product.
  const monthlyBuy = boot('/direct/inbox/', '', { bridge: answer({
    entitlements: { entitled: false },
    products: LIVE_PRODUCTS,
    purchase: { ok: true, entitled: true },
  }) });
  await settle(8400);
  const mtap = act => monthlyBuy.window.document.querySelector(`[data-act='${act}']`)
    .dispatchEvent(new monthlyBuy.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  mtap('goodbye');
  await settle(400);
  mtap('pay');
  await settle(450);
  mtap('pk-m');
  mtap('buy-m');
  await settle(450);
  assert(posted.includes('purchase:konvo.pro.monthly'),
    'the Monthly CTA must purchase konvo.pro.monthly');
  assert(/You're in\./.test(
    monthlyBuy.window.document.getElementById('im-pay').textContent),
    'S14 is generic success copy - true for monthly too');

  //     The verdict beats the cache in both directions.
  const lapsed = boot('/direct/inbox/', '', { paid: true, bridge: answer({
    entitlements: { entitled: false },
    restore: { ok: true, entitled: true },
  }) });
  await settle(9600);
  const ldoc = lapsed.window.document;
  assert(ldoc.getElementById('im-pay'),
    'a lapsed subscription must bring the wall back despite the cache');
  ldoc.querySelector("[data-act='goodbye']").dispatchEvent(
    new lapsed.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  await settle(400);
  ldoc.querySelector("[data-act='pay']").dispatchEvent(
    new lapsed.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  await settle(450);
  ldoc.querySelector("[data-act='restore']").dispatchEvent(
    new lapsed.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  assert(posted.includes('restore:'), 'Restore Purchases must reach the bridge');
  await settle(950);
  assert(!ldoc.getElementById('im-pay'), 'a successful restore must drop the wall');
  const reinstalled = boot('/direct/inbox/', '', { bridge: answer({
    entitlements: { entitled: true },
  }) });
  await settle();
  assert(!reinstalled.window.document.getElementById('im-pay'),
    'a reinstalling subscriber must never see the wall');
  assert.strictEqual(reinstalled.window.localStorage.getItem('konvoPaid'), '1',
    'the launch verdict must refill the offline cache');

  console.log('ALL CAGE TESTS PASS');
  process.exit(0);
})();
