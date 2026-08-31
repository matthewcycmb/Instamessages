// Exercises the cage's logic against fake Instagram markup. This is the only
// automated check the wrapper has: everything else lives in Instagram's own
// page, which cannot be tested without a device.
//
//   npm install               (once, in wrapper/)
//   npm test                  (from wrapper/: syntax check + both suites)
const fs = require('fs');
const assert = require('assert');
const { JSDOM } = require('jsdom');

// The SOURCE file, the same bytes include_str! ships: no extraction step,
// no committed copy, no way for a green suite to describe a stale cage.
const CAGE = fs.readFileSync(__dirname + '/../src-tauri/src/cage.js', 'utf8');
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
  // Free builds prepend window.__konvoFree=true. welcomed/betaFree are the
  // two markers that mean "this person has already seen the sequence".
  if (opts.free) dom.window.__konvoFree = true;
  if (opts.welcomed) dom.window.localStorage.setItem('konvoWelcomed', '1');
  if (opts.betaFree) dom.window.localStorage.setItem('konvoBetaFree', '1');
  if (opts.seed) for (const k in opts.seed) dom.window.localStorage.setItem(k, opts.seed[k]);
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
  // The walkthrough's bridge answers products like production does (Aug
  // 31): the wall no longer paints stand-in money, so a priced S13 needs
  // a live reply. The values are what the assertions below quote.
  const wallFresh = boot('/direct/inbox/', '', { hash: '#konvo=15', bridge: (m, d) => {
    if (m.cmd === 'products') d.window.__konvoStoreReply(m.id, { ok: true,
      yearly: { price: '$19.99', perWeek: '$0.38', perMonth: '$1.67', savePct: 76, trialDays: 7 },
      monthly: { price: '$6.99' }, lifetime: { price: '$19.99' } });
  } });
  const wallDesk = boot('/direct/inbox/', '', { ua: DESKTOP });
  const wallPaid = boot('/direct/inbox/', '', { paid: true });
  const wallThread = boot('/direct/t/123/', '');
  const wallOut = boot('/direct/inbox/', '', { loggedOut: true });
  const wallBeta = boot('/direct/inbox/', '', { beta: true });
  //     An update must never replay the welcome sequence. The free build
  //     reads konvoWelcomed, but a tester arriving from a beta build has
  //     only konvoBetaFree: the same fact under the other variant's name.
  //     Reading one alone sent every existing tester back through it.
  const wallFreeNew = boot('/direct/inbox/', '', { free: true });
  const wallFreeDone = boot('/direct/inbox/', '', { free: true, welcomed: true });
  const wallFreeFromBeta = boot('/direct/inbox/', '', { free: true, betaFree: true });
  // The connected beat lasts ~1.8s and its start jitters with the nine
  // parallel boots, so a fixed sleep fails short AND long (Aug 17). Poll
  // into the beat; it typically lands within half a second.
  const wdoc = wallFresh.window.document;
  const payText = () =>
    (wdoc.getElementById('im-pay') || {}).textContent || '';
  for (let i = 0; i < 40 && !/Instagram connected\./.test(payText()); i++)
    await settle(100);
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
  assert(wallFreeNew.window.document.getElementById('im-pay'),
    'a first-run free build must still play the welcome sequence');
  assert(!wallFreeDone.window.document.getElementById('im-pay'),
    'konvoWelcomed must keep the sequence away after an update');
  assert(!wallFreeFromBeta.window.document.getElementById('im-pay'),
    'a tester updating from a beta build must NOT be sent through it again');
  await settle(2600);  // the loader (auth tick + slow cadence + crossfade)
  assert(/Setting up your Konvo/.test(payText()),
    'connected must auto-advance into the honest loader');
  assert(/Friends' stories kept/.test(payText()),
    'every loader line is a real cage rule');
  await settle(5200);  // ~7.6s in: the reveal over the real inbox
  const wtap = act => {
    const el = wdoc.querySelector(`[data-act='${act}']`);
    assert(el, `the ${act} control must exist on the current page`);
    el.dispatchEvent(new wallFresh.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  };
  //     The reveal comes straight off the loader (Aug 22): the wall clears
  //     over the user's own inbox before any pitch.
  assert(wdoc.getElementById('im-pay').classList.contains('im-reveal') &&
    /Your DMs are still here\./.test(payText()),
    'the loader must auto-advance into the reveal');
  wtap('keep');
  await settle(450);
  assert(/Why Konvo works/.test(payText()),
    'keep must land on the comparison');
  assert(/No snooze button to cave to/.test(payText()),
    'every row is a true structural claim');
  // The delete-Instagram ask is gone (Aug 16): the block replaced it, and
  // perks lead straight to the impact screen.
  //     What the trial is FOR, before the price. The hours are the
  //     user's own quiz answer, carried across the origin boundary.
  wtap('impact');
  await settle(450);
  assert(/Start your Free Week/.test(payText()),
    'the impact page opens on the free week');
  assert(/reclaim 15 hours back/.test(payText()),
    "the impact page must use the visitor's own number from the quiz");
  assert(/Stay connected/.test(payText()) && /Reclaim your focus/.test(payText())
    && /Never get distracted/.test(payText()),
    'all three impact claims must render');
  assert(!/reviews|ratings|users|\d+K\+/i.test(payText()),
    'the impact page must invent no social proof - there is none to show');
  wtap('pay');
  await settle(450);   // crossfade
  assert(/How your free trial works/.test(payText()),
    'Continue on the perks page must reach S13');
  assert(/First 7 days free, then \$19\.99 a year\./.test(payText()),
    'the headline states the real yearly charge');
  assert(/SAVE 76%/.test(payText()) && !/POPULAR|RECOMMENDED/.test(payText()),
    'the Yearly badge is the live saving');
  assert(/Yearly Plan/.test(payText()) && /Monthly Plan/.test(payText())
    && !/Annual/.test(payText()),
    'the plans are called Yearly Plan and Monthly Plan, never Annual');
  assert(/\$1\.67\/month/.test(payText()) && /\$19\.99\/year/.test(payText()),
    'the Yearly card: monthly equivalent as the price, yearly charge beneath');
  assert(/\$6\.99\/month/.test(payText()) && !/Try free/.test(payText()),
    'the Monthly card carries its price; no card carries a trial line (Aug 21)');
  assert(!wdoc.querySelector("#im-pay [data-act='notready']"),
    'no x on the paywall (Aug 21): the plans are the only choice');
  assert(!wdoc.querySelector("#im-pay [data-act='pk-l']"),
    'no Lifetime card: two plans, wider cards (Aug 21)');
  assert(/Start your free 7 days/.test(payText()),
    'the trial CTA names the free days');
  assert(/No commitment, cancel anytime/.test(payText()),
    'the reassurance row sits above the CTA');
  assert(/In 4 days/.test(payText()) && /In 7 days/.test(payText()),
    'three nodes only: today, halfway, charge - the page must fit one screen');
  assert(!/In 12 days/.test(payText()),
    'the fourth node is gone');
  assert(/We'll remind you before anything is charged\./.test(payText()),
    'the reminder promise rides the halfway node');

  //     Both packages are side-by-side selectable; each tells its own
  //     truth. Monthly has no trial (ASC, Aug 21 evening).
  wtap('pk-m');
  assert(/How your plan works/.test(payText()) &&
    /\$6\.99 a month, cancel anytime\./.test(payText()),
    'the Monthly story states its price and no trial');
  assert(/Continue with Monthly/.test(payText()) && !/free/.test(payText()),
    'the Monthly CTA promises nothing free');
  assert(/Every month/.test(payText()) && /Renews at \$6\.99/.test(payText()),
    'the Monthly timeline says how much and how often');
  assert(!/forever/i.test(payText()),
    'the word forever is banned copy');
  wtap('pk-y');
  assert(/First 7 days free/.test(payText()) && /In 7 days/.test(payText()),
    'flipping back to Yearly must restore the trial story');

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
    monthly: { price: 'US$4.99', trialDays: 3 }, lifetime: { price: 'US$99.99' } };
  const live = boot('/direct/inbox/', '', { bridge: answer({
    entitlements: { entitled: false },
    products: LIVE_PRODUCTS,
  }) });
  await settle(8400);
  const ldoc0 = live.window.document;
  const ltap = act => ldoc0.querySelector(`[data-act='${act}']`).dispatchEvent(
    new live.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  // Same route as a real user: perks -> impact -> price.
  ltap('keep');
  await settle(450);
  ltap('impact');
  await settle(450);
  ltap('pay');
  await settle(450);
  const ltext = ldoc0.getElementById('im-pay').textContent;
  assert(/First 7 days free, then US\$39\.99 a year\./.test(ltext),
    'live values must replace the stand-ins');
  assert(/US\$3\.33\/month/.test(ltext) && /US\$39\.99\/year/.test(ltext),
    'the card must carry the live monthly equivalent and the live yearly price');
  assert(/SAVE 33%/.test(ltext),
    'the badge must be the live-computed saving');
  assert(/In 4 days/.test(ltext) && /In 7 days/.test(ltext),
    'halfway and charge nodes must follow the live trial length');
  ltap('pk-m');
  const mtext = ldoc0.getElementById('im-pay').textContent;
  assert(/First 3 days free, then US\$4\.99 a month\./.test(mtext) &&
    /Start your free 3 days/.test(mtext) && /In 3 days/.test(mtext),
    'a live monthly intro offer renders its own trial story, no rebuild needed');
  assert(posted.includes('products:'),
    'the sequence must ask the bridge for products');
  assert(posted.includes('track:login_succeeded') &&
    posted.includes('track:paywall_viewed'),
    'the funnel events must reach the bridge');

  //     The login count is a fact about the session, not the wall (Aug
  //     31): an entitled restorer is dismissed before the wall mounts,
  //     and the old wall-mount tracking missed every one - six silent
  //     sign-ins on build 60 alone. Once per install, wall or no wall.
  const restLog = [];
  const restorer = boot('/direct/inbox/', '', { bridge: (m, d) => {
    if (m.cmd === 'track') restLog.push(m.event);
    if (m.cmd === 'entitlements') d.window.__konvoStoreReply(m.id, { entitled: true });
  } });
  await settle(3400);   // boot verify + several enforce sweeps
  assert(!restorer.window.document.getElementById('im-pay'),
    'an entitled session must never see the wall');
  assert.strictEqual(restLog.filter(e => e === 'login_succeeded').length, 1,
    'the dismissed-wall restorer still counts as a login, exactly once');

  //     Opening a conversation is the only signal that the app was USED
  //     rather than merely launched, so it must fire once per crossing
  //     into a thread and never on the inbox or on a repeat sweep.
  //     enforce() runs on an 800ms interval, so every wait clears one tick.
  const seen = [];
  const threads = boot('/direct/inbox/', '', {
    bridge: m => { if (m.cmd === 'track') seen.push(m.event); } });
  const opens = () => seen.filter(e => e === 'thread_opened').length;
  await settle(900);
  assert(opens() === 0, 'sitting on the inbox must not count as opening a conversation');
  threads.window.__loc.pathname = '/direct/t/12345/';
  await settle(900);
  assert(opens() === 1, 'entering a thread must report exactly one thread_opened');
  await settle(900);
  assert(opens() === 1, 'staying in the same thread must not report again');
  threads.window.__loc.pathname = '/direct/inbox/';
  await settle(900);
  threads.window.__loc.pathname = '/direct/t/98765/';
  await settle(900);
  assert(opens() === 2, 'a second conversation must report again');
  //     The event carries nothing identifying - no thread id, ever.
  assert(!JSON.stringify(seen).includes('12345'),
    'thread_opened must never carry a thread id');

  //     Updating BETWEEN build variants must not replay the sequence. The
  //     keys are written by different builds - konvoWelcomed by the free
  //     one, konvoBetaFree by the beta one - and each used to be invisible
  //     to the other, so a 47->48 update walked the tester back through
  //     "Instagram connected" and the loader.
  const freeToBeta = boot('/direct/inbox/', '', { beta: true, welcomed: true,
    bridge: answer({ entitlements: { entitled: false } }) });
  const betaToFree = boot('/direct/inbox/', '', { free: true, betaFree: true,
    bridge: answer({ entitlements: { entitled: false } }) });
  const plainToBeta = boot('/direct/inbox/', '', { beta: true, paid: true,
    bridge: answer({ entitlements: { entitled: true } }) });
  await settle(3200);
  assert(!freeToBeta.window.document.getElementById('im-pay'),
    'free -> beta must not replay: konvoWelcomed means they have seen it');
  assert(!betaToFree.window.document.getElementById('im-pay'),
    'beta -> free must not replay either');
  assert(!plainToBeta.window.document.getElementById('im-pay'),
    'a paying user is never shown the sequence');

  //     And a paying user on a FRESH install - no cache at all - must not
  //     see a single frame while RevenueCat is still answering.
  const paidReinstall = boot('/direct/inbox/', '', {
    bridge: answer({ entitlements: { entitled: true } }) });
  await settle(1600);
  assert(!paidReinstall.window.document.getElementById('im-pay'),
    'the sequence must wait for the receipt, not start underneath a subscriber');

  //     The BETA build end to end, which is what testers actually walk:
  //     delete step -> impact -> the real price screen -> and the CTA lets
  //     them through to the inbox instead of touching StoreKit, because a
  //     beta cannot complete a purchase and a spinning button strands them.
  const betaEvents = [];
  const betaWalk = boot('/direct/inbox/', '', { beta: true, hash: '#konvo=12',
    bridge: (m, d) => {
      if (m.cmd === 'track') betaEvents.push(m.event);
      // A real device always answers this; without a reply the sequence
      // waits out the entitlement timeout before it starts.
      if (m.cmd === 'entitlements') d.window.__konvoStoreReply(m.id, { entitled: false });
      if (m.cmd === 'products') d.window.__konvoStoreReply(m.id, { ok: true,
        yearly: { price: '$19.99', perMonth: '$1.67', savePct: 66, trialDays: 7 },
        monthly: { price: '$4.99' }, lifetime: { price: '$29.99' } });
    } });
  await settle(8400);
  const btw = act => betaWalk.window.document.querySelector(`[data-act='${act}']`)
    .dispatchEvent(new betaWalk.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  const btext = () => betaWalk.window.document.getElementById('im-pay').textContent;
  btw('keep');
  await settle(450);
  btw('impact');
  await settle(450);
  assert(/Start your Free Week/.test(btext()) && /reclaim 12 hours back/.test(btext()),
    'beta must show the impact screen, with this visitor\'s own hours');
  btw('pay');
  await settle(450);
  assert(/How your free trial works/.test(btext()) && /\$19\.99/.test(btext()),
    'beta must show the real price screen');
  btw('buy-y');
  await settle(1400);   // no cageStatus answer here: the 900ms fallback confirms
  assert(/You're in\./.test(btext()),
    'the beta CTA must let a tester through without StoreKit');
  btw('done');
  await settle(950);   // dismiss() fades for 850ms before removing the node
  assert(!betaWalk.window.document.getElementById('im-pay'),
    'and Open my messages drops the wall');
  assert(!betaEvents.includes('purchase'),
    'and must never reach StoreKit');
  assert(betaEvents.includes('beta_free_taken'),
    'while still recording which plan was chosen - that tap is the pricing signal');

  //     A trial-ineligible user gets the no-trial Annual story.
  const noTrial = boot('/direct/inbox/', '', { bridge: answer({
    entitlements: { entitled: false },
    products: { ok: true, yearly: { price: '$29.99', perWeek: '$0.58',
      perMonth: '$2.50', savePct: 50 }, monthly: { price: '$4.99' },
      lifetime: { price: '$79.99' } },
  }) });
  await settle(8400);
  // Perks -> impact -> price, as a real user walks it.
  const nttap = act => noTrial.window.document.querySelector(`[data-act='${act}']`)
    .dispatchEvent(new noTrial.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  nttap('keep');
  await settle(450);
  nttap('impact');
  await settle(450);
  //     A user with no trial must not be sold one on the way in either.
  const itext = noTrial.window.document.getElementById('im-pay').textContent;
  assert(!/Free Week|days free/.test(itext),
    'the impact screen must not promise a free week to someone who is ineligible');
  assert(/Start using Konvo/.test(itext),
    'it falls back to a headline that is true without a trial');
  nttap('pay');
  await settle(450);
  const ntext = noTrial.window.document.getElementById('im-pay').textContent;
  assert(/How your plan works/.test(ntext) && !/days free/.test(ntext),
    'no trial may be described when the user is ineligible');
  assert(/Continue with Yearly/.test(ntext) && /In 12 months/.test(ntext),
    'the ineligible Annual story is renewal framing');
  assert(/\$2\.50\/month/.test(ntext),
    'the ineligible headline prices by the month too');

  //     The #konvo fragment from the onboarding persists into this origin.
  //     Since the motive screen was removed it carries the weekly hours
  //     alone, and what consumes them is the pre-paywall impact screen.
  const quiz = boot('/direct/inbox/', '', { hash: '#konvo=9' });
  await settle(8400);
  assert.strictEqual(quiz.window.localStorage.getItem('konvoQuiz'), '9',
    'the fragment must persist into instagram.com-origin storage');
  const qtap = act => quiz.window.document.querySelector(`[data-act='${act}']`)
    .dispatchEvent(new quiz.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  qtap('keep');
  await settle(450);
  qtap('impact');
  await settle(450);
  assert(/reclaim 9 hours back/.test(
    quiz.window.document.getElementById('im-pay').textContent),
    'the impact screen must speak the hours this visitor actually answered');

  //     A trial purchase lands on S14 activation: recap, notification ask
  //     (granted -> reminder set), then Open Konvo drops the wall.
  const buyer = boot('/direct/inbox/', '', { bridge: answer({
    entitlements: { entitled: false },
    products: LIVE_PRODUCTS,
    purchase: { ok: true, entitled: true },
    notify: { ok: true, granted: true },
    cageStatus: { supported: true, authorized: false, picked: false, active: false },
    cageAuthorize: { authorized: true }, cagePick: { count: 1 }, cageOn: { active: true },
  }) });
  await settle(8400);
  const bdoc = buyer.window.document;
  const btap = act => bdoc.querySelector(`[data-act='${act}']`).dispatchEvent(
    new buyer.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  btap('keep');
  await settle(450);
  btap('impact');
  await settle(450);
  btap('pay');
  await settle(450);
  assert(!posted.includes('cageOn:'), 'no shield before the purchase');
  btap('buy-y');
  await settle(450);   // crossfade to the Screen Time step
  assert(posted.includes('purchase:konvo.pro.yearly'),
    'the Annual CTA must purchase the yearly product');
  //     The Screen Time step comes AFTER the money (Aug 22): one last step.
  const stext = bdoc.getElementById('im-pay').textContent;
  assert(/One last step: Connect Konvo to Screen Time, securely\./.test(stext),
    'a purchase leads to the Screen Time step, not a confirmation');
  assert(posted.includes('notify:7'),
    'the reminder is scheduled with the trial length the moment the purchase lands');
  assert(!posted.includes('cageOn:'), 'still no shield before the user connects');
  btap('cage-setup-go');
  await settle(600);
  assert(posted.indexOf('cageOn:') > posted.indexOf('purchase:konvo.pro.yearly'),
    'the shield arms after the purchase and the pick');
  const ptext = bdoc.getElementById('im-pay').textContent;
  assert(/You're protected\./.test(ptext) && /Instagram is blocked\./.test(ptext) &&
    /Your DMs remain available through Konvo\./.test(ptext),
    'the last page says protected, blocked, DMs through Konvo');
  const scheck = bdoc.querySelector("#im-pay path[stroke-dasharray='24']");
  assert(scheck && /im-draw/.test(scheck.getAttribute('style') || ''),
    'the checkmark must draw itself in');
  assert(!bdoc.querySelector('#im-pay [data-act]'), 'the last page has nothing to tap');
  assert.strictEqual(buyer.window.localStorage.getItem('konvoDone'), '1',
    'finishing marks the install done, so a lapse later opens on the price');
  await settle(3600);   // 2.4s hold + the .8s fade, with slack
  assert(!bdoc.getElementById('im-pay'), 'the last page fades into the inbox on its own');
  assert.strictEqual(buyer.window.localStorage.getItem('konvoPaid'), '1',
    'a purchase must fill the offline cache');
  assert(posted.includes('track:onboarding_completed'),
    'completing the funnel must be tracked');


  //     Monthly through its own card and product.
  const monthlyBuy = boot('/direct/inbox/', '', { bridge: answer({
    entitlements: { entitled: false },
    products: LIVE_PRODUCTS,
    purchase: { ok: true, entitled: true },
  }) });
  await settle(8400);
  const mtap = act => monthlyBuy.window.document.querySelector(`[data-act='${act}']`)
    .dispatchEvent(new monthlyBuy.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  mtap('keep');
  await settle(450);
  mtap('impact');
  await settle(450);
  mtap('pay');
  await settle(450);
  mtap('pk-m');
  mtap('buy-m');
  await settle(1400);   // no cageStatus answer: the 900ms fallback confirmation
  assert(posted.includes('purchase:konvo.pro.monthly'),
    'the Monthly CTA must purchase konvo.pro.monthly');
  assert(/You're in\./.test(
    monthlyBuy.window.document.getElementById('im-pay').textContent),
    'a bridge that never answers cageStatus still confirms - true for monthly too');

  //     The verdict beats the cache in both directions.
  const lapsed = boot('/direct/inbox/', '', { paid: true, bridge: answer({
    entitlements: { entitled: false },
    restore: { ok: true, entitled: true },
    products: { ok: true,
      yearly: { price: '$19.99', perWeek: '$0.38', perMonth: '$1.67', savePct: 76, trialDays: 7 },
      monthly: { price: '$6.99' }, lifetime: { price: '$19.99' } },
  }) });
  await settle(9600);
  const ldoc = lapsed.window.document;
  assert(ldoc.getElementById('im-pay'),
    'a lapsed subscription must bring the wall back despite the cache');
  ldoc.querySelector("[data-act='keep']").dispatchEvent(
    new lapsed.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  await settle(450);
  ldoc.querySelector("[data-act='impact']").dispatchEvent(
    new lapsed.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  await settle(450);
  ldoc.querySelector("[data-act='pay']").dispatchEvent(
    new lapsed.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  await settle(450);
  ldoc.querySelector("[data-act='restore']").dispatchEvent(
    new lapsed.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  assert(posted.includes('restore:'), 'Restore Purchases must reach the bridge');
  await settle(1400);
  assert(/You're in\./.test(ldoc.getElementById('im-pay').textContent),
    'a successful restore runs the tail (here the fallback confirmation)');
  ldoc.querySelector("[data-act='done']").dispatchEvent(
    new lapsed.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  await settle(950);
  assert(!ldoc.getElementById('im-pay'), 'and the wall drops');
  //     A lapsed subscriber on an install that already finished the
  //     sequence (Aug 22) opens on the price and nothing else: no
  //     "Instagram connected", no loader, no pitch.
  const lapsedLog = [];
  const lapsedDone = boot('/direct/inbox/', '', { paid: true, bridge: (m, d) => {
    d.window.localStorage.setItem('konvoDone', '1');
    lapsedLog.push(m.cmd === 'track' ? 'track:' + m.event : m.cmd);
    const r = { entitlements: { entitled: false }, products: LIVE_PRODUCTS }[m.cmd];
    if (r) d.window.__konvoStoreReply(m.id, r);
  } });
  await settle(1200);
  const lddoc = lapsedDone.window.document;
  assert(lddoc.getElementById('im-pay') &&
    /Yearly Plan/.test(lddoc.getElementById('im-pay').textContent) &&
    /US\$39\.99/.test(lddoc.getElementById('im-pay').textContent),
    'a lapsed install must open straight on the paywall with live prices');
  assert(!/Instagram connected/.test(lddoc.getElementById('im-pay').textContent),
    'and never replay the connected page');
  assert(/Your plan ended\./.test(lddoc.getElementById('im-pay').textContent) &&
    /Instagram is unblocked until you pick a plan\./.test(lddoc.getElementById('im-pay').textContent),
    'the lapsed wall says why it is there');
  assert(!lddoc.querySelector("#im-pay [data-act='notready']") && !lddoc.querySelector("#im-pay [data-act='done']"),
    'and offers no way past it but a plan or Restore');
  assert(lapsedLog.includes('track:paywall_viewed') && !lapsedLog.includes('track:inbox_reveal_viewed'),
    'the paywall is what gets tracked, not the pitch');
  const reinstalled = boot('/direct/inbox/', '', { bridge: answer({
    entitlements: { entitled: true },
  }) });
  await settle();
  assert(!reinstalled.window.document.getElementById('im-pay'),
    'a reinstalling subscriber must never see the wall');
  assert.strictEqual(reinstalled.window.localStorage.getItem('konvoPaid'), '1',
    'the launch verdict must refill the offline cache');

  //     Login friction: the stages are Instagram's own routes. Each must
  //     report once per document, never on the interval sweep, and never
  //     for a signed-in visit - that is navigation, not friction.
  const stages = [];
  const stageBridge = m => {
    if (m.cmd === 'track' && m.event === 'login_step') stages.push(m.props.stage);
  };
  const chal = boot('/challenge/', '', { loggedOut: true, bridge: stageBridge });
  await settle(900);
  assert.deepStrictEqual(stages, ['challenge'],
    'a logged-out challenge page must report login_step:challenge once');
  await settle(900);
  assert.deepStrictEqual(stages, ['challenge'],
    'the interval sweep must not repeat the stage');
  const twofa = boot('/accounts/login/two_factor/', '',
    { loggedOut: true, bridge: stageBridge });
  await settle(900);
  assert.deepStrictEqual(stages, ['challenge', 'two_factor'],
    'two_factor must win over its /accounts/login prefix');
  const plainLogin = boot('/accounts/login/', '',
    { loggedOut: true, bridge: stageBridge });
  await settle(900);
  assert.deepStrictEqual(stages, ['challenge', 'two_factor', 'login'],
    'the plain login page must report as its own stage');
  const signedChal = boot('/challenge/', '', { bridge: stageBridge });
  await settle(900);
  assert.deepStrictEqual(stages, ['challenge', 'two_factor', 'login'],
    'a signed-in challenge visit must not report');

  //     The search-mode back arrow (Aug 24): hidden by the cage's CSS, its
  //     rect is zeros, so it is found by structure - same subtree as the
  //     search input - and tagged .im-keep-back on the sweep.
  const searchHtml = `<header><a href="/"><svg aria-label="Back"></svg></a></header>
    <div><div><a href="#back"><svg aria-label="Back"></svg></a><input type="text" placeholder="Search"></div></div>`;
  const searchPage = boot('/direct/inbox/', searchHtml, { bridge: () => {} });
  await settle(1000);
  const sdoc2 = searchPage.window.document;
  assert(sdoc2.querySelector("a[href='#back']").classList.contains('im-keep-back'),
    'the arrow beside the search input must be tagged to survive the hiding');
  assert(!sdoc2.querySelector("header a").classList.contains('im-keep-back'),
    'the header escape arrow must stay hidden');

  //     Login drop-off detail (Aug 23): taps by label, submits, the error
  //     Instagram shows (as an enum, never its text), and going to the
  //     background with the page up. Nothing typed ever leaves the page.
  const detail = [];
  const loginHtml = `<form id="f"><input name="username" value="alex.chen"><input name="password" type="password" value="hunter2">
    <button type="submit">Log in</button></form><a href="/accounts/password/reset/">Forgot password?</a>
    <button>Continue as alex.chen</button><div id="errbox"></div>`;
  const lp = boot('/accounts/login/', loginHtml, { loggedOut: true, bridge: m => {
    if (m.cmd === 'track') detail.push([m.event, m.props]);
  } });
  await settle(900);
  const ldoc2 = lp.window.document;
  const lclick = el => el.dispatchEvent(new lp.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  lclick(ldoc2.querySelector('a'));
  lclick(ldoc2.querySelectorAll('button')[1]);
  //     The Passwords-key hint: shown once on the first login field focus,
  //     gone on submit.
  //     Named before focus is read: a freshly inserted field is hinted by
  //     the observer, without waiting for the sweep.
  const late = ldoc2.createElement('input'); late.name = 'username'; late.type = 'text';
  ldoc2.getElementById('f').appendChild(late);
  await settle(50);
  assert.strictEqual(late.getAttribute('autocomplete'), 'username',
    'a field that appears late must be named at once, not on the next sweep');
  //     The hint waits for Instagram's logo to lay out; with none in this
  //     fixture it appears after the retry cap, still untapped.
  assert(!ldoc2.getElementById('im-keytip'),
    'no hint while the logo could still appear');
  await settle(4200);
  assert(/Press \u201CPasswords\u201D above your keyboard and search Instagram to find your account\./.test(
    (ldoc2.getElementById('im-keytip') || {}).textContent || ''),
    'landing on the sign-in form must show the Passwords-key hint, untapped');
  ldoc2.querySelector('input[name=username]').dispatchEvent(new lp.window.Event('focusin', { bubbles: true }));
  ldoc2.querySelector('input[name=password]').dispatchEvent(new lp.window.Event('focusin', { bubbles: true }));
  assert.strictEqual(ldoc2.querySelectorAll('#im-keytip').length, 1, 'the hint shows once, not per field');
  ldoc2.getElementById('f').dispatchEvent(new lp.window.Event('submit', { bubbles: true, cancelable: true }));
  assert(!ldoc2.getElementById('im-keytip'), 'submit takes the hint down');
  ldoc2.getElementById('errbox').innerHTML =
    '<p role="alert" id="slfErrorAlert">Sorry, your password was incorrect. Please double-check your password.</p>';
  await settle(900);
  Object.defineProperty(ldoc2, 'visibilityState', { value: 'hidden', configurable: true });
  ldoc2.dispatchEvent(new lp.window.Event('visibilitychange'));
  const names = detail.map(d => d[0]);
  assert(names.includes('login_step'), 'the stage still reports');
  const taps = detail.filter(d => d[0] === 'login_tap').map(d => d[1].label);
  assert.deepStrictEqual(taps, ['forgot password?', 'continue as'],
    'taps report their label, and a saved-login button loses the name');
  const sub = detail.find(d => d[0] === 'login_submitted');
  assert(sub && sub[1].stage === 'login' && sub[1].attempt === 1, 'a submit reports the stage and attempt');
  const err = detail.find(d => d[0] === 'login_error');
  assert(err && err[1].error === 'wrong_password' && err[1].submits === 1,
    'an Instagram error reports as an enum with the submit count');
  assert.strictEqual(detail.filter(d => d[0] === 'login_error').length, 1,
    'the same error reports once, not on every sweep');
  const left = detail.find(d => d[0] === 'login_left');
  assert(left && left[1].stage === 'login' && left[1].submits === 1 && typeof left[1].seconds === 'number',
    'backgrounding with the page up reports where and after how many tries');
  const blob = JSON.stringify(detail);
  assert(!/alex\.chen|hunter2|double-check/.test(blob),
    'nothing typed and no error text may ever reach the bridge');
  //     Keychain AutoFill (Aug 23): the sweep names the fields for iOS.
  //     Instagram ships them as autocomplete="on", which the keyboard
  //     ignores; username / current-password is what surfaces the saved
  //     password. The two-factor code field gets one-time-code.
  assert.strictEqual(ldoc2.querySelector('input[name=username]').getAttribute('autocomplete'), 'username',
    'the username field must be named for AutoFill');
  assert.strictEqual(ldoc2.querySelector('input[name=password]').getAttribute('autocomplete'), 'current-password',
    'the password field must be named for AutoFill');
  ldoc2.querySelector('input[name=username]').setAttribute('autocomplete', 'on');
  await settle(900);
  assert.strictEqual(ldoc2.querySelector('input[name=username]').getAttribute('autocomplete'), 'username',
    'a re-render that puts "on" back is corrected on the next sweep');
  const tfa = boot('/accounts/login/two_factor/', '<input name="verificationCode" inputmode="numeric" autocomplete="on">',
    { loggedOut: true, bridge: () => {} });
  await settle(900);
  assert.strictEqual(tfa.window.document.querySelector('input').getAttribute('autocomplete'), 'one-time-code',
    'the two-factor code field must offer the SMS code');
  //     The Passwords-key hint is an iOS keyboard affordance: a Mac build
  //     must never show it over the login form (1.3.0).
  const macLogin = boot('/accounts/login/', loginHtml, { loggedOut: true, ua: DESKTOP, bridge: () => {} });
  await settle(4600);
  assert(!macLogin.window.document.getElementById('im-keytip'),
    'the Passwords hint must not appear on macOS');
  const signedLoginDetail = boot('/accounts/login/', loginHtml, { bridge: m => {
    if (m.cmd === 'track' && /^login_(tap|submitted|error|left)$/.test(m.event)) detail.push(['SIGNED', m.event]);
  } });
  await settle(900);
  signedLoginDetail.window.document.getElementById('f').dispatchEvent(
    new signedLoginDetail.window.Event('submit', { bubbles: true, cancelable: true }));
  assert(!detail.some(d => d[0] === 'SIGNED'), 'a signed-in visit to the login route reports no detail');

  //     Session rescue: a logged-out login page asks native for the
  //     cookie snapshot ONCE, and a restored snapshot goes back to the
  //     inbox. WebKit loses cookies on a force-quit soon after login
  //     (a tester relogged every launch, Aug 17); this is the healer.
  const rescueLog = [];
  const rescued = boot('/accounts/login/', '', { loggedOut: true,
    bridge: (m, d) => {
      rescueLog.push(m.cmd === 'track' ? 'track:' + m.event : m.cmd);
      if (m.cmd === 'cookieRestore')
        d.window.__konvoStoreReply(m.id, { restored: true, n: 7 });
    } });
  await settle(1900);
  assert(rescued.went.includes('/direct/inbox/'),
    'a restored session must return to the inbox');
  assert(rescueLog.includes('track:session_restored'),
    'the rescue must be visible in analytics');
  assert.strictEqual(
    rescueLog.filter(c => c === 'cookieRestore').length, 1,
    'the interval sweep must not re-ask for the snapshot');
  const noSnap = boot('/accounts/login/', '', { loggedOut: true,
    bridge: (m, d) => {
      if (m.cmd === 'cookieRestore')
        d.window.__konvoStoreReply(m.id, { restored: false });
    } });
  await settle(900);
  assert(!noSnap.went.includes('/direct/inbox/'),
    'no snapshot means the login page is genuine; stay put');
  const signedLogin = boot('/accounts/login/', '', {
    bridge: m => { if (m.cmd === 'cookieRestore')
      assert.fail('a signed-in login visit must not trigger the rescue'); } });
  await settle(900);

  //     inbox_ready reports what a fresh sign-in actually finds: the
  //     thread count once the inbox settles, and how long that took.
  const ready = [];
  const tready = [];
  const inboxed = boot('/direct/inbox/',
    '<a href="/direct/t/111/">a</a><a href="/direct/t/222/">b</a>' +
    '<a href="/someone/">profile</a><span id="me">matthew_c</span>' +
    '<div role="group">a message</div>',
    { bridge: m => {
        if (m.cmd === 'track' && m.event === 'inbox_ready') ready.push(m.props);
        if (m.cmd === 'track' && m.event === 'thread_ready') tready.push(m.props);
        if (m.cmd === 'cookieSave') ready.saves = (ready.saves || 0) + 1;
        if (m.cmd === 'review') ready.reviews = (ready.reviews || 0) + 1;
      } });
  // jsdom rects are all zero; give the username element a real one so the
  // title finder (and the identity capture riding on it) can see it.
  inboxed.window.document.getElementById('me').getBoundingClientRect =
    () => ({ width: 100, top: 40 });
  await settle(2600);   // the settle detector caps at 2s before reporting
  assert.strictEqual(ready.length, 1, 'the settled inbox must report once');
  assert.strictEqual(ready[0].threads, 2,
    'only conversation rows count as threads');
  assert(typeof ready[0].ms === 'number' && ready[0].ms >= 0,
    'the time to settle must ride along');
  assert(!JSON.stringify(ready).includes('111'),
    'inbox_ready must never carry a thread id');
  //     Identity rides the first settle: the cookie id plus the handle the
  //     title finder located. Captured once per install, never again.
  assert(ready.saves >= 1,
    'a settled inbox must hand the cookies to native for safekeeping');
  assert.strictEqual(ready[0].$set.ig_user_id, '1234567',
    'the first settle must set the Instagram id');
  assert.strictEqual(ready[0].$set.ig_username, 'matthew_c',
    'the handle must come from the sized title element');
  assert(!ready.reviews && inboxed.window.localStorage.konvoUseDays === '1'
    && !inboxed.window.localStorage.konvoReviewAsked,
    'a first-day inbox never asks for a rating (5.6.3): it only counts the day');

  //     The rating ask waits for the third distinct day of settled use,
  //     then fires once and never again (moved out of onboarding Aug 27,
  //     App Review 5.6.3).
  const revLog = [];
  const dayThree = boot('/direct/inbox/', '<div role="row">a message</div>', {
    paid: true,
    seed: { konvoUseDays: '2', konvoLastDay: 'not-today' },
    bridge: m => {
      if (m.cmd === 'review') revLog.push(1);
      if (m.cmd === 'track' && m.event === 'review_asked') revLog.asked = true;
    } });
  await settle(2600);
  assert.strictEqual(revLog.length, 1,
    'the third distinct day of settled use asks for the rating, once');
  assert(revLog.asked, 'the ask reports itself');
  assert.strictEqual(dayThree.window.localStorage.konvoReviewAsked, '1',
    'and the flag stops any repeat');

  //     Page errors report with their message, capped at three a session.
  //     (The stall detector that lived here was removed Aug 31: its
  //     message-row probe never matched Instagram's real markup, so it
  //     reloaded and flagged healthy chats.)
  const errLog = [];
  const errFix = boot('/direct/t/9/', '', { bridge: m => {
    if (m.cmd === 'track') errLog.push(m.event); } });
  await settle(900);
  for (let i = 0; i < 5; i++) {
    errFix.window.dispatchEvent(
      new errFix.window.ErrorEvent('error', { message: 'boom ' + i }));
  }
  assert.strictEqual(errLog.filter(e => e === 'cage_error').length, 3,
    'page errors report with their message, capped at three a session');

  //     No stand-in money (Aug 31): a wall whose products call fails
  //     shows a priceless loading page - the fallback numbers painting
  //     while Apple's sheet charged the real localized price was a field
  //     bug. The retry lands and the wall repaints itself in the user's
  //     own currency.
  let allowProducts = false;
  const lateP = boot('/direct/inbox/', '', { hash: '#konvo=15', bridge: (m, d) => {
    if (m.cmd === 'products') d.window.__konvoStoreReply(m.id, allowProducts
      ? { ok: true,
          yearly: { price: 'A$34.99', perWeek: 'A$0.67', perMonth: 'A$2.92', savePct: 71, trialDays: 7 },
          monthly: { price: 'A$9.99' }, lifetime: { price: 'A$34.99' } }
      : { ok: false });
  } });
  const lpdoc = lateP.window.document;
  const lpText = () => (lpdoc.getElementById('im-pay') || {}).textContent || '';
  const lptap = act => {
    const el = lpdoc.querySelector(`#im-pay [data-act='${act}']`);
    if (el) el.dispatchEvent(new lateP.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  };
  // The silent bridge delays the mount behind the 2.5s entitlement
  // timeout, so fixed sleeps race the sequence: poll for each button.
  const lpwalk = async (act) => {
    for (let i = 0; i < 60 && !lpdoc.querySelector(`#im-pay [data-act='${act}']`); i++) await settle(200);
    lptap(act); await settle(450);
  };
  await lpwalk('keep');
  await lpwalk('impact');
  await lpwalk('pay');
  assert(/Loading your plans/.test(lpText()) && !/\$/.test(lpText()),
    'a wall without live prices shows the loading page and not one dollar sign');
  allowProducts = true;
  await settle(3200);   // the 2.5s retry answers and repaints
  assert(/A\$34\.99/.test(lpText()) && /A\$9\.99/.test(lpText()),
    "the retry repaints the paywall in the user's own currency");
  inboxed.window.__loc.pathname = '/direct/t/111/';
  // The 800ms route tick plus the 180ms quiet window: the crossing can
  // take up to ~1.1s to report, so the wait is generous on purpose.
  await settle(1600);
  //     Opening a chat reports how long the switch took to settle - the
  //     "way slower to text" complaint needs a number before any fix.
  assert.strictEqual(tready.length, 1, 'a settled thread must report once');
  assert(typeof tready[0].ms === 'number' && tready[0].ms >= 0,
    'the switch time must ride along');
  assert.strictEqual(tready[0].rows, 1,
    'thread_ready must wait for real message rows, not a quiet skeleton');
  inboxed.window.__loc.pathname = '/direct/inbox/';
  await settle(2600);
  assert.strictEqual(ready.length, 2, 'returning to the inbox must report again');
  assert(!ready[1].$set, 'identity is captured once per install, not per settle');

  //     A crossing mid-settle abandons the old page's report: settle()
  //     cancels its predecessor, so an inbox the user bounced off never
  //     reports, and only the thread actually reached does.
  const cx = [];
  const crossing = boot('/direct/inbox/', '<div role="group">m</div>',
    { bridge: m => { if (m.cmd === 'track') cx.push(m.event); } });
  // Cross synchronously, the same tick the inbox settle started: a settle
  // needs 180ms of quiet to complete, so this is always mid-settle, with
  // no timer race for a loaded machine to lose.
  crossing.window.__loc.pathname = '/direct/t/77/';
  crossing.window.dispatchEvent(new crossing.window.Event('popstate'));
  await settle(1500);
  assert(!cx.includes('inbox_ready'),
    'a crossing mid-settle must abandon the inbox report');
  assert.strictEqual(cx.filter(e => e === 'thread_ready').length, 1,
    'the thread the user actually reached must report exactly once');

  //     The DM composer must autocorrect: Instagram ships it off, the
  //     cage flips it on, and only in a thread - the inbox search box is
  //     not ours to retrait.
  const dmbox = boot('/direct/t/123/',
    '<div id="cmp" role="textbox" contenteditable="true"' +
    " autocorrect='off' autocapitalize='off' spellcheck='false'></div>");
  await settle(900);
  const cmp = dmbox.window.document.getElementById('cmp');
  assert.strictEqual(cmp.getAttribute('autocorrect'), 'on',
    'the composer must get autocorrect back');
  assert.strictEqual(cmp.getAttribute('autocapitalize'), 'sentences',
    'sentence capitalization comes with it');
  assert.strictEqual(cmp.getAttribute('spellcheck'), 'true',
    'spellcheck comes with it');
  const searchbox = boot('/direct/inbox/',
    '<div id="q" role="textbox" autocorrect="off"></div>');
  await settle(900);
  assert.strictEqual(
    searchbox.window.document.getElementById('q').getAttribute('autocorrect'),
    'off', 'outside a thread the cage must leave textboxes alone');

  //     The block (Aug 16 order): the loader hands a supported paid build
  //     straight to the Screen Time connect page, BEFORE perks or price.
  //     Its button walks authorize -> pick -> shield -> notify, the
  //     confirmation hands over to perks, and the paywall follows.
  const cageLog = [];
  //     A paying user's reinstall (Aug 21): entitled, but the shield is
  //     gone with the old install. The wall rises once with the Screen Time
  //     step alone, arms on the pick, says "You're protected", and leaves. An
  //     entitled user whose shield is up sees nothing.
  const reLog = [];
  const reinstall = boot('/direct/inbox/', '', { bridge: (m, d) => {
    reLog.push(m.cmd === 'track' ? 'track:' + m.event : m.cmd);
    const r = {
      entitlements: { entitled: true },
      cageStatus: { supported: true, authorized: false, picked: false, active: false },
      cageAuthorize: { authorized: true }, cagePick: { count: 1 },
      cageOn: { active: true }, notify: { granted: true },
    }[m.cmd];
    if (r) d.window.__konvoStoreReply(m.id, r);
  } });
  await settle(1200);
  const rdoc = reinstall.window.document;
  assert(rdoc.getElementById('im-pay') &&
    /Connect Konvo to Screen Time/.test(rdoc.getElementById('im-pay').textContent),
    'an entitled user with no shield must get the Screen Time step, and only that');
  assert(!/Instagram connected/.test(rdoc.getElementById('im-pay').textContent),
    'no connected/loader beat for a payer');
  assert.strictEqual(reinstall.window.localStorage.getItem('konvoCageAsked'), '1',
    'the ask is recorded so it happens once per install');
  const rtap = act => rdoc.querySelector(`[data-act='${act}']`).dispatchEvent(
    new reinstall.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  rtap('cage-setup-go');
  await settle(600);
  assert(reLog.includes('cageOn') && reLog.includes('track:cage_enabled'),
    'the pick must arm the shield for a payer');
  assert(/You're protected\./.test(rdoc.getElementById('im-pay').textContent),
    'the payer ends on "You\'re protected", not the sell');
  assert(!/No commitment/.test(rdoc.getElementById('im-pay').textContent),
    'a payer must never see the paywall');
  await settle(3600);
  assert(!rdoc.getElementById('im-pay'), 'the wall leaves on its own');
  const shielded = boot('/direct/inbox/', '', { bridge: (m, d) => {
    const r = { entitlements: { entitled: true },
      cageStatus: { supported: true, authorized: true, picked: true, active: true } }[m.cmd];
    if (r) d.window.__konvoStoreReply(m.id, r);
  } });
  await settle(1200);
  assert(!shielded.window.document.getElementById('im-pay'),
    'an entitled user whose shield is up sees no wall at all');
  const askedAlready = boot('/direct/inbox/', '', { bridge: (m, d) => {
    // The flag is set before the verdict lands, as on a second launch.
    d.window.localStorage.setItem('konvoCageAsked', '1');
    const r = { entitlements: { entitled: true },
      cageStatus: { supported: true, authorized: false, picked: false, active: false } }[m.cmd];
    if (r) d.window.__konvoStoreReply(m.id, r);
  } });
  await settle(1200);
  assert(!askedAlready.window.document.getElementById('im-pay'),
    'a payer who already saw the ask this install is not asked again');

  const cageReplies = {
    entitlements: { entitled: false },
    products: LIVE_PRODUCTS,
    cageStatus: { supported: true, authorized: false, picked: false, active: false },
    cageAuthorize: { authorized: true },
    cagePick: { count: 1 },
    cageOn: { active: true },
    notify: { granted: true },
  };
  const caged = boot('/direct/inbox/', '', { beta: true, bridge: (m, d) => {
    cageLog.push(m.cmd === 'track' ? 'track:' + m.event : m.cmd);
    if (m.cmd in cageReplies) d.window.__konvoStoreReply(m.id, cageReplies[m.cmd]);
  } });
  await settle(8400);
  const cdoc = caged.window.document;
  const cactap = act => cdoc.querySelector(`[data-act='${act}']`).dispatchEvent(
    new caged.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  //     The Screen Time step no longer precedes the sell (Aug 22): the
  //     loader lands on the reveal, and nothing native runs before the
  //     money.
  assert(!cageLog.includes('track:cage_pitch_viewed') && !cageLog.includes('cageAuthorize'),
    'no Screen Time pitch and nothing native before the purchase');
  assert(cdoc.getElementById('im-pay').classList.contains('im-reveal'),
    'the loader must clear the wall to show the real inbox');
  assert(/Instagram connected/.test(cdoc.getElementById('im-pay').textContent) &&
    /Your DMs are still here\./.test(cdoc.getElementById('im-pay').textContent) &&
    /Keep Instagram like this/.test(cdoc.getElementById('im-pay').textContent),
    'the reveal carries the pill, the headline and the keep button');
  assert(cageLog.includes('track:inbox_reveal_viewed'), 'the reveal is tracked');
  cactap('keep');
  await settle(450);
  assert(!cdoc.getElementById('im-pay').classList.contains('im-reveal'),
    'keep must make the wall opaque again');
  assert(/No commitment\. Cancel anytime\./.test(cdoc.getElementById('im-pay').textContent),
    'keep hands over to perks: setup first, sell second');
  cactap('impact');
  await settle(450);
  cactap('pay');
  await settle(450);
  assert(!cageLog.includes('cageOn'),
    'reaching the paywall still must not arm the shield');
  cactap('betafree');
  await settle(450);
  assert(cageLog.includes('track:cage_pitch_viewed') &&
    /One last step: Connect Konvo to Screen Time, securely\./.test(cdoc.getElementById('im-pay').textContent),
    'the sequence ending well (here the beta grant) leads to the Screen Time step');
  assert(!cdoc.querySelector("[data-act='cage-skip']") &&
    !/Not now/.test(cdoc.getElementById('im-pay').textContent),
    'the Screen Time step has no opt-out: whoever reaches it connects or answers the system dialog');
  assert(!cageLog.includes('cageOn'), 'the grant alone does not arm: the user connects first');
  cactap('cage-setup-go');
  await settle(600);
  const ci = s => cageLog.indexOf(s);
  assert(ci('cageAuthorize') > -1 && ci('cagePick') > ci('cageAuthorize') &&
    ci('notify') > ci('cagePick') && ci('cageOn') > ci('notify'),
    'cage setup must run authorize, pick, notify, then arm, in order');
  assert(cageLog.includes('track:cage_enabled'), 'the arming is reported');
  assert(/You're protected\./.test(cdoc.getElementById('im-pay').textContent),
    'and end on the protected page');
  assert(cdoc.documentElement.classList.contains('im-caged'),
    'the pass button arms in the same session the shield goes up');
  await settle(3600);   // the protected page holds 2.4s, then the .8s fade
  assert(!cdoc.getElementById('im-pay'),
    'the beta unlock still drops the wall');

  //     A paid purchase arms it too, and a connect-then-decline never does.
  const armLog = [];
  const armReplies = Object.assign({}, cageReplies, {
    purchase: { ok: true, entitled: true } });
  const armed = boot('/direct/inbox/', '', { bridge: (m, d) => {
    armLog.push(m.cmd);
    if (m.cmd in armReplies) d.window.__konvoStoreReply(m.id, armReplies[m.cmd]);
  } });
  await settle(8400);
  const adoc = armed.window.document;
  const atap = act => adoc.querySelector(`[data-act='${act}']`).dispatchEvent(
    new armed.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  atap('keep');
  await settle(450);
  atap('impact');
  await settle(450);
  atap('pay');
  await settle(450);
  assert(!armLog.includes('cageOn') && !armLog.includes('cageAuthorize'),
    'a paid build must not touch the shield before purchase either');
  atap('buy-y');
  await settle(450);
  atap('cage-setup-go');
  await settle(600);
  assert(armLog.indexOf('cageOn') > armLog.indexOf('purchase'),
    'a successful purchase, then the pick, arms the shield');
  assert(/You're protected\./.test(adoc.getElementById('im-pay').textContent),
    'the protected page follows the arming');

  //     The free build's ending: Continue on perks runs the tail. With no
  //     bridge (this harness, the Mac) there is no shield to set up, so
  //     the plain confirmation stands in and Open my messages ends it.
  const freeEnd = boot('/direct/inbox/', '', { free: true });
  await settle(8400);
  const edoc = freeEnd.window.document;
  const etap = act => edoc.querySelector(`[data-act='${act}']`).dispatchEvent(
    new freeEnd.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  assert(!/Choose a plan next/.test(edoc.getElementById('im-pay').textContent),
    'the free build\'s reveal promises no plan');
  etap('keep');
  await settle(450);
  assert(/Free\. Nothing to cancel\./.test(edoc.getElementById('im-pay').textContent),
    'the free build must not promise a cancellation it has nothing to cancel');
  assert(/No feed, no Reels, no Explore/.test(edoc.getElementById('im-pay').textContent)
    && !/comes off your phone/.test(edoc.getElementById('im-pay').textContent),
    'the rows must describe the product that exists');
  etap('welcomed');
  await settle(500);
  assert(/You're in\./.test(edoc.getElementById('im-pay').textContent)
    && edoc.querySelector("#im-pay path[stroke-dasharray='24']"),
    'the free ending must show the drawn check before the inbox');
  etap('done');
  await settle(950);
  assert(!edoc.getElementById('im-pay'), 'Open my messages must drop the wall');
  assert.strictEqual(freeEnd.window.localStorage.getItem('konvoWelcomed'), '1',
    'the free ending still marks the sequence done');

  //     Without iOS 16 the connect page never renders: the loader lands
  //     on perks exactly as the flow ran before the block existed.
  const oldLog = [];
  const oldios = boot('/direct/inbox/', '', { beta: true, bridge: (m, d) => {
    oldLog.push(m.cmd === 'track' ? 'track:' + m.event : m.cmd);
    const r = { entitlements: { entitled: false }, products: LIVE_PRODUCTS,
      cageStatus: { supported: false } };
    if (m.cmd in r) d.window.__konvoStoreReply(m.id, r[m.cmd]);
  } });
  await settle(8400);
  const odoc = oldios.window.document;
  const otap2 = act => odoc.querySelector(`[data-act='${act}']`).dispatchEvent(
    new oldios.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  otap2('keep');
  await settle(450);
  assert(/No commitment\. Cancel anytime\./.test(odoc.getElementById('im-pay').textContent),
    'an unsupported bridge still reaches perks through the reveal');
  otap2('impact');
  await settle(450);
  assert(/Start your Free Week/.test(odoc.getElementById('im-pay').textContent),
    'and continue into the impact page');
  assert(!oldLog.includes('track:cage_pitch_viewed'),
    'no connect event when the page never rendered');

  //     Apple's consent dialog sits over the page and never resolves in
  //     this boot; taps underneath must not re-fire the chain (eleven
  //     cage_authorized in a row on one device, Aug 17).
  const mashLog = [];
  const mashed = boot('/direct/inbox/', '', { beta: true, bridge: (m, d) => {
    mashLog.push(m.cmd);
    if (m.cmd === 'cageAuthorize') return;
    if (m.cmd in cageReplies) d.window.__konvoStoreReply(m.id, cageReplies[m.cmd]);
  } });
  await settle(8400);
  const mdoc = mashed.window.document;
  const mact = act => mdoc.querySelector(`[data-act='${act}']`)
    .dispatchEvent(new mashed.window.MouseEvent('click',
      { bubbles: true, cancelable: true }));
  // The connect page now sits after the grant (Aug 22).
  for (const a of ['keep', 'impact', 'pay', 'betafree']) { mact(a); await settle(450); }
  const mgo = () => mact('cage-setup-go');
  mgo(); mgo(); mgo();
  await settle(200);
  assert.strictEqual(mashLog.filter(c => c === 'cageAuthorize').length, 1,
    'taps while the consent dialog is up must not re-fire the chain');

  //     The pass sheet follows the phone: light is the default palette,
  //     dark lives only under the media query (hardcoded dark looked
  //     wrong on a light-mode phone, Aug 17).
  assert(CAGE.includes('#im-pass-card{width:100%;background:rgba(242,242,247'),
    'the pass card must default to the light palette');
  // The dark values must appear AFTER the media query opens (the CSS is
  // one concatenated string; source-order stands in for cascade scope).
  assert(CAGE.indexOf('@media (prefers-color-scheme: dark){') <
    CAGE.indexOf('#im-pass{background:rgba(38,38,38') &&
    CAGE.indexOf('#im-pass{background:rgba(38,38,38') > -1,
    'the dark palette must live under the media query');

  //     The daily passes: visible only when caged, reason before unlock,
  //     five minutes then a spare minute, then tomorrow. The relock is
  //     DeviceActivity's job and is device-only; the contract here is
  //     the sheet's choreography.
  const passLog = [];
  const passed = boot('/direct/inbox/', '', { beta: true, welcomed: true,
    bridge: (m, d) => {
      passLog.push(m.cmd === 'track'
        ? 'track:' + m.event + (m.props && m.props.mins ? ':' + m.props.mins : '')
        : m.cmd);
      const r = {
        entitlements: { entitled: false },
        cageStatus: { supported: true, authorized: true, picked: true,
          active: true, passAvailable: true, passMins: 5, passesLeft: 2 },
        cagePass: { granted: true },
      };
      if (m.cmd in r) d.window.__konvoStoreReply(m.id, r[m.cmd]);
    } });
  await settle(1200);
  const pdoc = passed.window.document;
  const ptap = el => el.dispatchEvent(
    new passed.window.MouseEvent('click', { bubbles: true, cancelable: true }));
  assert(pdoc.documentElement.classList.contains('im-caged'),
    'an active cage must mark the page');
  ptap(pdoc.getElementById('im-pass'));
  await settle(200);
  assert(/Why do you want to unlock Instagram/.test(
    pdoc.getElementById('im-pass-card').textContent),
    'the pass sheet must open with the reason question');
  assert(pdoc.querySelector("#im-pass-card .im-pr[data-r='post']"),
    'posting a picture or Reel must be an offered reason');
  const unlock = pdoc.querySelector('#im-pass-card .im-go');
  assert(unlock.disabled, 'Unlock must wait for a reason');
  assert(/Unlock for 5 mins/.test(unlock.textContent),
    'the first pass of the day is the five');
  assert(/Unlocks left: 2 \(5 mins each\)/.test(
    pdoc.getElementById('im-pass-card').textContent),
    'the fine print counts both unlocks');
  ptap(pdoc.querySelector("#im-pass-card .im-pr[data-r='story']"));
  assert(!unlock.disabled, 'a reason arms Unlock');
  ptap(unlock);
  await settle(200);
  assert(passLog.includes('cagePass'), 'Unlock must ask the bridge for the pass');
  assert(passLog.includes('track:pass_used:5'),
    'the pass must be tracked with its length');
  assert(!pdoc.getElementById('im-pass-sheet'), 'a granted pass closes the sheet');
  //     The spare minute follows the five, then the day is spent.
  ptap(pdoc.getElementById('im-pass'));
  await settle(200);
  assert(pdoc.querySelector('#im-pass-card .im-go').textContent.trim()
    === 'Unlock for 5 mins',
    'the second pass of the day is another five (two fives, Aug 21)');
  assert(/Unlocks left: 1 \(5 mins\)/.test(
    pdoc.getElementById('im-pass-card').textContent),
    'the fine print counts the remaining pass');
  ptap(pdoc.querySelector("#im-pass-card .im-pr[data-r='story']"));
  ptap(pdoc.querySelector('#im-pass-card .im-go'));
  await settle(200);
  assert(passLog.filter(c => c === 'track:pass_used:5').length === 2,
    'both passes must be tracked as five minutes');
  ptap(pdoc.getElementById('im-pass'));
  await settle(200);
  assert(/No pass left today/.test(
    pdoc.getElementById('im-pass-card').textContent),
    'after the spare minute the day is spent');

  //     Every animation the wall declares must have its keyframes: the
  //     loader ring shipped without im-spin for ten days and never turned.
  for (const name of (CAGE.match(/animation:([a-z-]+)/g) || [])
    .map(a => a.slice(10)).filter(n => n !== 'none')) {
    assert(CAGE.includes('@keyframes ' + name),
      `animation "${name}" must have matching @keyframes`);
  }

  console.log('ALL CAGE TESTS PASS');
  process.exit(0);
})();
