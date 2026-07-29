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
  dom.window.fetch = () => new Promise(() => {});  // notification poll: never resolves
  // jsdom refuses to navigate and locks window.location, so shadow `location`
  // with a recorder. dom.went holds every place the cage tried to send us.
  dom.went = [];
  const q = path.indexOf('?');
  dom.window.__loc = {
    hostname: 'www.instagram.com',
    pathname: q < 0 ? path : path.slice(0, q),
    search: q < 0 ? '' : path.slice(q),
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
  // 1. Everything watchable stays caged, with no exemptions at all. Home is in
  //    the list now: in-app posting is gone, so nothing needs "/" to be
  //    reachable, and the feed can no longer render even behind CSS.
  const leaks = ['/', '/?variant=following', '/reels/', '/explore/', '/stories/bob/',
    '/p/abc/', '/someuser/reels/', '/someuser/tagged/'].map(p => [p, boot(p, '')]);
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
  assert(/aria-label="Notifications"/.test(deskSheets),
    'the heart is phone-only - the Mac app is a DM window, not a way back in');
  assert(/a:has\(img\[alt\$='profile picture'\]\)\{pointer-events:none/.test(sheets),
    'avatars must be inert, not hidden - display:none left a hole in the profile header');
  assert(!/a:has\(svg\[aria-label="Messages"\]\)/.test(sheets),
    'Messages must stay: it is the only way back to the inbox from a profile');

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
  const profiles = ['/someuser/', '/some.user_1', '/accounts/edit/'].map(p =>
    [p, boot(p, '')]);
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

  console.log('ALL CAGE TESTS PASS');
  process.exit(0);
})();
