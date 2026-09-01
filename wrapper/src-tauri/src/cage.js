
(function () {
  // Only cage the main Instagram web app. Auth / new-device verification
  // surfaces (accountscenter.instagram.com, and Meta's own login pages on
  // meta.com / facebook.com) must load completely untouched — running the
  // cage there called window.stop() and blanked the login flow.
  var H = location.hostname;
  if (H !== "instagram.com" && H !== "www.instagram.com") return;
  // Top frame only. Instagram loads its verification/challenge UI in
  // same-host iframes; the cage running inside one window.stop()s and
  // route-bounces the challenge content, leaving an empty lock modal.
  // Everything the cage does is a top-frame concern, and the Swift bridge
  // already refuses subframes.
  try { if (window.self !== window.top) return; } catch (e) { return; }

  // WKWebView has no navigator.serviceWorker at all (undefined, not a
  // refusal), and a site build that touches it unguarded dies during boot
  // while its data APIs keep answering (the Sep 1 stuck-shell device:
  // fresh documents, inbox API 200 with threads, 930 DOM nodes forever).
  // A quiet stub keeps such code walking: registrations never exist,
  // register never settles, nothing ever fires.
  try {
    // The class globals too: the caught boot error on the wedged device
    // read, verbatim, "Can't find variable: ServiceWorkerRegistration".
    // Plain constructors: instanceof works, prototype exists, nothing runs.
    if (typeof window.ServiceWorkerRegistration === "undefined")
      window.ServiceWorkerRegistration = function ServiceWorkerRegistration() {};
    if (typeof window.ServiceWorker === "undefined")
      window.ServiceWorker = function ServiceWorker() {};
    if (typeof window.ServiceWorkerContainer === "undefined")
      window.ServiceWorkerContainer = function ServiceWorkerContainer() {};
    if (typeof navigator.serviceWorker === "undefined") {
      var swPending = new Promise(function () {});
      Object.defineProperty(navigator, "serviceWorker", {
        configurable: true,
        value: {
          controller: null,
          ready: swPending,
          register: function () { return swPending; },
          getRegistration: function () { return Promise.resolve(undefined); },
          getRegistrations: function () { return Promise.resolve([]); },
          addEventListener: function () {},
          removeEventListener: function () {},
        },
      });
    }
  } catch (e) {}

  // Analytics go native: Instagram's CSP blocks a page-side call to
  // PostHog. Defined here rather than inside the paywall block because the
  // route watcher needs it too. Event names and screen ids only, never
  // content, never a thread id.
  function track(event, props) {
    try {
      var p = props || {};
      // The variant rides on every event (the native side adds the build
      // number): konvo-free has no paywall to see, and funnels that could
      // not tell variants apart have already lied twice.
      p.variant = window.__konvoBeta ? "beta"
        : window.__konvoFree ? "free" : "default";
      p.lang = navigator.language;
      window.webkit.messageHandlers.konvoStore.postMessage(
        { cmd: "track", id: 0, event: event, props: p });
    } catch (e) {}
  }

  // The sequence speaks the phone's language (Aug 31): fr, zh (any
  // script, rendered Traditional), ko, else English. Same shape as
  // dist/index.html's table, its own keys: the English copy, so a missing
  // entry can only ever show English. Money lines say exactly what the
  // English says, never more. The Screen Time replica mirrors Apple's own
  // dialog wording in each language, which is why it alone says "vous".
  var LANG = (function () {
    var l = String((navigator.languages && navigator.languages[0]) ||
      navigator.language || "").toLowerCase();
    return /^fr/.test(l) ? "fr" : /^zh/.test(l) ? "zh" : /^ko/.test(l) ? "ko" : "en";
  })();
  var I18N = {
    fr: {
      "Instagram connected.": "Instagram connecté.",
      "Your DMs and Stories are ready.": "Tes DM et tes stories sont prêts.",
      "Setting up your Konvo": "Préparation de ton Konvo",
      "Feed hidden": "Fil masqué",
      "Reels hidden": "Reels masqués",
      "Explore hidden": "Explorer masqué",
      "Messages kept": "Messages conservés",
      "Friends' stories kept": "Stories de tes amis conservées",
      "Continue": "Continuer",
      "Loading your plans&hellip;": "Chargement de tes formules&hellip;",
      "Prices show in your local currency.": "Les prix s'affichent dans ta devise.",
      "Try again": "Réessayer",
      "First {n} days free, then {price} a month.": "{n} premiers jours gratuits, puis {price} par mois.",
      "Start your free {n} days": "Commencer mes {n} jours gratuits",
      "No commitment, cancel anytime": "Sans engagement, annule quand tu veux",
      "Today": "Aujourd'hui",
      "Unlock your DMs and Stories in Konvo. Pay $0.": "Débloque tes DM et stories dans Konvo. Tu ne paies rien.",
      "In {n} days": "Dans {n} jours",
      "You'll be charged {price} on <b>{date}</b>, <b>cancel anytime</b> before.": "{price} seront prélevés le <b>{date}</b>. <b>Annule quand tu veux</b> avant.",
      "{price} a month, cancel anytime.": "{price} par mois, annulable à tout moment.",
      "Continue with Monthly": "Continuer en mensuel",
      "Unlock your DMs and Stories in Konvo. Pay {price}.": "Débloque tes DM et stories dans Konvo. Tu paies {price}.",
      "Every month": "Chaque mois",
      "Renews at {price}, <b>cancel anytime</b>.": "Renouvelé à {price}, <b>annulable à tout moment</b>.",
      "{price} once. Lifetime access.": "{price} une seule fois. Accès à vie.",
      "Get Lifetime access": "Obtenir l'accès à vie",
      "Pay once. No subscription.": "Un seul paiement. Pas d'abonnement.",
      "Pay {price} once. That's it.": "Tu paies {price} une fois. C'est tout.",
      "First {n} days free, then {price} a year.": "{n} premiers jours gratuits, puis {price} par an.",
      "Halfway through. We'll remind you before anything is charged.": "À mi-parcours. On te préviendra avant tout prélèvement.",
      "You'll be charged on <b>{date}</b>, <b>cancel anytime</b> before.": "Prélèvement le <b>{date}</b>. <b>Annule quand tu veux</b> avant.",
      "{price} a year ({m}/month).": "{price} par an ({m}/mois).",
      "Continue with Yearly": "Continuer en annuel",
      "Unlock your DMs and Stories in Konvo.": "Débloque tes DM et stories dans Konvo.",
      "In 12 months": "Dans 12 mois",
      "Renews at {price}, <b>cancel anytime</b> before.": "Renouvelé à {price}, <b>annulable à tout moment</b> avant.",
      "Your plan ended.": "Ta formule est terminée.",
      "How your free trial works": "Comment marche ton essai gratuit",
      "How your plan works": "Comment marche ta formule",
      "Instagram is unblocked until you pick a plan. ": "Instagram est débloqué jusqu'à ce que tu choisisses une formule. ",
      "SAVE {n}%": "-{n} %",
      "POPULAR": "POPULAIRE",
      "Yearly Plan": "Annuel",
      "Monthly Plan": "Mensuel",
      "{price}/month": "{price}/mois",
      "{price}/year": "{price}/an",
      "Terms of Use": "Conditions d'utilisation",
      "Privacy Policy": "Confidentialité",
      "Restore": "Restaurer",
      "Free during beta": "Gratuit pendant la bêta",
      "Connect Konvo to Screen Time, securely.": "Connecte Konvo à Temps d'écran, en toute sécurité.",
      "To block Instagram on this iPhone, Konvo will need your permission.": "Pour bloquer Instagram sur cet iPhone, Konvo a besoin de ta permission.",
      "&ldquo;Konvo&rdquo; Would Like to Access Screen Time": "« Konvo » souhaite accéder à Temps d'écran",
      "Providing &ldquo;Konvo&rdquo; access to Screen Time may allow it to see your activity data, restrict content, and limit the usage of apps and websites.": "Autoriser « Konvo » à accéder à Temps d'écran peut lui permettre de voir vos données d'activité, de restreindre du contenu et de limiter l'utilisation des apps et des sites web.",
      "Don&rsquo;t Allow": "Ne pas autoriser",
      "Your information is protected by Apple and stays 100% on your phone.": "Tes informations sont protégées par Apple et restent à 100 % sur ton téléphone.",
      "Give permission": "Donner la permission",
      "Instagram connected": "Instagram connecté",
      "Your DMs are still here.": "Tes DM sont toujours là.",
      "Feed, Reels and Explore are now hidden. Stories, profiles and notifications still work.": "Fil, Reels et Explorer sont maintenant masqués. Stories, profils et notifications marchent toujours.",
      "Keep Instagram like this": "Garder Instagram comme ça",
      "Choose a plan next": "Ensuite, choisis une formule",
      "Start using Konvo": "Commence à utiliser Konvo",
      "reclaim 1 hour back": "récupère 1 heure",
      "reclaim {n} hours back": "récupère {n} heures",
      "get your evenings back": "récupère tes soirées",
      "{head} and<br>{sub}": "{head} et<br>{sub}",
      "Stay connected": "Reste en contact",
      "Messages, requests and friends' Stories all still work.": "Messages, invitations et stories de tes amis marchent toujours.",
      "Reclaim your focus": "Retrouve ta concentration",
      "No feed, no Reels, no Explore. Nothing to fall into.": "Pas de fil, pas de Reels, pas d'Explorer. Rien où tomber.",
      "Lock it when you're ready": "Verrouille quand tu veux",
      "One tap locks the Instagram app. Two passes a day, no snooze.": "Un tap verrouille l'app Instagram. Deux passes par jour, pas de bouton « plus tard ».",
      "Your messages are waiting.": "Tes messages t'attendent.",
      "You're protected.": "Protection activée.",
      "Instagram is blocked. Your DMs remain available through Konvo.": "Instagram est bloqué. Tes DM restent accessibles dans Konvo.",
      "Lifetime access active.": "Accès à vie activé.",
      "Free until {date}.": "Gratuit jusqu'au {date}.",
      "You're in.": "C'est parti.",
      "Open my messages": "Ouvrir mes messages",
      "users love Konvo": "utilisateurs adorent Konvo",
      "Ready to lock the Instagram app?": "On verrouille l'app Instagram ?",
      "Konvo keeps your DMs. Two 5 minute passes a day.": "Konvo garde tes DM. Deux passes de 5 minutes par jour.",
      "Block Instagram": "Bloquer Instagram",
      "We'll remind you 2 days before it ends.": "On te préviendra 2 jours avant la fin.",
      "Your trial ends in {n} days.": "Ton essai se termine dans {n} jours.",
      "Your trial ends tomorrow.": "Ton essai se termine demain.",
      "Keep your hours, or cancel anytime in Settings.": "Garde tes heures, ou annule quand tu veux dans Réglages.",
      "OK": "OK",
      "Try {d} days for free": "Essaie {d} jours gratuitement",
      "Same account. Different app.": "Même compte. Autre appli.",
      "Instagram": "Instagram",
      "KONVO": "KONVO",
      "Every DM, request and Story": "Chaque DM, demande et Story",
      "Opens on your messages, not the feed": "S'ouvre sur tes messages, pas sur le fil",
      "No feed. Ever.": "Pas de fil. Jamais.",
      "No Reels, no Explore": "Pas de Reels, pas d'Explorer",
      "No ads, no suggested posts": "Pas de pubs, pas de posts suggérés",
      "Lock the Instagram app when you're ready": "Verrouille l'appli Instagram quand tu es prêt",
      "Two 5 minute passes a day. No snooze.": "Deux pauses de 5 minutes par jour. Pas de report.",
      "Your hours back, every week": "Tes heures, de retour chaque semaine",
      "No commitment. Cancel anytime.": "Sans engagement. Annule quand tu veux.",
      "Free. Nothing to cancel.": "Gratuit. Rien à annuler.",
      "Not now": "Pas maintenant"
    },
    zh: {
      "Instagram connected.": "Instagram 已連結。",
      "Your DMs and Stories are ready.": "你的私訊和限時動態準備好了。",
      "Setting up your Konvo": "正在設定你的 Konvo",
      "Feed hidden": "已隱藏動態",
      "Reels hidden": "已隱藏 Reels",
      "Explore hidden": "已隱藏探索",
      "Messages kept": "保留訊息",
      "Friends' stories kept": "保留朋友的限時動態",
      "Continue": "繼續",
      "Loading your plans&hellip;": "正在載入方案&hellip;",
      "Prices show in your local currency.": "價格以你的當地貨幣顯示。",
      "Try again": "再試一次",
      "First {n} days free, then {price} a month.": "前 {n} 天免費，之後每月 {price}。",
      "Start your free {n} days": "開始 {n} 天免費試用",
      "No commitment, cancel anytime": "無綁約，隨時取消",
      "Today": "今天",
      "Unlock your DMs and Stories in Konvo. Pay $0.": "在 Konvo 解鎖私訊和限時動態。今天不收費。",
      "In {n} days": "{n} 天後",
      "You'll be charged {price} on <b>{date}</b>, <b>cancel anytime</b> before.": "<b>{date}</b> 將收取 {price}，之前<b>隨時可取消</b>。",
      "{price} a month, cancel anytime.": "每月 {price}，隨時取消。",
      "Continue with Monthly": "選擇月付",
      "Unlock your DMs and Stories in Konvo. Pay {price}.": "在 Konvo 解鎖私訊和限時動態。支付 {price}。",
      "Every month": "每個月",
      "Renews at {price}, <b>cancel anytime</b>.": "以 {price} 續訂，<b>隨時可取消</b>。",
      "{price} once. Lifetime access.": "一次付 {price}。終身使用。",
      "Get Lifetime access": "取得終身使用權",
      "Pay once. No subscription.": "只付一次。沒有訂閱。",
      "Pay {price} once. That's it.": "付 {price} 一次。就這樣。",
      "First {n} days free, then {price} a year.": "前 {n} 天免費，之後每年 {price}。",
      "Halfway through. We'll remind you before anything is charged.": "試用過半。收費前我們會提醒你。",
      "You'll be charged on <b>{date}</b>, <b>cancel anytime</b> before.": "<b>{date}</b> 開始收費，之前<b>隨時可取消</b>。",
      "{price} a year ({m}/month).": "每年 {price}（每月 {m}）。",
      "Continue with Yearly": "選擇年付",
      "Unlock your DMs and Stories in Konvo.": "在 Konvo 解鎖私訊和限時動態。",
      "In 12 months": "12 個月後",
      "Renews at {price}, <b>cancel anytime</b> before.": "以 {price} 續訂，之前<b>隨時可取消</b>。",
      "Your plan ended.": "你的方案已結束。",
      "How your free trial works": "免費試用是這樣運作的",
      "How your plan works": "方案是這樣運作的",
      "Instagram is unblocked until you pick a plan. ": "在你選擇方案之前，Instagram 不會被封鎖。",
      "SAVE {n}%": "省 {n}%",
      "POPULAR": "熱門",
      "Yearly Plan": "年付",
      "Monthly Plan": "月付",
      "{price}/month": "{price}/月",
      "{price}/year": "{price}/年",
      "Terms of Use": "使用條款",
      "Privacy Policy": "隱私權政策",
      "Restore": "恢復購買",
      "Free during beta": "測試期間免費",
      "Connect Konvo to Screen Time, securely.": "安全地將 Konvo 連結到「螢幕使用時間」。",
      "To block Instagram on this iPhone, Konvo will need your permission.": "要在這支 iPhone 封鎖 Instagram，Konvo 需要你的許可。",
      "&ldquo;Konvo&rdquo; Would Like to Access Screen Time": "「Konvo」想要取用「螢幕使用時間」",
      "Providing &ldquo;Konvo&rdquo; access to Screen Time may allow it to see your activity data, restrict content, and limit the usage of apps and websites.": "允許「Konvo」取用「螢幕使用時間」可能讓它查看你的活動資料、限制內容，以及限制 App 和網站的使用。",
      "Don&rsquo;t Allow": "不允許",
      "Your information is protected by Apple and stays 100% on your phone.": "你的資料由 Apple 保護，100% 留在你的手機上。",
      "Give permission": "授予許可",
      "Instagram connected": "Instagram 已連結",
      "Your DMs are still here.": "你的私訊都還在。",
      "Feed, Reels and Explore are now hidden. Stories, profiles and notifications still work.": "動態、Reels 和探索已隱藏。限時動態、個人檔案和通知照常使用。",
      "Keep Instagram like this": "就讓 Instagram 保持這樣",
      "Choose a plan next": "接著選擇方案",
      "Start using Konvo": "開始使用 Konvo",
      "reclaim 1 hour back": "拿回 1 小時",
      "reclaim {n} hours back": "拿回 {n} 小時",
      "get your evenings back": "拿回你的夜晚",
      "{head} and<br>{sub}": "{head}，<br>{sub}",
      "Stay connected": "保持聯繫",
      "Messages, requests and friends' Stories all still work.": "訊息、邀請和朋友的限時動態都照常使用。",
      "Reclaim your focus": "找回專注力",
      "No feed, no Reels, no Explore. Nothing to fall into.": "沒有動態、Reels 和探索。沒有東西可以讓你陷進去。",
      "Lock it when you're ready": "準備好了再鎖",
      "One tap locks the Instagram app. Two passes a day, no snooze.": "一鍵鎖住 Instagram App。每天兩張通行證，沒有「稍後」。",
      "Your messages are waiting.": "你的訊息在等你。",
      "You're protected.": "保護已啟用。",
      "Instagram is blocked. Your DMs remain available through Konvo.": "Instagram 已封鎖。你的私訊仍可透過 Konvo 使用。",
      "Lifetime access active.": "終身使用已啟用。",
      "Free until {date}.": "{date} 前免費。",
      "You're in.": "搞定。",
      "Open my messages": "打開我的訊息",
      "users love Konvo": "位用戶喜愛 Konvo",
      "Ready to lock the Instagram app?": "要鎖住 Instagram App 了嗎？",
      "Konvo keeps your DMs. Two 5 minute passes a day.": "Konvo 保留你的私訊。每天兩張 5 分鐘通行證。",
      "Block Instagram": "封鎖 Instagram",
      "We'll remind you 2 days before it ends.": "結束前 2 天我們會提醒你。",
      "Your trial ends in {n} days.": "你的試用還有 {n} 天結束。",
      "Your trial ends tomorrow.": "你的試用明天結束。",
      "Keep your hours, or cancel anytime in Settings.": "留住你的時間，或隨時在「設定」取消。",
      "OK": "好",
      "Try {d} days for free": "免費試用 {d} 天",
      "Same account. Different app.": "同一個帳號。不一樣的 app。",
      "Instagram": "Instagram",
      "KONVO": "KONVO",
      "Every DM, request and Story": "每則訊息、邀請和限時動態",
      "Opens on your messages, not the feed": "打開就是訊息，不是動態",
      "No feed. Ever.": "沒有動態。永遠沒有。",
      "No Reels, no Explore": "沒有 Reels，沒有探索",
      "No ads, no suggested posts": "沒有廣告，沒有推薦貼文",
      "Lock the Instagram app when you're ready": "準備好時鎖住 Instagram app",
      "Two 5 minute passes a day. No snooze.": "每天兩次 5 分鐘通行。不能拖延。",
      "Your hours back, every week": "每週都拿回你的時間",
      "No commitment. Cancel anytime.": "不綁約，隨時取消。",
      "Free. Nothing to cancel.": "免費。不用取消。",
      "Not now": "先不要"
    },
    ko: {
      "Instagram connected.": "인스타그램 연결 완료.",
      "Your DMs and Stories are ready.": "DM과 스토리가 준비됐어요.",
      "Setting up your Konvo": "Konvo 설정 중",
      "Feed hidden": "피드 숨김",
      "Reels hidden": "릴스 숨김",
      "Explore hidden": "탐색 탭 숨김",
      "Messages kept": "메시지 유지",
      "Friends' stories kept": "친구 스토리 유지",
      "Continue": "계속",
      "Loading your plans&hellip;": "플랜 불러오는 중&hellip;",
      "Prices show in your local currency.": "가격은 현지 통화로 표시돼요.",
      "Try again": "다시 시도",
      "First {n} days free, then {price} a month.": "처음 {n}일 무료, 이후 월 {price}.",
      "Start your free {n} days": "무료 {n}일 시작하기",
      "No commitment, cancel anytime": "약정 없음, 언제든 해지",
      "Today": "오늘",
      "Unlock your DMs and Stories in Konvo. Pay $0.": "Konvo에서 DM과 스토리 잠금 해제. 오늘은 결제 없음.",
      "In {n} days": "{n}일 후",
      "You'll be charged {price} on <b>{date}</b>, <b>cancel anytime</b> before.": "<b>{date}</b>에 {price}가 결제돼요. 그 전에 <b>언제든 해지</b>할 수 있어요.",
      "{price} a month, cancel anytime.": "월 {price}, 언제든 해지.",
      "Continue with Monthly": "월간 플랜으로 계속",
      "Unlock your DMs and Stories in Konvo. Pay {price}.": "Konvo에서 DM과 스토리 잠금 해제. {price} 결제.",
      "Every month": "매달",
      "Renews at {price}, <b>cancel anytime</b>.": "{price}로 갱신, <b>언제든 해지</b>.",
      "{price} once. Lifetime access.": "{price} 한 번. 평생 이용.",
      "Get Lifetime access": "평생 이용권 받기",
      "Pay once. No subscription.": "한 번만 결제. 구독 없음.",
      "Pay {price} once. That's it.": "{price} 한 번 결제. 끝이에요.",
      "First {n} days free, then {price} a year.": "처음 {n}일 무료, 이후 연 {price}.",
      "Halfway through. We'll remind you before anything is charged.": "절반 지점. 결제 전에 미리 알려드릴게요.",
      "You'll be charged on <b>{date}</b>, <b>cancel anytime</b> before.": "<b>{date}</b>에 결제돼요. 그 전에 <b>언제든 해지</b>할 수 있어요.",
      "{price} a year ({m}/month).": "연 {price} (월 {m}).",
      "Continue with Yearly": "연간 플랜으로 계속",
      "Unlock your DMs and Stories in Konvo.": "Konvo에서 DM과 스토리 잠금 해제.",
      "In 12 months": "12개월 후",
      "Renews at {price}, <b>cancel anytime</b> before.": "{price}로 갱신, 그 전에 <b>언제든 해지</b>.",
      "Your plan ended.": "플랜이 종료됐어요.",
      "How your free trial works": "무료 체험은 이렇게 진행돼요",
      "How your plan works": "플랜은 이렇게 진행돼요",
      "Instagram is unblocked until you pick a plan. ": "플랜을 고르기 전까지 인스타그램 차단이 풀려 있어요. ",
      "SAVE {n}%": "{n}% 절약",
      "POPULAR": "인기",
      "Yearly Plan": "연간",
      "Monthly Plan": "월간",
      "{price}/month": "월 {price}",
      "{price}/year": "연 {price}",
      "Terms of Use": "이용약관",
      "Privacy Policy": "개인정보 처리방침",
      "Restore": "복원",
      "Free during beta": "베타 기간 무료",
      "Connect Konvo to Screen Time, securely.": "Konvo를 스크린 타임에 안전하게 연결해요.",
      "To block Instagram on this iPhone, Konvo will need your permission.": "이 iPhone에서 인스타그램을 차단하려면 권한이 필요해요.",
      "&ldquo;Konvo&rdquo; Would Like to Access Screen Time": "‘Konvo’이(가) 스크린 타임에 접근하려고 합니다",
      "Providing &ldquo;Konvo&rdquo; access to Screen Time may allow it to see your activity data, restrict content, and limit the usage of apps and websites.": "‘Konvo’에 스크린 타임 접근을 허용하면 활동 데이터를 보고, 콘텐츠를 제한하고, 앱 및 웹 사이트 사용을 제한할 수 있습니다.",
      "Don&rsquo;t Allow": "허용 안 함",
      "Your information is protected by Apple and stays 100% on your phone.": "정보는 Apple이 보호하며 100% 이 폰에만 남아요.",
      "Give permission": "권한 허용하기",
      "Instagram connected": "인스타그램 연결됨",
      "Your DMs are still here.": "DM은 그대로 여기 있어요.",
      "Feed, Reels and Explore are now hidden. Stories, profiles and notifications still work.": "피드, 릴스, 탐색은 이제 숨겨졌어요. 스토리, 프로필, 알림은 그대로 써요.",
      "Keep Instagram like this": "인스타그램 이대로 유지",
      "Choose a plan next": "다음은 플랜 선택",
      "Start using Konvo": "Konvo 시작하고",
      "reclaim 1 hour back": "1시간 되찾기",
      "reclaim {n} hours back": "{n}시간 되찾기",
      "get your evenings back": "저녁 시간 되찾기",
      "{head} and<br>{sub}": "{head}<br>{sub}",
      "Stay connected": "연락은 그대로",
      "Messages, requests and friends' Stories all still work.": "메시지, 요청, 친구 스토리 모두 그대로예요.",
      "Reclaim your focus": "집중력 되찾기",
      "No feed, no Reels, no Explore. Nothing to fall into.": "피드도 릴스도 탐색도 없어요. 빠져들 게 없어요.",
      "Lock it when you're ready": "준비되면 잠그세요",
      "One tap locks the Instagram app. Two passes a day, no snooze.": "한 번 탭으로 인스타그램 앱을 잠가요. 하루 패스 2번, '나중에'는 없어요.",
      "Your messages are waiting.": "메시지가 기다리고 있어요.",
      "You're protected.": "보호 중이에요.",
      "Instagram is blocked. Your DMs remain available through Konvo.": "인스타그램은 차단됐어요. DM은 Konvo에서 계속 볼 수 있어요.",
      "Lifetime access active.": "평생 이용 활성화.",
      "Free until {date}.": "{date}까지 무료.",
      "You're in.": "준비 끝.",
      "Open my messages": "내 메시지 열기",
      "users love Konvo": "명이 Konvo를 사랑해요",
      "Ready to lock the Instagram app?": "인스타그램 앱을 잠글까요?",
      "Konvo keeps your DMs. Two 5 minute passes a day.": "DM은 Konvo에 남아요. 하루 5분 패스 2번.",
      "Block Instagram": "인스타그램 차단",
      "We'll remind you 2 days before it ends.": "종료 2일 전에 미리 알려드릴게요.",
      "Your trial ends in {n} days.": "체험이 {n}일 후에 끝나요.",
      "Your trial ends tomorrow.": "체험이 내일 끝나요.",
      "Keep your hours, or cancel anytime in Settings.": "시간을 지키거나, 설정에서 언제든 취소할 수 있어요.",
      "OK": "확인",
      "Try {d} days for free": "{d}일 무료로 써보고",
      "Same account. Different app.": "같은 계정. 다른 앱.",
      "Instagram": "Instagram",
      "KONVO": "KONVO",
      "Every DM, request and Story": "모든 DM, 요청, 스토리",
      "Opens on your messages, not the feed": "피드 대신 메시지에서 열려요",
      "No feed. Ever.": "피드 없음. 영원히.",
      "No Reels, no Explore": "릴스 없음, 탐색 없음",
      "No ads, no suggested posts": "광고 없음, 추천 게시물 없음",
      "Lock the Instagram app when you're ready": "준비되면 Instagram 앱 잠그기",
      "Two 5 minute passes a day. No snooze.": "하루 5분 패스 두 번. 미루기 없음.",
      "Your hours back, every week": "매주 시간을 되찾아요",
      "No commitment. Cancel anytime.": "약정 없음. 언제든 취소.",
      "Free. Nothing to cancel.": "무료. 취소할 것도 없어요.",
      "Not now": "나중에"
    }
  };
  function T(s, v) {
    var r = (I18N[LANG] || {})[s] || s;
    if (v) for (var k in v) r = r.split("{" + k + "}").join(v[k]);
    return r;
  }

  // The onboarding quiz's motive + weekly hours arrive in the URL fragment
  // (dist/index.html sets it at the login handoff; localStorage does not
  // cross the tauri -> instagram origin boundary). Persist into this origin
  // and strip the hash so it survives login, reloads, and relaunches.
  if ((location.hash || "").indexOf('#konvo=') === 0) {
    try { localStorage.konvoQuiz = location.hash.slice(7); } catch (e) {}
    try {
      history.replaceState(null, "", location.pathname + location.search);
    } catch (e) {}
  }

  // First launch on a fresh install has no cache and no session, so
  // instagram.com takes 10-15s to paint and the window sits empty the whole
  // time. Warm launches are instant, but the cold one is the first thing a
  // new tester ever sees, and a blank window reads as a broken app. Show a
  // spinner until the page paints over it.
  (function boot() {
    // Once per app launch, never between screens. This overlay exists for
    // the cold start where instagram.com takes 10-15s to paint; showing it
    // again on an in-app navigation just reads as the app hanging.
    // sessionStorage dies with the webview session, so a relaunch shows it
    // again and a navigation does not.
    try {
      if (sessionStorage.konvoBooted) return;
      sessionStorage.konvoBooted = "1";
    } catch (e) {}
    // Konvo's whole funnel is the light design - the quiz, Instagram's
    // login, and the paywall all render while the app is pinned Light
    // (lib.rs). The paywall block below hands appearance to the phone only
    // once the wall is out of the way, so the first thing that ever renders
    // dark is the chat itself.
    var b = document.createElement("div");
    b.id = "im-boot";
    b.style.cssText = "position:fixed;inset:0;z-index:2147483646;" +
      "display:flex;flex-direction:column;align-items:center;justify-content:center";
    // Icon + wordmark, not a bare spinner. The wait is Instagram's bundle over
    // the network and is not ours to shorten, but a logo reads as an app
    // starting where a lone spinner on black reads as a page that has hung.
    // SVG attributes use single quotes on purpose: a double quote immediately
    // followed by a hash closes the Rust raw string this whole script lives in.
    b.innerHTML =
      "<svg width='62' height='62' viewBox='0 0 512 512' aria-hidden='true'>" +
        "<rect width='512' height='512' rx='116' fill='#0a84ff'/>" +
        "<g transform='translate(70,70) scale(15.5)' fill='none' stroke='#fff'" +
        " stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>" +
        "<path d='M7.9 20A9 9 0 1 0 4 16.1L2 22Z'/></g></svg>" +
      "<div id='im-boot-w' style='position:absolute;bottom:56px;font:500 15px " +
        "-apple-system,system-ui,sans-serif;letter-spacing:-0.01em;opacity:.55'>" +
        "Konvo</div>";
    (document.body || document.documentElement).appendChild(b);
    // Painted as a function of the current scheme, and repainted if the
    // scheme flips while the overlay is up - which is exactly what the
    // appearance message above causes on a dark phone.
    function paintBoot() {
      var dark = !/iPhone|iPad|iPod/.test(navigator.userAgent) ||
        (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches);
      b.style.background = dark ? '#000' : '#fff';
      var w = document.getElementById("im-boot-w");
      if (w) w.style.color = dark ? '#f5f5f7' : '#141d33';
    }
    paintBoot();
    if (window.matchMedia) {
      try {
        matchMedia("(prefers-color-scheme: dark)").addEventListener("change", paintBoot);
      } catch (e) {}
    }
    // Fade, never cut: Instagram's own launch dissolves into the app, and
    // a hard removal here read as a flicker between two screens.
    function clear() {
      var el = document.getElementById("im-boot");
      if (!el || el.dataset.going) return;
      el.dataset.going = "1";
      el.style.transition = "opacity .32s ease";
      el.style.opacity = "0";
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 340);
    }
    window.addEventListener("load", clear);
    // Never let the overlay trap someone if load never fires (offline, a
    // redirect chain, a stalled request).
    setTimeout(clear, 20000);
  })();

  // Only the algorithm's surfaces bounce. Single-media permalinks — /p/, /tv/,
  // /reel/<code> — are conversation material: a post opened from a profile
  // grid or shared in a DM is one person's post, and there is no /p/ feed to
  // leak into. The desktop's next/prev arrows on a post walk that same
  // person's grid, which is browsing a friend, not a feed.
  // Profiles themselves are deliberately open: finding someone you just met
  // and hitting Message is the whole point of a DM app. What stays shut is
  // everything you can watch - including a profile's own reels tab, which the
  // leading-slash patterns below would otherwise sail straight past.
  //
  // One deliberate exemption: /reel/<code>/, the permalink for the single reel
  // somebody sent you. Watching what a friend sent is part of the conversation;
  // the reels *feed* at /reels/ is not, and stays caged. The two differ by one
  // letter, so the pattern below is plural ON PURPOSE - restoring the old
  // "reels?" re-cages shared reels, and dropping to "reel" opens the feed.
  // Swiping out of that one reel into the next is shut off separately, below.
  //
  // /stories/ is deliberately absent: a story is a friend's post, not the
  // algorithm's — the viewer only walks people you follow and exits to "/",
  // which bounces. Restoring the pattern re-cages story viewing everywhere.
  var FEED = [
    /^\/$/, /^\/reels(\/|$)/, /^\/reel\/?$/, /^\/explore(\/|$)/,
    /^\/[A-Za-z0-9._]+\/(reels|tagged|saved)(\/|$)/
  ];
  // No exemptions. Posting a story used to open "/" behind a CSS blanket, and
  // every leak that cost time - the compose bar following the user into
  // threads, Following/Favorites rendering blank, a markup change away from
  // showing the live feed - traced back to that one hole. Posting belongs to
  // Instagram; this app is for talking. Home is simply unreachable now.
  function blocked(p) {
    return FEED.some(function (r) { return r.test(p); });
  }
  function atInbox() {
    return /^\/direct\/(inbox|requests)?\/?$/.test(location.pathname);
  }
  // Instagram's mobile web lays out smaller than their native app. Telling
  // it the screen is narrower than it is makes every row, avatar and
  // bubble render larger once the browser scales that layout to the real
  // width - and because it is a real reflow, nothing overflows sideways.
  // Measured against the native app, screen by screen: its INBOX matches
  // Instagram's mobile web 1:1 (124 vs 125px avatars, identical row
  // pitch), but its THREADS run ~7% larger (574 vs 534px bubbles). One
  // global scale cannot serve both - and scaling everything is what blew
  // up post pages. So: threads only.
  // ponytail: THE sizing knob, per route.
  var THREAD_SCALE = 1.07;
  // CSS zoom, not a viewport meta rewrite: WebKit ignored the width change
  // after first layout (two builds rendered pixel-identical), and zoom is
  // the one that actually reflows - fewer CSS pixels across, everything
  // laid out larger, still no horizontal overflow.
  // The inbox title (your username + chevron) renders smaller and sits
  // further left than the native app's. No CSS selector for it survives
  // Instagram's class churn, so find it the way findMe() does - the
  // username-shaped leaf in the top strip - and style that element.
  // ponytail: measured 18% short of native; re-measure if their header
  // changes shape.
  // Runs ONCE per arrival at the inbox, never on the tick: this is a
  // whole-document scan plus getBoundingClientRect (forced layout), and on
  // an 800ms timer it was a guaranteed hitch while scrolling.
  var titleSized = false, titleEl = null, titleMo = null;
  function sizeInboxTitle() {
    if (titleSized || !atInbox()) return;
    titleSized = true;
    var els = document.querySelectorAll("span,h1,div");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.childElementCount || el.dataset.imTitle) continue;
      var t = (el.textContent || "").trim();
      if (!/^[A-Za-z0-9._]{2,30}$/.test(t)) continue;
      var r = el.getBoundingClientRect();
      if (r.width === 0 || r.top < 0 || r.top > 120) continue;
      el.dataset.imTitle = "1";
      el.style.fontSize = "23px";
      el.style.fontWeight = "700";
      el.style.letterSpacing = "-0.02em";
      titleEl = el;
      // Watch the row it lives in: Instagram rebuilds this header when you
      // come back from a chat, and a rebuilt element carries none of our
      // styling, so the name flashed at its original size first.
      if (titleMo) titleMo.disconnect();
      var host = el.parentElement && el.parentElement.parentElement;
      if (host && window.MutationObserver) {
        titleMo = new MutationObserver(function () {
          if (titleEl && titleEl.isConnected) return;
          titleSized = false;
          sizeInboxTitle();
        });
        titleMo.observe(host, { childList: true, subtree: true });
      }
      return;
    }
  }

  function sizeViewport() {
    var want = /^\/direct\/t\//.test(location.pathname) ? String(THREAD_SCALE) : "";
    if (document.documentElement.style.zoom !== want) {
      document.documentElement.style.zoom = want;
    }
  }

  // Bridge to KonvoStore.swift. Fire-and-forget postMessage with a numbered
  // callback; Swift replies through __konvoStoreReply. A build without the
  // Swift class (or the tests) has no handler - the catch answers null and
  // everything degrades to "no verdict, keep the cache". Hoisted to the
  // top level Aug 17: the session rescue in enforce() needs it too, not
  // just the wall.
  var pending = {}, seq = 0;
  window.__konvoStoreReply = function (id, res) {
    var cb = pending[id];
    delete pending[id];
    if (cb) cb(res || null);
  };
  function storekit(cmd, productId, cb) {
    seq++;
    pending[seq] = cb;
    try {
      window.webkit.messageHandlers.konvoStore.postMessage(
        { cmd: cmd, id: seq, productId: productId || "" });
    } catch (e) { delete pending[seq]; cb(null); }
  }

  // One settle for every "report when the page finishes rendering" need.
  // Owns its observer, its tick, and a completion latch; the latch, not
  // clearInterval, is what guarantees one report - a field device fired a
  // completion branch every 92ms for 17 seconds with clearInterval doing
  // nothing (Aug 17, TestFlight 52). Starting a settle cancels the one
  // before it, so a crossing mid-settle reports nothing for the abandoned
  // page. `ready` gates completion (a quiet skeleton is not ready); the
  // cap reports regardless so a stuck page is visible, not silent.
  var activeSettle = null;
  function settle(ready, capMs, done) {
    if (activeSettle) activeSettle();
    if (!window.MutationObserver) return;
    var mo = null, tick = null, finished = false;
    var last = Date.now(), t0 = last;
    var stop = activeSettle = function () {
      finished = true;
      if (tick) clearInterval(tick);
      if (mo) { mo.disconnect(); mo = null; }
    };
    try {
      mo = new MutationObserver(function () { last = Date.now(); });
      mo.observe(document.body || document.documentElement,
        { childList: true, subtree: true });
      tick = setInterval(function () {
        if (finished) return;
        var now = Date.now();
        if ((ready() && now - last > 180) || now - t0 > capMs) {
          stop();
          done(now - t0);
        }
      }, 90);
    } catch (e) { stop(); }
  }

  // Login drop-off detail (Aug 23): what people DO on Instagram's own
  // pages before they vanish. Taps by button label, submits, the error
  // Instagram shows (classified into an enum, never quoted), and the
  // moment the app goes to the background with a login page up. Stage
  // names and enums only; nothing typed is ever read, and a "Continue as
  // <name>" button loses its name.
  var loginWatched = false, loginSubmits = 0, loginT0 = Date.now(), lastSubmitAt = 0;
  // Instagram's Log in is a React button, never a form submit, so the
  // submit listener alone reported nothing in the field (Sep 1: zero
  // login_submitted since launch). A tap on a button while the password
  // field holds text is the submit; a native submit within a beat of it
  // is the same attempt.
  function noteSubmit(st) {
    if (Date.now() - lastSubmitAt < 800) return;
    lastSubmitAt = Date.now();
    loginSubmits++;
    dropKeyTip();
    track("login_submitted", { stage: st, attempt: loginSubmits });
  }
  var loginErrorsSeen = {};
  function loginStage() {
    return location.pathname.indexOf("/challenge") !== -1 ? "challenge"
      : location.pathname.indexOf("two_factor") !== -1 ? "two_factor"
      : location.pathname.indexOf("/accounts/login") === 0 ? "login" : null;
  }
  function classifyLoginError(t) {
    t = t.toLowerCase();
    if (/password was incorrect|incorrect password/.test(t)) return "wrong_password";
    if (/doesn.t belong to an account|username you entered|can.t find an account/.test(t)) return "no_account";
    if (/security code|check the code|code you entered|code is incorrect/.test(t)) return "two_factor_code";
    if (/wait a few minutes|try again later|too many|limit/.test(t)) return "rate_limited";
    if (/suspicious|confirm it.s you|unusual|verify/.test(t)) return "challenge";
    if (/went wrong|error occurred|try again/.test(t)) return "generic";
    return "other";
  }
  function watchLogin() {
    if (loginWatched) return;
    loginWatched = true;
    document.addEventListener("click", function (e) {
      var st = loginStage();
      var b = e.target && e.target.closest && e.target.closest("button,[role=button],a");
      if (!st || !b) return;
      var label = (b.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
      if (!label) return;
      label = label.replace(/^(continue|log in) as .*$/, "$1 as").slice(0, 24);
      track("login_tap", { stage: st, label: label });
      var pw = document.querySelector("input[type=password]");
      if (b.tagName !== "A" && pw && pw.value) noteSubmit(st);
    }, true);
    // The keyboard's Passwords key is the whole trick and nobody looks
    // for it: say so once, the first time a login field takes focus, and
    // take it down on submit. Plain words, no promise the phone may not
    // keep (a phone with nothing saved still sees the key).
    // The fields must be named BEFORE iOS reads them, which happens at
    // focus: the 800ms sweep alone lost the race to a quick tap (build
    // 61 showed the key, 62 did not). So: the moment inputs appear, and
    // once more inside the focus event, which runs before WebKit reports
    // the focused field to the keyboard.
    try {
      new MutationObserver(function () {
        var st = loginStage();
        if (st) hintLoginFields(st);
      }).observe(document.documentElement, { childList: true, subtree: true });
    } catch (e) {}
    document.addEventListener("focusin", function () {
      var st = loginStage();
      if (st) hintLoginFields(st);
    }, true);
    document.addEventListener("submit", function () {
      var st = loginStage();
      if (st) noteSubmit(st);
    }, true);
    document.addEventListener("visibilitychange", function () {
      var st = loginStage();
      if (document.visibilityState !== "hidden" || !st) return;
      track("login_left", { stage: st, submits: loginSubmits,
        seconds: Math.round((Date.now() - loginT0) / 1000) });
    });
  }
  // Keychain AutoFill (Aug 23): Instagram's phone login page marks its
  // fields autocomplete="on" and keeps them outside any form, which tells
  // iOS nothing. WebKit in a third-party webview hands the keyboard a
  // content type only from the autocomplete token (Safari has its own
  // form analysis), so the saved password never surfaced. Naming the
  // fields makes the suggestion appear: one tap, Face ID, both filled.
  // The two-factor code field gets one-time-code, so the SMS code is
  // offered above the keyboard as well. Reapplied every sweep because a
  // React re-render can put the old attribute back.
  function hintLoginFields(st) {
    var i, els;
    if (st === "two_factor") {
      els = document.querySelectorAll("input[name*=code i],input[name*=verification i],input[inputmode=numeric]");
      for (i = 0; i < els.length; i++) {
        if (els[i].getAttribute("autocomplete") !== "one-time-code")
          els[i].setAttribute("autocomplete", "one-time-code");
      }
      return;
    }
    els = document.querySelectorAll("input[name=username],input[name=email]");
    for (i = 0; i < els.length; i++) {
      if (els[i].getAttribute("autocomplete") !== "username")
        els[i].setAttribute("autocomplete", "username");
    }
    els = document.querySelectorAll("input[type=password]");
    for (i = 0; i < els.length; i++) {
      if (els[i].getAttribute("autocomplete") !== "current-password")
        els[i].setAttribute("autocomplete", "current-password");
    }
  }
  // The hint shows the moment the sign-in form is on screen (Aug 23), not
  // on the first tap: the sweep calls this until the form exists.
  var hintShown = false, hintTries = 0;
  function showKeyTip(st) {
    // The Passwords key is an iOS keyboard affordance; a Mac has no key
    // bar above the keyboard, so the tip is iPhone-only (1.3.0 pulled it
    // from the Mac build, where it read as nonsense over the login form).
    if (!/iPhone|iPad|iPod/.test(navigator.userAgent)) return;
    if (hintShown || st !== "login") return;
    if (!document.querySelector("input[name=username],input[name=email],input[type=password]")) return;
    // Under Instagram's logo. The logo image lays out a beat after the
    // inputs, so wait for it to have a size (TestFlight 66 pinned the tip
    // to the top edge by racing it); after ~4s of sweeps, top edge it is.
    var top = 14, pinned = false;
    var logo = document.querySelector("img[alt*='Instagram' i],[aria-label='Instagram'],svg[aria-label*='Instagram' i]");
    if (logo && logo.getBoundingClientRect) {
      var r = logo.getBoundingClientRect();
      if (r.height > 0 && r.bottom < window.innerHeight / 2) {
        top = Math.round(r.bottom + 14);
        pinned = true;
      }
    }
    if (!pinned && hintTries++ < 5) return;
    hintShown = true;
    var tip = document.createElement("div");
    tip.id = "im-keytip";
    tip.setAttribute("style", "position:fixed;top:" + top + "px;left:16px;right:16px;" +
      "z-index:2147483646;padding:12px 18px;border-radius:18px;" +
      "background:rgba(18,22,30,.94);color:#f2f3f7;font:600 14px/1.35 -apple-system,system-ui,sans-serif;" +
      "box-shadow:0 4px 18px rgba(0,0,0,.3);text-align:center;pointer-events:none");
    tip.textContent = "Press \u201CPasswords\u201D above your keyboard and search Instagram to find your account.";
    (document.body || document.documentElement).appendChild(tip);
    track("login_keytip_shown", { stage: st });
  }
  function dropKeyTip() {
    var t = document.getElementById("im-keytip");
    if (t && t.parentNode) t.parentNode.removeChild(t);
  }
  function pollLoginErrors(st) {
    // Errors on the phone page arrive as a dialog ("Incorrect password",
    // Try again / Forgot password?), not an alert: the taps on "try again"
    // were the only witness until Sep 1. Dialogs also greet the page
    // (cookie consent fired login_error {other, submits: 0} within 4s on
    // the very first device, same day), so a dialog or live region only
    // counts once something has been submitted; the alert shapes are
    // error-only markup and always count. Stage and enum only, never text.
    var els = document.querySelectorAll("[role=alert],[id$=ErrorAlert],[data-testid*=error]" +
      (loginSubmits > 0 ? ",[role=dialog],[aria-live]" : ""));
    for (var i = 0; i < els.length; i++) {
      var t = (els[i].textContent || "").trim();
      if (t.length < 8 || loginErrorsSeen[t]) continue;
      loginErrorsSeen[t] = 1;
      track("login_error", { stage: st, error: classifyLoginError(t), submits: loginSubmits });
    }
  }

  // Cage exceptions were invisible until the stuck-chat hunt; three per
  // session, message only, nothing from the page's content.
  function noteErr(kind, msg) {
    try {
      var n = +(sessionStorage.konvoErrs || 0);
      if (n >= 3) return;
      sessionStorage.konvoErrs = n + 1;
      track("cage_error", { kind: kind, msg: String(msg || "").slice(0, 120) });
    } catch (x) {}
  }
  window.addEventListener("error", function (e) {
    noteErr("error", e && e.message);
  });
  // A boot that dies inside a promise never reaches the error event: zero
  // cage_error from 150+ people in 30 days while a device sat on a shell
  // (Sep 1). Rejections carried the missing evidence.
  window.addEventListener("unhandledrejection", function (e) {
    var r = e && e.reason;
    noteErr("rejection", (r && (r.message || r.name)) || String(r));
  });

  // The rating ask (moved here Aug 27, App Review 5.6.3): asked once, on
  // the third distinct day the inbox settles - by then the person has
  // signed in, come back twice, and knows what the app is. Never while
  // the wall is up (rating a paywall is not a moment), and iOS still
  // decides whether a sheet actually appears.
  // The moment within that day (Sep 1): not the inbox loading, but the
  // return to it after reading a chat - a finished task, the app having
  // just done its job. The day gate is Apple's; the moment is ours.
  var threadsThisSession = 0;
  // Distinct days the inbox settled, counted once per day. Shared by the
  // rating ask (day 3) and the block nudge (day 2).
  function useDays() {
    try {
      var today = new Date().toDateString();
      if (localStorage.konvoLastDay !== today) {
        localStorage.konvoLastDay = today;
        localStorage.konvoUseDays =
          (parseInt(localStorage.konvoUseDays, 10) || 0) + 1;
      }
      return parseInt(localStorage.konvoUseDays, 10) || 0;
    } catch (e) { return 0; }
  }
  // Assigned by the pass-button block below; false until then.
  var nudgeBlock = function (days) { return false; };
  // The reminder promise, kept without a notification permission (Sep 1):
  // from two days before the trial ends, once a day, a sheet in the inbox.
  // The push (KonvoStore "notify") is the other half; this one needs
  // nothing granted. Never under a wall.
  function trialBar() {
    var end, today;
    try {
      end = parseInt(localStorage.konvoTrialEnd, 10);
      today = new Date().toDateString();
      if (!end || document.getElementById("im-pay")) return false;
      if (localStorage.konvoTrialBarDay === today) return false;
    } catch (e) { return false; }
    var left = Math.ceil((end - Date.now()) / 86400000);
    if (left < 1 || left > 2) return false;
    try { localStorage.konvoTrialBarDay = today; } catch (e) {}
    track("trial_bar_shown", { days_left: left });
    var sheet = document.createElement("div");
    sheet.id = "im-pass-sheet";
    sheet.innerHTML = "<div id='im-pass-card'><h3>" +
      (left === 1 ? T("Your trial ends tomorrow.") : T("Your trial ends in {n} days.", { n: left })) +
      "</h3><p>" + T("Keep your hours, or cancel anytime in Settings.") + "</p>" +
      "<button class='im-x'>" + T("OK") + "</button></div>";
    sheet.addEventListener("click", function (e) {
      if (!e.target.closest(".im-x") && e.target !== sheet) return;
      if (sheet.parentNode) sheet.parentNode.removeChild(sheet);
    });
    (document.body || document.documentElement).appendChild(sheet);
    return true;
  }
  function maybeAskReview(days) {
    try {
      if (localStorage.konvoReviewAsked) return;
      if (days < 3) return;
      if (!threadsThisSession) return;
      if (document.getElementById("im-pay")) return;
      localStorage.konvoReviewAsked = "1";
      track("review_asked", {});
      storekit("review", null, function () {});
    } catch (e) {}
  }

  // Thread self-heal (Sep 1). Instagram A/B-ships a web build whose
  // client-side inbox->thread transition never fires the message load in
  // WKWebView: the URL becomes /direct/t/<id>, a bare skeleton paints, and
  // NOTHING is requested - no error, no network, forever (measured on a
  // live 16e: composer absent, zero resource entries in 12s). A full
  // document load of the SAME url always renders it (composer, messages,
  // 49 requests). So when a thread route sits on a skeleton with no
  // composer past a generous window, reload it once. Both premises are
  // device-verified this session; the signal is the composer the cage
  // already knows (div[role=textbox]), not a guessed selector - the
  // lesson of the dead stall probe. Once per thread id per session so a
  // genuinely composer-less thread cannot loop; never under the wall.
  var threadHealed = {}, threadHealArmed = "", threadHealTimer = null;
  function healThread() {
    var p = location.pathname;
    var m = p.match(/^\/direct\/t\/(\d+)/);
    if (!m) { threadHealArmed = ""; if (threadHealTimer) { clearTimeout(threadHealTimer); threadHealTimer = null; } return; }
    if (p === threadHealArmed) return;            // already watching this thread
    threadHealArmed = p;
    if (threadHealTimer) clearTimeout(threadHealTimer);
    var id = m[1];
    if (threadHealed[id]) return;                 // one attempt per thread, no loop
    threadHealTimer = setTimeout(function () {
      threadHealTimer = null;
      if (location.pathname !== p) return;        // moved away
      if (document.querySelector('div[role="textbox"]')) return;  // loaded fine
      if (document.getElementById("im-pay")) return;              // never under the wall
      threadHealed[id] = 1;
      track("thread_reload", {});
      location.reload();
    }, 5000);
  }

  function enforce() {
    if (!location.hostname.endsWith("instagram.com")) return;
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) sizeViewport();
    if (atInbox()) sweepKeepBack();
    if (blocked(location.pathname)) {
      try { window.stop(); } catch (e) {}
      location.replace("/direct/inbox/");
    }
    // The 35% who start login and never arrive die somewhere in here, and
    // these routes are the only witnesses. The challenge page is the
    // emailed verification code - the wall that stopped App Review twice.
    // Stage names only, never anything from the page.
    var ls = location.pathname.indexOf("/challenge") !== -1 ? "challenge"
      : location.pathname.indexOf("two_factor") !== -1 ? "two_factor"
      : location.pathname.indexOf("/accounts/login") === 0 ? "login" : null;
    if (ls && ls !== lastLoginStage) {
      lastLoginStage = ls;
      // A signed-in visit to these routes is not login friction.
      if (!/(?:^|; )ds_user_id=\d/.test(document.cookie))
        track("login_step", { stage: ls });
    }
    if (ls && !/(?:^|; )ds_user_id=\d/.test(document.cookie)) {
      watchLogin();
      hintLoginFields(ls);
      showKeyTip(ls);
      pollLoginErrors(ls);
    }
    // Session rescue: landing on the login page with no session cookie
    // means WebKit lost the cookies (lazy disk flush plus a force-quit;
    // a tester relogged every launch, Aug 17). Native keeps a snapshot
    // from the last settled inbox; restore it once and go back. A real
    // logout restores cookies Instagram already killed server-side,
    // lands here again, and the once-flag stops the loop. Challenge and
    // 2FA pages are mid-flow and must not be interrupted.
    if (ls === "login" && !cookieRestoreTried &&
        !/(?:^|; )ds_user_id=\d/.test(document.cookie)) {
      cookieRestoreTried = true;
      storekit("cookieRestore", null, function (res) {
        if (res && res.restored) {
          track("session_restored");
          location.replace("/direct/inbox/");
        }
      });
    }
    // Route flag so CSS can hide the inbox's back-to-feed arrow while
    // keeping the thread view's back-to-inbox arrow.
    var ib = atInbox();
    document.documentElement.classList.toggle("im-inbox", ib);
    // Tell the native side when the route crosses the inbox boundary: the
    // back-swipe keeps an inbox snapshot to reveal under the drag, because
    // Instagram takes ~300ms to render history.back() and the live page
    // mid-render is the glitch every naive swipe shows.
    var r = ib ? "inbox"
      : location.pathname.indexOf("/direct/t/") === 0 ? "thread" : "other";
    healThread();
    // Instagram ships the DM composer (a role=textbox contenteditable)
    // without autocorrect, so typing gets no correction bar. In a
    // messaging app that is a bug, not a preference. Re-asserted on the
    // tick because Instagram rebuilds the composer per thread and per
    // send; the attribute guard keeps the tick from touching a composer
    // that is already fixed. Set before focus on purpose: iOS reads
    // keyboard traits at focus time and ignores changes made after.
    if (r === "thread") {
      var tb = document.querySelector('div[role="textbox"]');
      if (tb && tb.getAttribute("autocorrect") !== "on") {
        tb.setAttribute("autocorrect", "on");
        tb.setAttribute("autocapitalize", "sentences");
        tb.setAttribute("spellcheck", "true");
      }
    }
    if (r !== lastRoute) {
      lastRoute = r;
      // Reading a conversation is the product working. Launch counts alone
      // cannot tell an open that led to a chat from one that bounced.
      // The route watcher crosses once per navigation, so no extra guard:
      // the app always loads the inbox, so the first crossing is never a
      // thread, and if it ever were, that would be a thread open too.
      if (r === "thread") {
        threadsThisSession++;
        track("thread_opened");
        // How slow switching into a chat FEELS ("way slower to text and
        // switch between ppl", Aug 17). Ready means real message rows:
        // the placeholder renders instantly, goes quiet, and fills only
        // when the fetch lands - quiet alone once reported 181ms "ready"
        // on a stuck skeleton. rows 0 at the cap IS the stuck-chat signal.
        var threadRows = function () {
          // div[role='group'] is a message bubble in Instagram's CURRENT
          // thread markup - verified against the live DOM on device (Aug
          // 31, Web Inspector probe: 9 groups on a 9-bubble chat, zero
          // role='row' anywhere). The old row selector never matched in
          // production and pinned every thread_ready at the cap with
          // rows 0 - see the konvo-dead-thread-probe memory. If rows
          // flatlines at 0 across all builds again, the markup moved
          // again: re-probe on device before trusting any thread metric.
          return document.querySelectorAll("div[role='group']").length;
        };
        settle(function () { return threadRows() > 0; }, 10000, function (ms) {
          track("thread_ready", { ms: ms, rows: threadRows() });
        });
      }
      titleSized = false;
      if (r !== "inbox" && titleMo) { titleMo.disconnect(); titleMo = null; }
      if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
        try {
          window.webkit.messageHandlers.konvoStore.postMessage(
            { cmd: "route", id: 0, productId: r });
        } catch (e) {}
        // Arriving at the inbox: report when it FINISHES rendering - DOM
        // mutations quiet for a beat, capped hard - so the back-swipe
        // holds its snapshot until the crossfade can land on a finished
        // inbox instead of a mid-render skeleton.
        if (r === "inbox") {
          settle(function () { return true; }, 2000, function (ms) {
            sizeInboxTitle();
            // What a connected user actually finds: 20 of the first 28
            // sign-ins never opened a thread. Thread count and time to
            // a settled inbox are the two numbers that can say why.
            var rp = {
              threads: document.querySelectorAll(
                'a[href^="/direct/t/"]').length,
              ms: ms };
            // Identity for the roster, decided Aug 14: ds_user_id is
            // the stable Instagram id, titleEl (found by
            // sizeInboxTitle above) is the handle. Retries each settle
            // until a handle is captured, then never again. Threads
            // and message content stay untouched.
            try {
              var idm = document.cookie.match(/(?:^|; )ds_user_id=(\d+)/);
              if (idm && !localStorage.konvoIdentified) {
                rp.$set = { ig_user_id: idm[1] };
                var un = titleEl && (titleEl.textContent || "").trim();
                if (un) {
                  rp.$set.ig_username = un;
                  localStorage.konvoIdentified = "1";
                }
              }
            } catch (e) {}
            track("inbox_ready", rp);
            var days = useDays();
            if (!trialBar() && !nudgeBlock(days)) maybeAskReview(days);
            // A settled inbox is proof these cookies are the good
            // ones: snapshot them natively so a force-quit cannot
            // lose the session (see the login rescue above).
            storekit("cookieSave", null, function () {});
            try {
              window.webkit.messageHandlers.konvoStore.postMessage(
                { cmd: "route", id: 0, productId: r + "-settled" });
              // The letterbox above and below the webview is native and
              // CSS cannot reach it. Hand it the page's own background
              // so the app reads as one surface instead of a page with
              // black bars around it.
              window.webkit.messageHandlers.konvoStore.postMessage(
                { cmd: "bg", id: 0,
                  productId: getComputedStyle(document.body).backgroundColor });
            } catch (e) {}
          });
        }
      }
    }
  }
  var lastRoute = null, lastLoginStage = null;
  var cookieRestoreTried = false;
  // Every screen change gets the same push, wherever it goes - a DM, a
  // profile from a DM, a profile from search. pushState is Instagram's
  // forward navigation and popstate is a back; the native side owns the
  // animation, so this only has to say which way. Full page loads (not
  // SPA) fire neither and simply do not animate.
  // Search mode is a route the URL never changes for, so the class carries
  // it: focusing a search box unhides Instagram's own way back out.
  // Search mode outlives the keyboard, and the arrow is display:none by
  // the time we look (our own back-button CSS hides it), so its bounding
  // box is zeros and no geometry can find it - which is why the tag never
  // landed (Aug 24, device). Structure instead of geometry: the arrow that
  // belongs to search lives in the same small subtree as the search
  // input, so walk up a few levels from every text input and tag any Back
  // arrow found there. The header's escape arrow sits in another subtree
  // and stays hidden. Re-tagged every sweep because re-renders replace
  // the node; a tagged node that leaves the DOM needs no untagging.
  function sweepKeepBack() {
    var inputs = document.querySelectorAll("input[type=text],input:not([type])");
    for (var i = 0; i < inputs.length; i++) {
      var node = inputs[i];
      for (var up = 0; up < 4 && node; up++) {
        node = node.parentElement;
        if (!node || node === document.body) break;
        var arrows = node.querySelectorAll(
          "a:has(svg[aria-label='Back']),[role='button']:has(svg[aria-label='Back'])," +
          "a:has(" + BACK + "),[role='button']:has(" + BACK + ")");
        if (arrows.length) {
          for (var j = 0; j < arrows.length; j++) arrows[j].classList.add("im-keep-back");
          break;
        }
      }
    }
  }
  document.addEventListener("focusin", function (e) {
    var t = e.target;
    // Inbox only, and real inputs only: Instagram's message composer is a
    // role=textbox, so this used to fire on every tap into a chat and run
    // three document-wide :has() scans while the keyboard animated.
    if (!t || t.tagName !== "INPUT" || !atInbox()) return;
    // Instagram renders the search-mode back arrow a beat after focus, and
    // sometimes re-renders it again; one shot missed it.
    [60, 250, 600].forEach(function (ms) {
      setTimeout(sweepKeepBack, ms);
    });
  }, true);

  var isPhone = /iPhone|iPad|iPod/.test(navigator.userAgent);

  // Which destinations are worth a slide: a conversation, and a person's
  // profile. Settings, Edit profile, activity, posts - those are places a
  // button opens, not screens you walk into, and animating everything made
  // the app feel like it was constantly sliding.
  // Trailing slash OPTIONAL: Instagram pushes a profile as "/name/" from
  // some controls and "/name" from others (measured on device), and
  // requiring the slash silently dropped half the profile taps into the
  // no-animation path.
  function worthSliding(p) {
    if (/^\/direct\/t\//.test(p)) return true;
    return /^\/[A-Za-z0-9._]+\/?$/.test(p) &&
      !/^\/(accounts|explore|direct|p|reel|reels|stories|about|legal|challenge|notifications)(\/|$)/
        .test(p);
  }
  // A tap on a back arrow always pops (right to left), whatever Instagram's
  // router calls it - their Message button replays as a back, and a back
  // arrow sometimes replays as a push.
  var lastBackTap = 0, ownButtonAt = 0;
  // The tap must land ON the arrow, not merely inside something that
  // contains one: Instagram's thread header puts the back arrow and the
  // friend's name in the same control, so a "contains" test counted
  // opening their profile as pressing back and slid the wrong way.
  document.addEventListener("click", function (e) {
    var svg = e.target.closest && e.target.closest("svg");
    if (svg && svg.getAttribute("aria-label") === "Back") {
      lastBackTap = Date.now();
    }
  }, true);
  function navFor(dir) {
    var p = location.pathname;
    // Konvo's own buttons: open, do not travel.
    if (Date.now() - ownButtonAt < 800) { ownButtonAt = 0; return "push-silent"; }
    if (Date.now() - lastBackTap < 800) { lastBackTap = 0; return "pop"; }
    // A conversation and a profile are both places you go INTO, whatever
    // Instagram's router replays them as - opening someone's profile from
    // the top of a chat came through as a back and slid the wrong way.
    if (/^\/direct\/t\//.test(p) || worthSliding(p)) return "push";
    return "push-silent";
  }

  var navSuppress = 0, navPath = "";
  function nav(dir) {
    if (!isPhone) return;
    // One tap, one animation: spaGo raises both events - for the SAME
    // destination. A different path inside the window is a fresh tap
    // (swipe back, then straight into the next chat) and must report.
    if (navSuppress && Date.now() - navSuppress < 400 &&
        location.pathname === navPath) return;
    navSuppress = Date.now();
    navPath = location.pathname;
    try {
      window.webkit.messageHandlers.konvoStore.postMessage(
        { cmd: "nav", id: 0, productId: dir });
    } catch (e) {}
  }
  var push = history.pushState.bind(history);
  history.pushState = function () {
    push.apply(null, arguments);
    setTimeout(function () {
      // Opening a post is not a screen you walk into sideways - the photo
      // belongs to the profile behind it, so no slide. It still has to be
      // STACKED though: without a picture of the profile underneath it,
      // swiping back out of a post revealed whatever was one level deeper
      // and stuttered while the real page caught up.
      // enforce() FIRST: it sets the thread zoom, and changing the page
      // scale after the native slide has started makes the incoming screen
      // pop mid-animation.
      enforce();
      nav(navFor("push"));
    }, 0);
  };
  var replace = history.replaceState.bind(history);
  history.replaceState = function () { replace.apply(null, arguments); setTimeout(enforce, 0); };
  window.addEventListener("popstate", function () {
    // Direction follows what the user did, not what Instagram's router
    // did. Opening a conversation from a profile's Message button is a
    // step INTO something even though their router replays it as a back,
    // and animating that leftwards feels like the app went backwards.
    enforce();
    setTimeout(function () { nav(navFor("pop")); }, 0);
  });
  document.addEventListener("DOMContentLoaded", enforce);
  setInterval(enforce, 800); // SPA belt-and-braces: some route changes skip history APIs

  // The native app's little tap when a message sends. The selector is a
  // guess at Instagram's send control, patchable as sendSel in the
  // cage-patch; a miss costs the buzz and nothing else.
  var SEND_SEL = "div[role=button][aria-label*='Send' i],button[aria-label*='Send' i]";
  if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
    document.addEventListener("click", function (e) {
      var t = e.target.closest && e.target.closest(SEND_SEL);
      if (!t) return;
      try {
        window.webkit.messageHandlers.konvoStore.postMessage(
          { cmd: "haptic", id: 0, productId: "" });
      } catch (err) {}
    }, true);
  }

  // Remote hotfix channel - config, NOT code. Instagram ships DOM changes on
  // its schedule and App Review takes days; a static JSON on konvoinstall.com
  // closes that gap: extra hide-selectors, extra CSS, extra bounce patterns,
  // live one git push after Meta breaks something. Strictly additive - the
  // baseline cage in this binary always applies - and remote JS is
  // deliberately NOT supported: selectors and regexes are data, downloadable
  // code is an App Review 2.5.2 rejection. Last good patch is cached so an
  // offline launch keeps yesterday's fix; a failed fetch changes nothing.
  function applyPatch(p) {
    if (!p) return;
    try {
      var extra = "";
      if (p.hide && p.hide.length) extra += p.hide.join(",") + "{display:none !important;}";
      if (p.css) extra += p.css;
      if (extra) {
        var st = document.createElement("style");
        st.textContent = extra;
        (document.head || document.documentElement).appendChild(st);
      }
      (p.block || []).forEach(function (s) { FEED.push(new RegExp(s)); });
      // {"superwall": true} switches the paywall from the injected wall to
      // the native Superwall placement (KonvoStore). Off until campaigns
      // exist in the Superwall dashboard; flipping it back off is the
      // kill switch if a remote paywall misbehaves.
      if (p.superwall) window.__konvoSW = true;
      // {"rcPaywall": true} (Sep 1) puts RevenueCat's remotely designed
      // paywall on the price step; the injected price screen stays the
      // floor. Off until the paywall exists in RevenueCat's dashboard;
      // flipping it off is the kill switch.
      if (p.rcPaywall) window.__konvoRC = true;
      // {"betaFree": false} withdraws the free-during-beta button
      // from tester builds without shipping anything.
      if (p.betaFree === false) window.__konvoNoFree = true;
      if (p.sendSel) SEND_SEL = p.sendSel;
      enforce();
    } catch (e) {}
  }
  try { applyPatch(JSON.parse(localStorage.konvoPatch || "null")); } catch (e) {}
  fetch("https://konvoinstall.com/cage-patch.json", { cache: "no-store" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (p) {
      if (!p) return;
      try { localStorage.konvoPatch = JSON.stringify(p); } catch (e) {}
      applyPatch(p);
    })
    .catch(function () {});

  // Sleep/wake, desktop only: after the machine sleeps, Instagram's live
  // connection is dead but the page still looks fine, so the inbox silently
  // stops updating and the app feels hung. Timers do not fire while asleep, so
  // a gap between ticks is the signal - more reliable than visibilitychange,
  // which does not fire consistently across sleep on macOS.
  //
  // Must NOT run on iOS. iOS suspends timers every time the app is
  // backgrounded, so the same check fires on any return after five minutes and
  // reloads instagram.com from scratch - a 5-10s wait every single time you
  // open the app. iOS already evicts and reloads the webview on its own when it
  // needs to, so there is nothing here for us to fix.
  // ponytail: full reload, which drops an unsent draft. Reconnecting instead
  // would mean driving Instagram's own minified socket code.
  if (!/iPhone|iPad|iPod/.test(navigator.userAgent)) {
    var tick = Date.now();
    setInterval(function () {
      var now = Date.now();
      if (now - tick > 300000) location.reload(); // 5 min of missing ticks
      tick = now;
    }, 30000);

    // Real-time unread notifications. The Mac app keeps running while hidden,
    // so this keeps ticking after the window is closed. Polls the same badge
    // endpoint Instagram's own web client polls for its tab badge - same
    // origin, same session, same fingerprint, so nothing about it looks
    // foreign. Notify only on an increase and only while the window is not
    // being looked at; reading threads lowers the count and resets the
    // baseline by itself. The invoke is a no-op unless the notification
    // capability granted it (macOS only), and any failure stays silent.
    // ponytail: a 30s poll, not Instagram's realtime socket - worst case a
    // message is 30s late. Driving their minified MQTT code is not worth it.
    var lastBadge = null;
    setInterval(function () {
      fetch("/api/v1/direct_v2/get_badge_count/", {
        headers: { "X-IG-App-ID": "936619743392459" }
      }).then(function (r) { return r.json(); }).then(function (d) {
        var n = d && typeof d.badge_count === "number" ? d.badge_count : null;
        if (n === null) return;
        if (lastBadge !== null && n > lastBadge && window.__TAURI_INTERNALS__ &&
            (document.hidden || !document.hasFocus())) {
          window.__TAURI_INTERNALS__.invoke("plugin:notification|notify", {
            options: {
              title: "Konvo",
              body: n === 1 ? "1 unread conversation" : n + " unread conversations"
            }
          }).catch(function () {});
        }
        lastBadge = n;
      }).catch(function () {});
    }, 30000);
  }

  // Hide every navigation doorway. Desktop: the left rail. Mobile web: the
  // bottom tab bar (same aria-labels, different containers) plus the
  // "open the app" upsells and the inbox back arrow.
  // Instagram localizes every aria-label (French phone, live DOM, Aug 31:
  // "Précédent", "Options", "Parcourir"), so a door keyed on English text
  // stays open abroad. Hrefs and SVG geometry do not translate: the back
  // chevron is this polyline in every locale, verified on that DOM.
  var BACK = 'polyline[points="9.276 4.726 2.001 12.004 9.276 19.274"]';
  var css = [
    'a:has(svg[aria-label="Home"])',
    'a[href="/"]',
    'a:has(svg[aria-label="Explore"])',
    'a[href="/explore/"]',
    'a:has(svg[aria-label="Reels"])',
    'a[href^="/reels/"]',
    '[role="link"]:has(svg[aria-label="Search"])',
    'a:has(svg[aria-label="Search"])',
    'div[role="button"]:has(svg[aria-label="Search"])',
    // The notifications heart is phone-only, pushed on below.
    'a:has(svg[aria-label="Profile"])',
    // The Messages nav entry stays. It used to be redundant - every screen was
    // already a DM screen - but profiles and notifications are reachable now,
    // and it is the only way back to the inbox from either.
    // the hamburger "More" / Settings at the bottom
    'svg[aria-label="Settings"]',
    'a:has(svg[aria-label="Settings"])',
    'div[role="button"]:has(svg[aria-label="Settings"])',
    // The gear is "Options" in French; its href does not translate.
    'a[href^="/accounts/settings"]',
    'div[role="button"]:has(svg[aria-label="More"])',
    'a:has(svg[aria-label="More"])',
    // Threads + the "Also from Meta" app-switcher grid
    'a[aria-label="Threads"]',
    'a:has(svg[aria-label="Threads"])',
    'div[role="button"]:has(svg[aria-label="Threads"])',
    '[aria-label="Also from Meta"]',
    'div[role="button"]:has(svg[aria-label="Also from Meta"])',
    // The Threads link carries no label at all on a French phone; this
    // is the href the live DOM showed (threads.com), nothing guessed.
    'a[href*="threads.com"]',
    // Mobile web: "use the app" upsells and store badges
    'a[href*="itunes.apple.com"]',
    'a[href*="apps.apple.com"]',
    'a[href*="play.google.com"]',
    'a[href*="app.link"]',
    '[aria-label="Open app"]',
    // Mobile web: the inbox back arrow escapes to the feed; the thread view
    // arrow (same label) must survive, hence the route-scoped class.
    // The inbox back arrow escapes to the feed, so it goes. Search mode
    // renders a SECOND, identical-looking arrow beside the search field
    // which is the way out of search; the focus handler tags that one
    // .im-keep-back by its row, and only it survives.
    'html.im-inbox a:has(svg[aria-label="Back"]):not(.im-keep-back)',
    'html.im-inbox div[role="button"]:has(svg[aria-label="Back"]):not(.im-keep-back)',
    'html.im-inbox [role="button"]:has(svg[aria-label="Back"]):not(.im-keep-back)',
    'html.im-inbox a:has(' + BACK + '):not(.im-keep-back)',
    'html.im-inbox div[role="button"]:has(' + BACK + '):not(.im-keep-back)',
    'html.im-inbox [role="button"]:has(' + BACK + '):not(.im-keep-back)',
    // Message Requests tab in the inbox header
    'a[href="/direct/requests/"]',
    'a[href^="/direct/requests"]',
    // Instagram's own "+". Hidden everywhere, and this is SETTLED, not a
    // default: builds 28-29 (2026-07-31) ran the story-posting experiment a
    // tester asked for - the CSS unhide revealed nothing (the DM inbox
    // renders no create entry) and a direct probe at /create/story/ was
    // bounced through "/" by Instagram itself, on device. Web posting cannot
    // work without exempting home, and home is where every 07-29 leak came
    // from. Posting lives in the real Instagram app.
    '[role="link"]:has(svg[aria-label="New post"])',
    'div[role="button"]:has(svg[aria-label="New post"])',
    'a:has(svg[aria-label="New post"])',
    'div[role="button"]:has(svg[aria-label="Create"])'
  ];
  // The Notifications heart stays on both platforms. This flip-flopped:
  // shipped on desktop 2026-07-30 (build 25), reverted the same afternoon
  // ("it's triggering smth in me"), re-added by explicit request 2026-07-31.
  // The wall behind it holds either way — likes tapped in the drawer land on
  // /p/, follows land on profiles, both deliberately open now.
  var style = document.createElement("style");
  // Avatars are never a doorway, but they are also not clutter: hiding the
  // link took the picture with it and left a hole in the profile header. Inert
  // rather than gone - the face still shows, the tap goes nowhere, and
  // profiles stay something you reach through a deliberate "View profile".
  style.textContent = css.join(',') + '{display:none !important;}' +
    // The rule that made every avatar inert is GONE: it dated from when
    // profiles were unreachable, and profiles are a deliberate doorway now.
    // It was also killing taps on the notes tray, which is built out of
    // avatars - so liking a friend's note did nothing.
    // Two lines that stop the app reading as a web page: the grey flash
    // WebKit paints under every tap is the loudest browser tell there is,
    // and manipulation drops the wait-for-double-tap-zoom delay so taps
    // land immediately. Pinch zoom on photos still works.
    "*{-webkit-tap-highlight-color:transparent}" +
    "html{touch-action:manipulation}" +
    // No browser callout menus on app chrome: long-pressing an avatar or
    // a button in a native app does not offer Save Image or Copy Link.
    // Message TEXT is deliberately untouched - codes and addresses have to
    // stay selectable.
    "img,svg,[role='button'],[role='link'],a{-webkit-touch-callout:none}" +
    "svg,[role='button']{-webkit-user-select:none}";
  (document.head || document.documentElement).appendChild(style);

  // The phone inbox has no tab bar at all - Instagram's mobile-web DM layout
  // ships without one, so there was never a heart to keep. The only
  // notifications doorway on a phone is one we add ourselves: a floating
  // heart on the inbox, straight to Instagram's own activity page. Gated to
  // the inbox route (im-inbox) so it never floats over a conversation, and to
  // phones - the Mac tried a heart in build 25 and it came back out same-day.
  if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
    // Single-quoted on purpose: starting a double-quoted string with a hash
    // would put quote-then-hash in the source, which closes the Rust raw
    // string this script lives in.
    style.textContent +=
      '#im-heart{display:none;position:fixed;right:16px;bottom:24px;width:44px;height:44px;' +
      'border-radius:50%;background:rgba(38,38,38,.92);color:#f5f5f7;z-index:2147483000;' +
      'align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,.4)}' +
      'html.im-inbox #im-heart{display:flex}' +
      '#im-me{display:none;position:fixed;right:16px;bottom:80px;width:44px;height:44px;' +
      'border-radius:50%;background:rgba(38,38,38,.92);color:#f5f5f7;z-index:2147483000;' +
      'align-items:center;justify-content:center;box-shadow:0 2px 10px rgba(0,0,0,.4)}' +
      'html.im-inbox #im-me{display:flex}';
    // Our buttons are plain anchors, and an anchor is a FULL PAGE LOAD:
    // Instagram's entire bundle again, seconds of waiting, and the trip
    // back reloads whatever you came from. Instagram's own links go
    // through its router instead, so hand the tap to a matching link of
    // theirs when the page has one; the anchor href stays as the fallback.
    // Drive Instagram's own router instead of following the link: an
    // anchor is a full page load - their entire bundle again, seconds of
    // waiting, and the trip back reloads whatever you came from. A
    // pushState plus a popstate makes their SPA render the route in place
    // (measured on device: /accounts/activity/ came back as a rendered
    // /notifications/ in ~1s with no reload).
    // ponytail: if a route ever ignores the event the URL changes with
    // nothing drawn, so a real navigation follows half a second later.
    function spaGo(href, e) {
      e.preventDefault();
      ownButtonAt = Date.now();
      var before = document.body ? document.body.innerText.slice(0, 80) : "";
      history.pushState({}, "", href);
      dispatchEvent(new PopStateEvent("popstate", { state: {} }));
      setTimeout(function () {
        var now = document.body ? document.body.innerText.slice(0, 80) : "";
        if (now === before) location.assign(href);
      }, 500);
    }
    var heart = document.createElement("a");
    heart.id = "im-heart";
    // /notifications/ is the phone route; /accounts/activity/ is desktop.
    heart.href = /iPhone|iPad|iPod/.test(navigator.userAgent)
      ? "/notifications/" : "/accounts/activity/";
    heart.setAttribute("aria-label", "Notifications");
    heart.addEventListener("click", function (e) { spaGo(heart.href, e); });
    heart.innerHTML =
      "<svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor'" +
      " stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>" +
      "<path d='M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0" +
      "-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z'/></svg>";
    (document.body || document.documentElement).appendChild(heart);

    // Your own profile, the one doorway the cage never offered. Instagram
    // needs the username in the path and the session endpoint that used to
    // supply it answers 400 to this webview, so read it off the inbox
    // header's account switcher and remember it. Unknown username falls
    // back to Edit profile, which needs no username at all.
    // ponytail: a text-shaped guess at the header; corrections ride the
    // cage-patch, and the fallback is always a real destination.
    function findMe() {
      try { if (localStorage.konvoMe) return localStorage.konvoMe; } catch (e) {}
      // Instagram's mobile inbox header is not a <header>, so go by
      // position instead of tag: the account switcher is the only
      // username-shaped leaf in the top strip of the page. Runs on tap,
      // never on a frame, and the answer is cached for good.
      var els = document.querySelectorAll("span,div,h1");
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        if (el.childElementCount) continue;
        var t = (el.textContent || "").trim();
        if (!/^[A-Za-z0-9._]{2,30}$/.test(t)) continue;
        var r = el.getBoundingClientRect();
        if (r.width === 0 || r.top < 0 || r.top > 130) continue;
        try { localStorage.konvoMe = t; } catch (e) {}
        return t;
      }
      return "";
    }
    var me = document.createElement("a");
    me.id = "im-me";
    me.href = "/accounts/edit/";
    me.setAttribute("aria-label", "Your profile");
    me.innerHTML =
      "<svg width='22' height='22' viewBox='0 0 24 24' fill='none' stroke='currentColor'" +
      " stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>" +
      "<path d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/>" +
      "<circle cx='12' cy='7' r='4'/></svg>";
    me.addEventListener("click", function (e) {
      var u = findMe();
      me.href = u ? "/" + u + "/" : "/accounts/edit/";
      spaGo(me.href, e);
    });
    (document.body || document.documentElement).appendChild(me);
  }


  // The notes/stories tray in the inbox is deliberately visible now: with
  // home caged it is the only doorway into a friend's story on either
  // platform. The hideTray() that removed it died with the /stories/ bounce.
  //
  // The Requests tab is hidden by its href in the css list above; the old
  // English text scan ("Requests (2)") died on the French walk of Aug 31,
  // where the tab reads "Demandes" and the href rule matched anyway.
  // The iPhone tap-swallower that used to live here is gone. Its entire job was
  // to stop shared media being watched - it killed the tap on a media bubble
  // because the fullscreen viewer it opens never changes the URL, so the path
  // cage above could not see it. Watching what someone sent you is now the
  // point, so there is nothing left for it to do.
  //
  // It took the "View profile" href bail-out and the inbox-avatar carve-out with
  // it; both existed only to stop the swallower being over-broad. If a reason to
  // block media taps ever comes back, those two go back with it.

  // NB: only attribute writes belong in here. This runs from a MutationObserver
  // watching childList, so anything that adds or removes nodes (textContent
  // included) retriggers it and spins until the page hangs.
  // The nav's Profile entry, which draws itself as your own avatar rather than
  // a labelled icon. It is not inside a <nav>, carries no aria-label, and is
  // an <a> shaped exactly like the avatar links we want to keep - what
  // separates it is position: chrome sits outside <main>, content inside it.
  // The profile header and every face in a thread are inside <main>.
  function hideProfileLink() {
    // Start from the handful of profile-picture images, not from every
    // anchor on the page: same result, ~50x fewer nodes walked.
    var pics = document.querySelectorAll("img[alt$='profile picture']");
    for (var i = 0; i < pics.length; i++) {
      var a = pics[i].closest("a[href]");
      if (a && !a.closest("main")) a.style.display = "none";
    }
  }
  // A link someone sends in a DM opens nowhere: Instagram marks it
  // target="_blank", and a webview has no tabs, so window.open is a silent
  // no-op. Hand it to the real browser instead - inside the cage there is no
  // back button and no reason to render someone else's site.
  //
  // Deliberately not done by cancelling the navigation in Rust: the login
  // chain hops across Meta domains and out to reCAPTCHA, and a host allow-list
  // there strands it on a blank page. A click on an anchor is the one signal
  // that separates "the user asked for this" from "Instagram is redirecting".
  // What counts as "leaves the app": any http(s) URL that is not Instagram's.
  // l.instagram.com is Meta's linkshim - every external link in a DM or a
  // story sticker is wrapped in it - so it unwraps to its ?u= destination
  // rather than being treated as Instagram's own.
  function externalize(href) {
    try {
      var u = new URL(href, location.href);
      if (!/^https?:$/.test(u.protocol)) return null;
      if (u.hostname === "l.instagram.com") {
        var real = u.searchParams.get("u");
        if (real) return externalize(real) || real;
      }
      if (/(^|\.)instagram\.com$/.test(u.hostname)) return null;
      return u.href;
    } catch (e) { return null; }
  }
  // One tap can reach the browser twice - the anchor handler fires AND
  // Instagram's own handler calls window.open on the same URL - so identical
  // opens within a beat collapse to one Safari tab.
  var lastOpen = "", lastOpenAt = 0;
  function openExternal(url) {
    var now = Date.now();
    if (url === lastOpen && now - lastOpenAt < 1500) return;
    lastOpen = url; lastOpenAt = now;
    // iPhone: the in-app Safari sheet, like Instagram's own browser -
    // swipe it away and the chat is still underneath. The Mac has no
    // sheet and no konvoStore handler; it keeps the real browser.
    if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
      try {
        window.webkit.messageHandlers.konvoStore.postMessage(
          { cmd: "open", id: 0, productId: url });
        return;
      } catch (e) {}
    }
    if (window.__TAURI_INTERNALS__) {
      window.__TAURI_INTERNALS__
        .invoke("plugin:opener|open_url", { url: url })
        .catch(function () {});
    }
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    var ext = externalize(a.href);
    if (!ext) return;
    e.preventDefault();
    openExternal(ext);
  }, true);
  // The anchor handler only sees real <a> taps. Mobile DM bubbles and story
  // link stickers open through window.open instead, which is a silent no-op
  // in a webview - the tap just dies. Route it like a click: external to the
  // real browser, Instagram's own "new tab" navigates in place (the cage
  // rules on the destination still apply). Returning null is what a blocked
  // popup returns, which every site already handles.
  window.open = function (href) {
    var ext = href && externalize(href);
    if (ext) openExternal(ext);
    else if (href) location.href = href;
    return null;
  };

  // The only reel you may watch is the one that was sent to you, so the way
  // out of it has to be shut: Instagram advances to the next reel on a vertical
  // drag, a wheel tick, or the arrow/page keys. Kill all three, on the reel
  // permalink only, so threads and the inbox keep scrolling normally.
  // Deliberately gesture-level rather than selector-level: it does not care what
  // Instagram calls its containers this week, which every hide() in this file
  // does. Space is left alone - it pauses the video.
  // Two shapes to cover, confirmed on device: the Mac opens the reel at
  // /reel/<code>/, the phone opens a fullscreen player in place and never
  // touches the URL. So a path test alone misses the phone entirely - hence the
  // second test. A <video> filling the viewport is the player; a video bubble
  // inside a thread is not, so threads keep scrolling normally.
  // Answered ONCE per gesture, at touchstart, and reused for every move in
  // that drag. It used to run per move event - a querySelectorAll plus a
  // getBoundingClientRect per video, sixty times a second, on every scroll
  // in the app - which is the most expensive thing a finger could trigger.
  var reeling = false, reelKnown = false;
  function watchingReel() {
    if (/^\/reel\//.test(location.pathname)) return true;
    // A post page is not the reel player, however tall its video renders:
    // locking gestures there kills comment scrolling and the desktop's
    // next/prev arrows through a profile's grid.
    if (/^\/p\//.test(location.pathname)) return false;
    var v = document.querySelectorAll("video");
    for (var i = 0; i < v.length; i++) {
      if (v[i].getBoundingClientRect().height > innerHeight * 0.8) return true;
    }
    return false;
  }
  // preventDefault is not enough: Instagram advances to the next reel from its
  // OWN touch handlers, so suppressing the browser's default scroll leaves the
  // swipe working. The event has to never reach them, which is what capture +
  // stopImmediatePropagation does.
  // pointermove is gone on purpose: iOS fires it alongside touchmove, so
  // it doubled the work for nothing.
  document.addEventListener("touchstart", function () {
    reeling = watchingReel();
    reelKnown = true;
  }, { capture: true, passive: true });
  document.addEventListener("touchend", function () {
    reelKnown = false;
  }, { capture: true, passive: true });
  ["wheel", "touchmove"].forEach(function (t) {
    document.addEventListener(t, function (e) {
      // A real drag always opens with touchstart, so the answer is already
      // cached; anything arriving without one (wheel, synthetic events)
      // still gets the real check rather than a stale false.
      if (!(t === "touchmove" && reelKnown ? reeling : watchingReel())) return;
      e.preventDefault();
      e.stopImmediatePropagation();
    }, { capture: true, passive: false });
  });
  document.addEventListener("keydown", function (e) {
    // Key test FIRST: watchingReel() forces layout, and this fires on
    // every character typed into a message.
    if (/^(Arrow(Up|Down)|Page(Up|Down)|Home|End)$/.test(e.key) && watchingReel()) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  }, true);

  // Instagram ships its web player muted. A once-per-element unmute was not
  // enough on device, which rules out "it just starts muted" and leaves two
  // live causes: the player re-mutes on re-render, and the audio can sit on a
  // different element from the picture. So unmute every media element, every
  // time one starts, rather than once per <video>.
  // WebKit permits this without a gesture: wry already sets
  // mediaTypesRequiringUserActionForPlayback to None.
  // volumechange is deliberately NOT a trigger - it would fight you muting it
  // by hand, and it re-enters through the write below.
  function unmute() {
    if (!watchingReel()) return;
    var m = document.querySelectorAll("video,audio");
    for (var i = 0; i < m.length; i++) {
      var e = m[i], h = e.getBoundingClientRect().height;
      // The picture fills the screen; a separate audio stream has no box at all
      // (an <audio>, or a zero-height <video> carrying only sound). A small box
      // is a clip sitting in the thread behind the player - leave it muted, or
      // the conversation plays over the reel.
      if (e.tagName === "AUDIO" || h === 0 || h > innerHeight * 0.8) {
        if (e.muted || !e.volume) { e.muted = false; e.volume = 1; }
      }
    }
  }
  // Driven by media events, not by sweep: sweep runs on every DOM mutation and
  // would undo you muting the thing by hand a moment later. Instagram re-mutes
  // when it re-renders, and a re-render restarts playback, so the events cover
  // it. They do not bubble but they do capture - hence the third argument.
  ["play", "playing", "loadedmetadata", "canplay"].forEach(function (t) {
    document.addEventListener(t, unmute, true);
  });

  // The paywall, phone only. Konvo is a paid app on iOS: an iPhone at the
  // inbox without an active subscription gets the two-page paywall (S11
  // value -> S12 price), with the decline path (S13 counter-offer -> S14
  // hard stop) behind the close button. The Mac stays free - S11 promises
  // "the Mac app is included", so the gate must never appear there.
  //
  // Money truth lives in StoreKit (Transaction.currentEntitlements via
  // KonvoStore.swift), not in this cache. localStorage.konvoPaid exists so a
  // paying user coming back offline, or before the bridge answers, never
  // sees a paywall flash; every launch re-verifies and the verdict wins,
  // both directions. There is no "onboarded" flag on this origin on purpose:
  // on iOS the bundled onboarding page gates every path to the inbox, so
  // "at the inbox on an iPhone" already means onboarding is done.
  if (/iPhone|iPad|iPod/.test(navigator.userAgent)) (function () {
    // Has this install already been through the welcome sequence? Any of
    // the three markers counts, whichever build wrote it. They used to be
    // read per-variant, so updating between build modes replayed the whole
    // sequence: konvoWelcomed was invisible to a beta build and
    // konvoBetaFree was invisible to a free one. The sequence is a
    // once-per-install thing, not a once-per-variant thing.
    function seenSequence() {
      try {
        return !!(localStorage.getItem("konvoWelcomed") ||
          localStorage.getItem("konvoBetaFree") ||
          localStorage.getItem("konvoPaid"));
      } catch (e) { return false; }
    }
    function cached() {
      try {
        if (localStorage.getItem("konvoPaid")) return true;
        // Granted by a beta build and NEVER touched by the entitlement
        // sync below, which legitimately reports "not entitled" and would
        // otherwise replay the whole paywall sequence on every launch.
        return !!(window.__konvoBeta && !window.__konvoNoFree &&
          localStorage.getItem("konvoBetaFree"));
      } catch (e) { return false; }
    }
    function grantBeta() {
      try { localStorage.setItem("konvoBetaFree", "1"); } catch (e) {}
    }
    function setCache(v) {
      try {
        if (v) localStorage.setItem("konvoPaid", "1");
        else localStorage.removeItem("konvoPaid");
      } catch (e) {}
    }

    // ---- v3 paywall (grilled Aug 3): S12 connected -> S12b loader -> perks
    // -> S13 three-package paywall (annual/monthly/lifetime) -> S14
    // activation. There is no dismissal unpaid: the x concedes into the
    // Monthly story. Money truth lives in RevenueCat behind the bridge.
    // Every visible word is Matthew's - do not edit copy here.
    //
    // Message text weight only. SIZE is handled natively by page zoom in
    // KonvoStore (mobile web renders smaller than the native app across
    // the board - bubbles, avatars, rows - and zoom scales all of it
    // together instead of one guessed selector at a time).
    style.textContent +=
      "div[role='row'] div[dir='auto']{font-weight:500;}";
    // Friends' stories are kept, and the inbox story rings are the only way
    // in - three testers asked for a feature that was already there. Louder
    // rings, no new UI: Instagram draws them as a canvas behind the avatar.
    // ponytail: a selector guess like the rest; corrections ride cage-patch.
    // Scoped to the inbox route: an unscoped div:has(...) makes the engine
    // test every div in the document on every DOM change.
    // Scale only, no filter: a filter on every ring is a repaint through
    // the filter pipeline on each frame of an inbox scroll, and scrolling
    // is exactly where "less smooth than Instagram" gets noticed.
    // Plain selector, no :has(): the subject there was bare `div`, so the
    // engine re-tested every div in the document on each mutation. The
    // only canvases on the inbox ARE the story rings.
    style.textContent += "html.im-inbox canvas{transform:scale(1.06)}";
    style.textContent +=
      '#im-pay{--bg:#fff;--ink:#141d33;--mut:#5d6478;--line:#d9d9de;' +
      '--chip:#f2f2f4;--icbg:#eef3ff;--accent:#0a5cf0;--sheet:rgba(242,242,244,.9)}' +
      // System appearance (Aug 16): the wall follows the phone like the
      // rest of onboarding. Same palette as dist/index.html's dark block;
      // pure black --bg meets the native letterbox with no seam. The
      // doubled id outranks every later light rule regardless of source
      // order (the first cut lost the cascade and the annual card stayed
      // white with dark-scheme text).
      '@media (prefers-color-scheme: dark){' +
      '#im-pay#im-pay{--bg:#000;--ink:#f2f3f7;--mut:#9aa0ae;--line:#2a2d36;--sheet:rgba(24,27,35,.82);' +
      '--chip:#1c1f27;--icbg:#101c33;--accent:#0a84ff}' +
      '#im-pay#im-pay .imp-pk.on{background:#101c33}' +
      // The timeline stem was near-black on black; a visible blue.
      '#im-pay#im-pay .imp-stem{background:rgba(10,132,255,.45)}}' +
      '#im-pay{position:fixed;inset:0;z-index:2147483645;background:var(--bg);color:var(--ink);' +
      'display:flex;flex-direction:column;font-family:-apple-system,system-ui,sans-serif;' +
      '-webkit-font-smoothing:antialiased}' +
      '#im-pay .imp-page{flex:1;display:flex;flex-direction:column;min-height:0;' +
      'animation:im-payfade .45s ease}' +
      '@keyframes im-payfade{from{opacity:0}}' +
      '#im-pay h2{margin:0;font-weight:700;letter-spacing:-0.035em;line-height:1.2;' +
      'color:inherit}' +
      // The wall lives inside Instagram's document, and their global
      // element rules beat inheritance - headings silently took THEIR
      // text color. Invisible on the light wall (their ink matched ours),
      // exposed by dark mode as charcoal-on-black (device, Aug 16).
      '#im-pay h1,#im-pay h3,#im-pay h4,#im-pay h5,#im-pay h6,' +
      '#im-pay b,#im-pay u,#im-pay i{color:inherit}' +
      '#im-pay p{margin:0}' +
      '#im-pay .imp-mid{flex:1;display:flex;flex-direction:column;justify-content:center;' +
      'padding:0 24px;overflow-y:auto;overscroll-behavior:none}' +
      '#im-pay .imp-foot{flex:none;padding:0 20px 34px}' +
      // The reveal (Aug 22): the wall goes clear over the real inbox, a
      // pill up top, a sheet at the foot. The button inverts the scheme
      // so it reads against whatever the inbox is showing.
      '#im-pay{transition:background .5s ease}' +
      '#im-pay.im-reveal{background:transparent}' +
      // The reveal's choreography (Aug 23): the pill drops in with a
      // spring as the wall clears, its check draws itself, a green ring
      // breathes out once; the sheet slides up a beat later, translucent
      // over the inbox and a third shorter than the first cut, so the
      // inbox is the picture and the sheet the caption.
      '#im-pay .imp-pill{position:absolute;top:14px;left:50%;transform:translateX(-50%);' +
      'display:inline-flex;align-items:center;gap:7px;padding:9px 15px;border-radius:999px;' +
      'background:rgba(18,22,30,.92);color:#5ee0a5;font-size:14px;font-weight:600;' +
      'white-space:nowrap;box-shadow:0 4px 18px rgba(0,0,0,.3);z-index:2;' +
      'animation:im-pilldrop .7s cubic-bezier(.34,1.56,.64,1) .15s both,' +
      'im-pillring 1.3s ease-out .7s both}' +
      '@keyframes im-pilldrop{from{transform:translate(-50%,-36px) scale(.8);opacity:0}}' +
      '@keyframes im-pillring{0%{box-shadow:0 4px 18px rgba(0,0,0,.3),0 0 0 0 rgba(94,224,165,.6)}' +
      '100%{box-shadow:0 4px 18px rgba(0,0,0,.3),0 0 0 22px rgba(94,224,165,0)}}' +
      '#im-pay .imp-pill path{stroke-dasharray:24;stroke-dashoffset:24;' +
      'animation:im-draw .45s ease-out .55s forwards}' +
      '#im-pay .imp-sheet{position:absolute;left:0;right:0;bottom:0;padding:8px 22px 22px;' +
      'border-radius:24px 24px 0 0;background:var(--sheet);text-align:center;' +
      '-webkit-backdrop-filter:saturate(1.4) blur(22px);backdrop-filter:saturate(1.4) blur(22px);' +
      'box-shadow:0 -10px 36px rgba(0,0,0,.3);' +
      'animation:im-sheetup .65s cubic-bezier(.32,.72,0,1) .45s both}' +
      '@keyframes im-sheetup{from{transform:translateY(110%)}}' +
      '#im-pay .imp-sheet h2{font-size:22px}' +
      '#im-pay .imp-sheet p{font-size:13.5px;line-height:1.45;color:var(--mut);margin-top:6px}' +
      '#im-pay .imp-grab{width:34px;height:4px;border-radius:999px;background:var(--line);' +
      'margin:0 auto 12px}' +
      '#im-pay .imp-sheet .imp-btn{background:var(--ink);color:var(--bg);box-shadow:none;' +
      'margin-top:14px;min-height:48px;font-size:16px}' +
      '#im-pay .imp-sheet .imp-next{font-size:13px;color:var(--mut);margin-top:10px}' +
      '#im-pay .imp-btn{width:100%;min-height:54px;border:0;border-radius:13px;' +
      'background:var(--accent);color:#fff;font-family:inherit;font-size:17px;font-weight:600;' +
      'letter-spacing:-0.012em;box-shadow:0 8px 18px rgba(10,92,240,.24)}' +
      '#im-pay .imp-btn[disabled]{opacity:.5}' +
      '#im-pay .imp-ghost{text-align:center;font-size:15px;color:var(--mut);padding:16px 0 2px}' +
      // The close on the Screen Time page (Sep 1): the page is opened by
      // the user from the inbox now, so it needs a way back.
      '#im-pay .imp-close{position:absolute;top:14px;right:16px;width:34px;height:34px;' +
      'border-radius:50%;background:var(--chip);color:var(--mut);display:flex;' +
      'align-items:center;justify-content:center;z-index:3}' +
      '#im-pay .imp-links{display:flex;justify-content:center;gap:18px;margin-top:10px;' +
      'font-size:13.5px;color:var(--mut)}' +
      '#im-pay .imp-links span{text-decoration:underline}' +
      '#im-pay .imp-row{display:flex;align-items:center;gap:12px;font-size:17px;' +
      'opacity:.35;transition:opacity .5s ease}' +
      '#im-pay .imp-row.done{opacity:1}' +
      '#im-pay .imp-ck{width:20px;height:20px;flex:none;border-radius:50%;' +
      'background:rgba(20,29,51,.1);display:inline-flex;align-items:center;' +
      'justify-content:center}' +
      '#im-pay .imp-row.done .imp-ck{background:var(--accent)}' +
      '#im-pay .imp-row .imp-ck svg{display:none}' +
      '#im-pay .imp-row.done .imp-ck svg{display:block}' +
      '#im-pay .imp-spin{width:20px;height:20px;border:2px solid var(--line);' +
      'border-top-color:var(--accent);border-radius:50%;' +
      'animation:im-spin .8s linear infinite}' +
      // The keyframes were simply missing since day one: the ring
      // rendered but never turned. Caught on device Aug 16.
      '@keyframes im-spin{to{transform:rotate(360deg)}}' +
      // The S14 checkmark draws itself: dashoffset runs the stroke tip
      // along the path while im-pop scales the whole mark in.
      '@keyframes im-draw{to{stroke-dashoffset:0}}' +
      '#im-pay .imp-head{flex:none;height:120px;position:relative;' +
      'background:linear-gradient(180deg,#1a6bf2 0%,#0a5cf0 100%)}' +
      '@keyframes im-pop{from{transform:scale(.4);opacity:0}}' +
      '#im-pay .imp-pk{flex:1;border-radius:14px;box-shadow:inset 0 0 0 1.2px var(--line);' +
      'padding:18px 6px 12px;text-align:center;position:relative}' +
      '#im-pay .imp-pk.on{box-shadow:inset 0 0 0 2px var(--accent);background:#f6f9ff}' +
      '#im-pay .imp-pk b{display:block;font-size:13.5px;letter-spacing:-0.01em}' +
      '#im-pay .imp-pk i{display:block;font-style:normal;font-size:15px;font-weight:700;' +
      'margin-top:4px}' +
      '#im-pay .imp-pk u{display:block;text-decoration:none;font-size:10.5px;' +
      'color:var(--mut);margin-top:3px;line-height:1.3}' +
      // The badge sits on the card's top edge with a ring of page colour
      // around it, so it reads as a tag on the card, not a line in it.
      '#im-pay .imp-rec{position:absolute;top:-11px;left:50%;transform:translateX(-50%);' +
      'white-space:nowrap;background:var(--accent);color:#fff;font-size:10px;' +
      'font-weight:700;letter-spacing:0.06em;padding:4px 10px;border-radius:999px;' +
      'box-shadow:0 0 0 3px var(--bg)}' +
      '#im-pay .imp-tl{display:flex;gap:16px}' +
      '#im-pay .imp-tl h4{margin:0;font-size:17px;font-weight:700}' +
      '#im-pay .imp-tl p{font-size:15px;line-height:1.45;color:var(--mut);margin-top:4px}' +
      '#im-pay .imp-tl p b{color:var(--ink);font-weight:600}' +
      '#im-pay .imp-dot{flex:none;width:44px;display:flex;flex-direction:column;' +
      'align-items:center}' +
      '#im-pay .imp-dot i{flex:none;width:44px;height:44px;border-radius:50%;' +
      'background:var(--accent);display:inline-flex;align-items:center;' +
      'justify-content:center}' +
      '#im-pay .imp-pk u.imp-save{margin-top:5px;font-size:11.5px;font-weight:700;' +
      'letter-spacing:.02em;color:var(--accent)}' +
      '#im-pay .imp-stem{flex:1;width:8px;border-radius:999px;' +
      'background:rgba(10,92,240,.15);margin-top:0}';

    // Funnel events, fire-and-forget through the bridge (Instagram's CSP
    // blocks page-side analytics). Lean payloads by decision: names and
    // screen ids only. Silent no-op without the bridge (tests, Mac).
    var CHECK =
      "<svg width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='#fff'" +
      " stroke-width='3.4' stroke-linecap='round' stroke-linejoin='round'>" +
      "<path d='M20 6 9 17l-5-5'/></svg>";
    function loaderRow(label) {
      return "<div class='imp-row'><span class='imp-ck'>" + CHECK + "</span>" +
        "<span>" + label + "</span></div>";
    }
    var PAGES = {
      connected:
        "<div class='imp-mid' style='align-items:center;text-align:center'>" +
        "<span style='width:56px;height:56px;border-radius:50%;background:var(--icbg);" +
        "display:inline-flex;align-items:center;justify-content:center;color:var(--accent);" +
        "margin-bottom:24px;animation:im-pop .7s cubic-bezier(0.34,1.56,0.64,1) both'>" +
        "<svg width='26' height='26' viewBox='0 0 24 24' fill='none'" +
        " stroke='currentColor' stroke-width='2.4' stroke-linecap='round'" +
        " stroke-linejoin='round'><path d='M20 6 9 17l-5-5'/></svg></span>" +
        "<h2 style='font-size:28px'>" + T("Instagram connected.") + "</h2>" +
        "<p style='font-size:17px;line-height:1.5;color:var(--mut);margin-top:12px'>" +
        T("Your DMs and Stories are ready.") + "</p></div>"
    };

    // Being at /direct/inbox/ is not proof of a session: Instagram renders
    // that route for a beat before bouncing a signed-out visitor to the
    // login page, and a wall raised in that window is a trap - login looks
    // skipped, the user pays, and dismissing reveals no messages. Proof is
    // the ds_user_id cookie: set at login, cleared at logout, readable from
    // this origin (verified on device). The current_user endpoint cannot
    // gate here - it answers 400 "useragent mismatch" to this webview's UA
    // with every app id, desktop, mobile, or none (measured Aug 3, 2026) -
    // so the loader greeting goes without a username until a reliable
    // source shows up; igUser stays for that day.
    // ponytail: a session revoked server-side leaves the cookie behind and
    // the wall could rise over a dying page; Instagram bounces it to login
    // moments later and the flow recovers there.
    var igUser = "", authed = false;
    function checkAuth() {
      if (/(?:^|; )ds_user_id=\d/.test(document.cookie)) authed = true;
    }
    function loaderPage() {
      return "<div class='imp-mid' style='padding:0 24px'>" +
        "<span class='imp-spin'></span>" +
        "<h2 style='font-size:26px;margin:24px 0 26px'>" + T("Setting up your Konvo") +
        (igUser ? ", " + igUser : "") + "</h2>" +
        "<div style='display:flex;flex-direction:column;gap:14px'>" +
        loaderRow(T("Feed hidden")) + loaderRow(T("Reels hidden")) +
        loaderRow(T("Explore hidden")) + loaderRow(T("Messages kept")) +
        loaderRow(T("Friends' stories kept")) + "</div></div>";
    }

    // The comparison page is gone (Sep 1): 97-99% of users passed through
    // it untouched on every build, so it proved nothing and cost a tap
    // between the reveal and the ask. The reveal hands to the impact page.

    // TODO: RELEASE BLOCKER - PROOF must stay empty until real TestFlight
    // quotes exist (locked rule: no invented social proof). Fill with
    // entries like { q: "[TESTIMONIAL_1 - replace with real TestFlight " +
    // "quote]", name: "[FIRST NAME]" }. Quotes only - no stars, because no
    // rating exists to depict. The strip and the dist screen both collapse
    // to nothing while this is empty.
    var PROOF = [];
    function proofStrip() {
      if (!PROOF.length) return "";
      var t = PROOF[0];
      return "<div style='margin:0 0 14px;padding:11px 14px;border-radius:12px;" +
        "background:var(--chip);font-size:14px;line-height:1.45;color:var(--ink);" +
        "text-align:center'>&ldquo;" + t.q + "&rdquo;" +
        "<span style='color:var(--mut)'> &mdash; " + t.name + "</span></div>";
    }

    // Live localized RevenueCat values (locked decision: never hardcode
    // money in shipping paths). These stand-ins render only when the bridge
    // is absent (tests, builds without the Swift class).
    var FALLBACK = { yearly: { price: '$19.99', perWeek: '$0.38',
                               perMonth: '$1.67', savePct: 76, trialDays: 7 },
                     monthly: { price: '$6.99' },
                     lifetime: { price: '$19.99' } };
    var P = null;
    // Assigned at wall mount; "Try again" on the pending page re-kicks it.
    var fetchProducts = function () {};
    // Ready means the two products the wall sells. Lifetime is not on the
    // wall (Aug 21) and konvo.pro.lifetime sits in App Store Connect as
    // MISSING_METADATA, so the store never returns it to a real user:
    // requiring it kept every store user of 1.3.0 on "Loading your
    // plans" and painted 1.2.0's stand-in prices (Sep 1, 46 of 46).
    function prod() {
      return P && P.yearly && P.monthly ? P : FALLBACK;
    }
    function pricesReady() {
      return !!(P && P.yearly && P.monthly);
    }
    // No stand-in money on a purchasable screen, ever (Aug 31): a
    // fallback price painted while Apple's sheet charges the user's real
    // localized one is exactly the mismatch a checkout caught on device.
    // Until RevenueCat answers with the storefront's own prices, the
    // paywall is this page - nothing quotable, nothing buyable - and the
    // retry loop repaints it the moment prices land, in the user's own
    // currency because that is the only kind of price that ever renders.
    function pricePendingPage() {
      return "<div class='imp-mid' id='im-pricewait' style='align-items:center;" +
        "text-align:center;padding:0 34px'>" +
        "<h2 style='font-size:24px'>" + T("Loading your plans&hellip;") + "</h2>" +
        "<p style='font-size:14.5px;line-height:1.5;color:var(--mut);margin-top:10px'>" +
        T("Prices show in your local currency.") + "</p>" +
        "</div><div class='imp-foot'>" +
        "<div class='imp-ghost' data-act='pay'>" + T("Try again") + "</div></div>";
    }

    // The S2 motive + computed weekly hours, carried across origins in the
    // #konvo= fragment persisted at document-start above. Missing or
    // malformed: the paywall simply omits the line.
    function motiveLine() {
      var q;
      try { q = (localStorage.getItem("konvoQuiz") || "").split("."); }
      catch (e) { return ""; }
      var MAP = {
        schoolOrWork: "for school or work",
        ownProjects: "for projects you care about",
        presentWithPeople: "with friends and family",
        sleepOnTime: "to wind down and sleep on time",
        lessDistracted: "without getting pulled into Instagram"
      };
      if (!MAP[q[0]] || !(+q[1] > 0)) return "";
      return "About " + q[1] + (+q[1] === 1 ? " hour" : " hours") +
        " a week " + MAP[q[0]] + ".";
    }

    var MOON = "<svg width='15' height='15' viewBox='0 0 24 24' fill='none'" +
      " stroke='currentColor' stroke-width='2.2' stroke-linecap='round'" +
      " stroke-linejoin='round'><path d='M20 14.5A8.5 8.5 0 1 1 9.5 4a6.6 6.6 0 0 0 10.5 10.5Z'/></svg>";
    var SHIELD = "<svg width='15' height='15' viewBox='0 0 24 24' fill='none'" +
      " stroke='currentColor' stroke-width='2.2' stroke-linecap='round'" +
      " stroke-linejoin='round'><path d='M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6Z'/></svg>";
    var CHAT = "<svg width='15' height='15' viewBox='0 0 24 24' fill='none'" +
      " stroke='currentColor' stroke-width='2.2' stroke-linejoin='round'>" +
      "<path d='M12 4c-4.4 0-8 3-8 6.8 0 2.1 1.1 4 2.9 5.2v3.2l3.6-1.7c.5.1 1 .1 1.5.1 4.4 0 8-3 8-6.8S16.4 4 12 4Z'/></svg>";

    var LOCK = "<svg width='19' height='19' viewBox='0 0 24 24' fill='none' stroke='#fff'" +
      " stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'>" +
      "<rect x='4' y='10.5' width='16' height='10.5' rx='3'/>" +
      "<path d='M8.5 10.5V8a3.5 3.5 0 0 1 7 0'/></svg>";
    var GLASS = "<svg width='19' height='19' viewBox='0 0 24 24' fill='none' stroke='#fff'" +
      " stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'>" +
      "<path d='M6 3h12M6 21h12M8 3v3l4 4 4-4V3M8 21v-3l4-4 4 4v3'/></svg>";
    var BELL = "<svg width='19' height='19' viewBox='0 0 24 24' fill='none' stroke='#fff'" +
      " stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'>" +
      "<path d='M18 8.5a6 6 0 0 0-12 0c0 6-2 7-2 7h16s-2-1-2-7'/>" +
      "<path d='M10.4 20.5a2 2 0 0 0 3.2 0'/></svg>";
    var STAR = "<svg width='19' height='19' viewBox='0 0 24 24' fill='none' stroke='#fff'" +
      " stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'>" +
      "<path d='m12 3 2.9 5.9 6.6.9-4.8 4.6 1.2 6.5L12 17.8 6.1 20.9l1.2-6.5-4.8-4.6 " +
      "6.6-.9Z'/></svg>";
    function node(icon, title, body, stem) {
      return "<div class='imp-tl'><div class='imp-dot'><i>" + icon + "</i>" +
        (stem ? "<span class='imp-stem'></span>" : "") +
        "</div><div style='padding:4px 0 " + (stem ? "22px" : "0") + "'>" +
        "<h4>" + title + "</h4><p>" + body + "</p></div></div>";
    }
    function dateIn(days) {
      var d = new Date(Date.now() + days * 86400000);
      // French abbreviates months with their own period ("7 sept.") and
      // the sentence adds another; the long month reads cleanly.
      try {
        return d.toLocaleDateString(undefined,
          { month: LANG === "fr" ? "long" : "short", day: "numeric" });
      } catch (e) { return ""; }
    }
    function pkCard(act, on, badge, name, price, sub, save) {
      // `save` is the accent line below the price. The trial is not on
      // the card: the headline and the CTA state it for the chosen plan.
      return "<div class='imp-pk" + (on ? " on" : "") + "' data-act='" + act + "'>" +
        (badge ? "<span class='imp-rec'>" + badge + "</span>" : "") +
        "<b>" + name + "</b>" +
        "<i>" + price + "</i><u>" + sub + "</u>" +
        (save ? "<u class='imp-save'>" + save + "</u>" : "") + "</div>";
    }
    // S13. plan: 'y' | 'm' | 'l'. The Annual state renders the trial only
    // when RevenueCat says this user is eligible - the timeline never
    // describes a trial that will not happen. Lifetime is a one-time
    // purchase: one-step story, "Lifetime access", never "forever".
    function pay(plan) {
      if (!pricesReady()) return pricePendingPage();
      var pr = prod(), y = pr.yearly, m = pr.monthly, l = pr.lifetime;
      var td = plan === "y" ? (y.trialDays || 0) : 0;
      var sp = y.savePct || 0;
      var head, cta, act, tl, reassure;
      var mtd = plan === "m" ? (m.trialDays || 0) : 0;
      if (plan === "m" && mtd) {
        head = T("First {n} days free, then {price} a month.", { n: mtd, price: m.price });
        cta = T("Start your free {n} days", { n: mtd });
        act = "buy-m";
        reassure = T("No commitment, cancel anytime");
        tl = node(LOCK, T("Today"), T("Unlock your DMs and Stories in Konvo. Pay $0."), true) +
             node(STAR, T("In {n} days", { n: mtd }),
               T("You'll be charged {price} on <b>{date}</b>, <b>cancel anytime</b> before.",
                 { price: m.price, date: dateIn(mtd) }), false);
      } else if (plan === "m") {
        head = T("{price} a month, cancel anytime.", { price: m.price });
        cta = T("Continue with Monthly");
        act = "buy-m";
        reassure = T("No commitment, cancel anytime");
        tl = node(LOCK, T("Today"), T("Unlock your DMs and Stories in Konvo. Pay {price}.",
               { price: m.price }), true) +
             node(STAR, T("Every month"), T("Renews at {price}, <b>cancel anytime</b>.",
               { price: m.price }), false);
      } else if (plan === "l") {
        head = T("{price} once. Lifetime access.", { price: l.price });
        cta = T("Get Lifetime access");
        act = "buy-l";
        reassure = T("Pay once. No subscription.");
        tl = node(LOCK, T("Today"), T("Pay {price} once. That's it.", { price: l.price }), false);
      } else if (td) {
        head = T("First {n} days free, then {price} a year.", { n: td, price: y.price });
        cta = T("Start your free {n} days", { n: td });
        act = "buy-y";
        reassure = T("No commitment, cancel anytime");
        // Three nodes, not four: the page must fit one screen. The reminder
        // promise rides the halfway node, which stays honest - it says we
        // will remind you, not that the reminder lands that day (it fires
        // two days before the charge; see the notify command).
        tl = node(LOCK, T("Today"), T("Unlock your DMs and Stories in Konvo. Pay $0."), true) +
             node(BELL, T("In {n} days", { n: Math.round(td / 2) }),
               T("Halfway through. We'll remind you before anything is charged."), true) +
             node(STAR, T("In {n} days", { n: td }),
               T("You'll be charged on <b>{date}</b>, <b>cancel anytime</b> before.",
                 { date: dateIn(td) }), false);
      } else {
        head = T("{price} a year ({m}/month).", { price: y.price, m: y.perMonth || y.perWeek });
        cta = T("Continue with Yearly");
        act = "buy-y";
        reassure = T("No commitment, cancel anytime");
        tl = node(LOCK, T("Today"), T("Unlock your DMs and Stories in Konvo."), true) +
             node(STAR, T("In 12 months"), T("Renews at {price}, <b>cancel anytime</b> before.",
               { price: y.price }), false);
      }
      var mot = motiveLine();
      return "<div class='imp-head'>" +
        "<div style='position:absolute;inset:0;background:radial-gradient(circle at 50% 30%," +
        "rgba(255,255,255,.22) 0%,rgba(255,255,255,0) 60%)'></div>" +
        "<div style='position:absolute;left:34px;top:26px;width:74px;height:22px;" +
        "border-radius:7px;background:rgba(255,255,255,.16);transform:rotate(-8deg);" +
        "display:flex;align-items:center;justify-content:center;font-size:9px;" +
        "font-weight:700;color:rgba(255,255,255,.55)'>FEED</div>" +
        "<div style='position:absolute;right:30px;top:64px;width:62px;height:22px;" +
        "border-radius:7px;background:rgba(255,255,255,.14);transform:rotate(7deg);" +
        "display:flex;align-items:center;justify-content:center;font-size:9px;" +
        "font-weight:700;color:rgba(255,255,255,.5)'>REELS</div>" +
        "<div style='position:absolute;left:50%;top:28px;transform:translateX(-50%);" +
        "width:64px;height:64px;border-radius:18px;background:#fff;display:flex;" +
        "align-items:center;justify-content:center;box-shadow:0 10px 30px rgba(4,30,80,.35)'>" +
        "<svg width='34' height='34' viewBox='0 0 24 24' fill='none' stroke='#0a5cf0'" +
        " stroke-width='2.2' stroke-linejoin='round'><path d='M12 4c-4.4 0-8 3-8 6.8 " +
        "0 2.1 1.1 4 2.9 5.2v3.2l3.6-1.7c.5.1 1 .1 1.5.1 4.4 0 8-3 8-6.8S16.4 4 12 4Z'/>" +
        "</svg></div></div>" +
        "<div class='imp-mid' style='justify-content:flex-start;padding:24px 24px 0'>" +
        "<div style='text-align:center'>" +
        "<h2 style='font-size:24px'>" +
        (lapsedWall ? T("Your plan ended.")
          : td || mtd ? T("How your free trial works") : T("How your plan works")) + "</h2>" +
        "<p style='font-size:15px;color:var(--ink);margin-top:10px'>" +
        (lapsedWall ? T("Instagram is unblocked until you pick a plan. ") : "") + head + "</p>" +
        (mot ? "<p style='font-size:14px;font-weight:600;color:var(--accent);" +
          "margin-top:8px'>" + mot + "</p>" : "") + "</div>" +
        proofStrip() +
        "<div style='display:flex;gap:8px;margin:22px 0 24px'>" +
        // The card prices annual by the month - the number a shopper
        // compares against the monthly plan. The full yearly charge is
        // stated in the line above and in the timeline. The unit label
        // follows whichever number actually rendered: pairing the yearly
        // price with "per month" would be a straight lie.
        // The card states the yearly charge outright, the monthly
        // equivalent in brackets, and the trial on its own line (Aug 21).
        // Yearly leads with its monthly equivalent (the number shoppers
        // compare), the yearly charge underneath, and the live saving as
        // its badge (Aug 21).
        pkCard("pk-y", plan === "y", sp ? T("SAVE {n}%", { n: sp }) : T("POPULAR"), T("Yearly Plan"),
          T("{price}/month", { price: y.perMonth || y.price }),
          y.perMonth ? T("{price}/year", { price: y.price }) : "", "") +
        pkCard("pk-m", plan === "m", "", T("Monthly Plan"), T("{price}/month", { price: m.price }), "", "") +
        "</div>" +
        tl + "</div>" +
        "<div class='imp-foot' style='padding:10px 24px 24px'>" +
        "<div style='display:flex;align-items:center;justify-content:center;gap:8px;" +
        "padding-bottom:10px;font-size:14px;color:var(--mut)'>" +
        "<span style='width:18px;height:18px;border-radius:50%;background:var(--accent);" +
        "display:inline-flex;align-items:center;justify-content:center'>" + CHECK +
        "</span>" + reassure + "</div>" +
        "<button class='imp-btn' data-act='" + act + "'>" + cta + "</button>" +
        // Restore lives in the footer row: the four-node trial timeline
        // pushed a centered one below the fold, and App Review needs it
        // findable without scrolling.
        betaFreeRow() +
        "<div class='imp-links'><span data-act='terms'>" + T("Terms of Use") + "</span>" +
        "<span data-act='privacy'>" + T("Privacy Policy") + "</span>" +
        "<span data-act='restore'>" + T("Restore") + "</span></div></div>";
    }

    // Beta testers see the real price and the real screen, then take this
    // way past it. Present only in builds compiled with konvo-beta, and
    // withdrawable remotely; a store build has neither the markup nor the
    // handler.
    function betaFreeRow() {
      if (!window.__konvoBeta || window.__konvoNoFree) return "";
      return "<div class='imp-ghost' data-act='betafree' " +
        "style='padding-top:14px;font-weight:600;color:var(--accent)'>" +
        T("Free during beta") + "</div>";
    }

    // S12c: delete Instagram. Konvo does not sit alongside Instagram, it
    // takes its place - and a phone with both installed just relapses to the
    // feed. Instructions only: no app can delete another, and pretending
    // otherwise would be a button that lies.
    // ── The block (Aug 16, v2) ──────────────────────────────────────────
    // Screen Time setup is the onboarding's main road, BEFORE the paywall:
    // permission first, sell second, the order Opal proved. The old
    // delete-Instagram ask is gone; blocking while keeping the app
    // installed IS the product now. konvo-free, iOS 15, and macOS skip
    // from the loader straight to perks and never see any of it.
    // The Screen Time connect page, modeled on the pattern Opal proved
    // (Aug 16): a replica of Apple's dialog shown BEFORE the real one, so
    // nothing arrives cold, plus a trust list of what Konvo cannot see.
    // Every claim in that list is structural fact, not copy: the tokens
    // are opaque, there is no DeviceActivity monitor, and there is no
    // Konvo server. The real chain starts only on the button.
    function cageIntroPage() {
      // The Opal pattern, replicated Aug 16: the page is an exact echo of
      // the system dialog about to appear, ringed in accent with an arrow
      // at its Continue, so when the real one lands over this page it
      // reads as expected rather than alarming. The footer claim is
      // structural fact: the selection never leaves the device.
      return "<div class='imp-close' data-act='cage-close' aria-label='Close'>" +
        "<svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor'" +
        " stroke-width='2.4' stroke-linecap='round'><path d='M18 6 6 18M6 6l12 12'/></svg></div>" +
        "<div class='imp-mid' style='padding:24px'>" +
        "<h2 style='font-size:26px;text-align:center'>" +
        T("Connect Konvo to Screen Time, securely.") + "</h2>" +
        "<p style='font-size:15px;line-height:1.5;color:var(--mut);margin-top:8px;" +
        "text-align:center'>" +
        T("To block Instagram on this iPhone, Konvo will need your permission.") + "</p>" +
        "<div style='border:2px solid var(--accent);border-radius:20px;padding:7px;" +
        "margin:22px auto 0;max-width:300px;width:100%'>" +
        "<div style='background:var(--icbg);border-radius:14px;padding:14px 12px 0;" +
        "text-align:center'>" +
        "<b style='font-size:14px;display:block'>" +
        T("&ldquo;Konvo&rdquo; Would Like to Access Screen Time") + "</b>" +
        "<p style='font-size:11.5px;line-height:1.4;color:var(--mut);margin-top:5px'>" +
        T("Providing &ldquo;Konvo&rdquo; access to Screen Time may allow it to see " +
          "your activity data, restrict content, and limit the usage of apps " +
          "and websites.") + "</p>" +
        "<div style='display:flex;border-top:1px solid rgba(120,120,128,.25);" +
        "margin-top:12px'>" +
        "<span style='flex:1;padding:11px 0;color:var(--accent);font-weight:700;" +
        "font-size:15.5px;border-right:1px solid rgba(120,120,128,.25)'>" + T("Continue") + "</span>" +
        "<span style='flex:1;padding:11px 0;color:var(--accent);font-size:15.5px'>" +
        T("Don&rsquo;t Allow") + "</span></div></div></div>" +
        "<svg width='34' height='40' viewBox='0 0 34 40' fill='none' " +
        "stroke='var(--accent)' stroke-width='3' stroke-linecap='round' " +
        "stroke-linejoin='round' style='margin:10px 0 0 22%'>" +
        "<path d='M10 36 C 8 22, 12 12, 20 5'/>" +
        "<path d='M12 7 L20 5 L21 13'/></svg>" +
        "<p style='text-align:center;font-size:13.5px;line-height:1.5;" +
        "color:var(--mut);margin-top:14px'>" +
        T("Your information is protected by Apple and stays 100% on your phone.") + "</p>" +
        "</div><div class='imp-foot'>" +
        // No "Not now" since Aug 25: everyone who reaches this page has
        // paid (or holds a grant), and the shield is what they paid for.
        // The only way past is the system dialog itself - denying it still
        // proceeds, because an app cannot trap someone on an OS permission.
        "<button class='imp-btn' data-act='cage-setup-go'>" + T("Give permission") + "</button></div>";
    }
    // S12d (Aug 22): between "Ready to block" and the perks, the wall
    // clears and the user's own inbox shows through - the thing they came
    // for, recognisable, no mockup. The copy states only what the cage
    // already does in this webview, shield or not.
    function revealPage() {
      return "<div class='imp-pill'><svg width='14' height='14' viewBox='0 0 24 24'" +
        " fill='none' stroke='currentColor' stroke-width='3' stroke-linecap='round'" +
        " stroke-linejoin='round'><path d='M20 6 9 17l-5-5'/></svg>" + T("Instagram connected") + "</div>" +
        "<div class='imp-sheet'><div class='imp-grab'></div>" +
        "<h2>" + T("Your DMs are still here.") + "</h2>" +
        "<p>" + T("Feed, Reels and Explore are now hidden. Stories, profiles and " +
          "notifications still work.") + "</p>" +
        "<button class='imp-btn' data-act='keep'>" + T("Keep Instagram like this") + "</button>" +
        (window.__konvoFree ? "" : "<p class='imp-next'>" + T("Choose a plan next") + "</p>") +
        "</div>";
    }
    // S12e: what the trial is FOR, immediately before the price. Three
    // claims, each one a thing the app actually does - no ratings, no user
    // count, no "heal your brain". The hours are the user's own answer,
    // carried across the origin boundary in the #konvo= fragment.
    function reclaimHours() {
      var n = 0;
      try { n = parseInt(localStorage.getItem("konvoQuiz"), 10) || 0; } catch (e) {}
      return n > 0 ? n : 0;
    }
    // The comparison page is back (Sep 1, Matthew: eight rows, plain and
    // direct). Label | Instagram | Konvo; the Konvo column a tinted strip.
    // Row one is checked on BOTH sides on purpose: Instagram does give you
    // the messages; the difference is everything else. Every row is a true
    // claim about what the cage does today.
    var CKBLUE = "<span style='width:22px;height:22px;border-radius:50%;" +
      "background:var(--accent);display:inline-flex;align-items:center;" +
      "justify-content:center'>" + CHECK + "</span>";
    var CKGREY = "<span style='width:22px;height:22px;border-radius:50%;" +
      "background:#dfe3ea;display:inline-flex;align-items:center;" +
      "justify-content:center'><svg width='11' height='11' viewBox='0 0 24 24'" +
      " fill='none' stroke='#8a92a2' stroke-width='3.4' stroke-linecap='round'" +
      " stroke-linejoin='round'><path d='M20 6 9 17l-5-5'/></svg></span>";
    var XMARK = "<svg width='16' height='16' viewBox='0 0 24 24' fill='none'" +
      " stroke='#b0b6c3' stroke-width='2.6' stroke-linecap='round'>" +
      "<path d='M6 6l12 12M18 6 6 18'/></svg>";
    function perkRow(label, both, last) {
      return "<div style='display:flex;align-items:stretch;border-top:1px solid var(--line)'>" +
        "<span style='flex:1;display:flex;align-items:center;padding:11px 8px 11px 0;" +
        "font-size:15px;line-height:1.3'>" + label + "</span>" +
        "<span style='width:70px;flex:none;display:flex;align-items:center;" +
        "justify-content:center'>" + (both ? CKGREY : XMARK) + "</span>" +
        "<span style='width:70px;flex:none;display:flex;align-items:center;" +
        "justify-content:center;background:var(--icbg)" +
        (last ? ";border-radius:0 0 12px 12px" : "") + "'>" + CKBLUE + "</span></div>";
    }
    function perksPage() {
      return "<div class='imp-mid' style='padding:22px 20px 0'>" +
        "<h2 style='font-size:26px'>" + T("Same account. Different app.") + "</h2>" +
        "<div style='display:flex;align-items:flex-end;margin-top:22px'>" +
        "<span style='flex:1'></span>" +
        "<span style='width:70px;flex:none;text-align:center;font-size:12px;" +
        "font-weight:700;letter-spacing:0.02em;white-space:nowrap;" +
        "color:var(--mut);padding-bottom:10px'>" + T("Instagram") + "</span>" +
        "<span style='width:70px;flex:none;display:flex;justify-content:center;" +
        "padding:9px 0;background:var(--icbg);border-radius:12px 12px 0 0'>" +
        "<span style='background:var(--accent);color:#fff;font-size:10px;" +
        "font-weight:700;letter-spacing:0.06em;padding:4px 9px;border-radius:999px'>" +
        T("KONVO") + "</span></span></div>" +
        perkRow(T("Every DM, request and Story"), true, false) +
        perkRow(T("Opens on your messages, not the feed"), false, false) +
        perkRow(T("No feed. Ever."), false, false) +
        perkRow(T("No Reels, no Explore"), false, false) +
        perkRow(T("No ads, no suggested posts"), false, false) +
        perkRow(T("Lock the Instagram app when you're ready"), false, false) +
        perkRow(T("Two 5 minute passes a day. No snooze."), false, false) +
        perkRow(T("Your hours back, every week"), false, true) +
        "</div>" +
        "<div class='imp-foot' style='padding:14px 24px 30px'>" +
        "<div style='display:flex;align-items:center;justify-content:center;gap:8px;" +
        "padding-bottom:12px;font-size:14px;color:var(--mut)'>" +
        "<span style='width:18px;height:18px;border-radius:50%;background:var(--accent);" +
        "display:inline-flex;align-items:center;justify-content:center'>" + CHECK +
        "</span>" + (window.__konvoFree
          ? T("Free. Nothing to cancel.")
          : T("No commitment. Cancel anytime.")) + "</div>" +
        "<button class='imp-btn' data-act='" +
        (window.__konvoFree ? "welcomed" : "impact") +
        "'>" + T("Continue") + "</button></div>";
    }
    function impactRow(icon, title, body) {
      return "<div style='display:flex;gap:14px;align-items:flex-start;" +
        "padding:12px 0'>" +
        "<span style='flex:none;width:26px;height:26px;border-radius:9px;" +
        "background:var(--icbg);color:var(--accent);display:inline-flex;" +
        "align-items:center;justify-content:center;margin-top:1px'>" + icon +
        "</span><span style='flex:1'>" +
        "<b style='display:block;font-size:16.5px;letter-spacing:-0.015em'>" +
        title + "</b>" +
        "<span style='display:block;font-size:14.5px;line-height:1.45;" +
        "color:var(--mut);margin-top:3px'>" + body + "</span></span></div>";
    }
    // The proof block (Sep 1): Matthew's own laurel image (the same
    // dist/proof.png as the onboarding screen, 600px wide, inlined as a
    // data URI: Instagram's CSP allows img-src data:, checked Sep 1). Its
    // baked-in caption is covered by a live one so the words follow the
    // theme and the language. Cover bounds = the caption band in the image.
    var PROOF_IMG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAlgAAAEqCAYAAADJZC6LAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAARGVYSWZNTQAqAAAACAABh2kABAAAAAEAAAAaAAAAAAADoAEAAwAAAAEAAQAAoAIABAAAAAEAAAJYoAMABAAAAAEAAAEqAAAAAKoaQ5kAAAHLaVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJYTVAgQ29yZSA2LjAuMCI+CiAgIDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+CiAgICAgIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiCiAgICAgICAgICAgIHhtbG5zOmV4aWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vZXhpZi8xLjAvIj4KICAgICAgICAgPGV4aWY6Q29sb3JTcGFjZT4xPC9leGlmOkNvbG9yU3BhY2U+CiAgICAgICAgIDxleGlmOlBpeGVsWERpbWVuc2lvbj45MDA8L2V4aWY6UGl4ZWxYRGltZW5zaW9uPgogICAgICAgICA8ZXhpZjpQaXhlbFlEaW1lbnNpb24+NDQ3PC9leGlmOlBpeGVsWURpbWVuc2lvbj4KICAgICAgPC9yZGY6RGVzY3JpcHRpb24+CiAgIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CqNpLgEAAEAASURBVHgB7H0JgF1Flfbd3+s9G0vYIQGBCAhEVoUww+gvvzr/jBIHRDEuoAhhMQMoKA9lUYYBBGUgCIwgyiQug+uIzoC7o6CAhhAIwUBkCyFLb++9u/3fd07d190sobvT3el0qrrfvXVrPfWdU1Xn1nadSiX3HGssAhYBi4BFwCJgEbAIWARGBIE8z90RScgmYhGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBEYDwi444EIS4NFwCIwzhHIc3fWxU64fv0qf7sO343ap+elDX/Jt9l3t3jxXDcd59RvFvLmVPJgteN4tTXL3dLUmXn56fvz+xfOjjcLMTZTi4BFYMwRsArWmENuM7QIjG8EDr12TXvyoj/TyZwZXubMzAN3h9zxpqRJNilz/chxMp8l8Jw88Vx3g+/nzzuB90KexX9NY+dJ10sec59+cuXWoky85V/yltUb1s3MXGcP3wt39b1sxzRzpsWZ35HnaSkHeJ6La+7Evput8wL/udxJnwsdZ0Xs1ld4Uddf7j9/xvrx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AYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgELAIWAYuARcAiYBGwCFgENhQBZ0Mj2ngWAYuARcAiYBGwCFgELAIfjcD/B8vp7garWEt/AAAAAElFTkSuQmCC";
    function proofBlock() {
      return "<div class='imp-proof' style='position:relative;width:270px;margin:4px auto 10px'>" +
        "<img src='" + PROOF_IMG + "' alt='' style='display:block;width:100%;height:auto'>" +
        "<div style='position:absolute;left:25%;right:23%;top:71%;bottom:13%;background:var(--bg);" +
        "display:flex;align-items:center;justify-content:center'>" +
        "<span style='font-size:16px;font-weight:700;letter-spacing:-0.02em;color:var(--ink);white-space:nowrap'>" +
        T("users love Konvo") + "</span></div></div>";
    }
    function impactPage() {
      var h = reclaimHours(), td = prod().yearly.trialDays || 0;
      // Someone who is trial-ineligible must not be promised a free week.
      // Matthew's words (Sep 1): "Try 7 days for free and reclaim 22 hours back".
      var head = td ? T("Try {d} days for free", { d: td }) : T("Start using Konvo");
      var sub = h
        ? (h === 1 ? T("reclaim 1 hour back") : T("reclaim {n} hours back", { n: h }))
        : T("get your evenings back");
      return "<div class='imp-head' style='height:112px'>" +
        "<div style='position:absolute;inset:0;background:radial-gradient(circle at 50% 30%," +
        "rgba(255,255,255,.22) 0%,rgba(255,255,255,0) 60%)'></div>" +
        "<div style='position:absolute;left:50%;top:24px;transform:translateX(-50%);" +
        "width:64px;height:64px;border-radius:18px;background:#fff;display:flex;" +
        "align-items:center;justify-content:center;box-shadow:0 10px 30px rgba(4,30,80,.35)'>" +
        "<svg width='34' height='34' viewBox='0 0 24 24' fill='none' stroke='#0a5cf0' " +
        "stroke-width='2.2' stroke-linejoin='round'><path d='M12 4c-4.4 0-8 3-8 6.8 " +
        "0 2.1 1.1 4 2.9 5.2v3.2l3.6-1.7c.5.1 1 .1 1.5.1 4.4 0 8-3 8-6.8S16.4 4 12 4Z'/>" +
        "</svg></div></div>" +
        "<div class='imp-mid' style='justify-content:flex-start;padding:34px 26px 0'>" +
        "<h2 style='font-size:24px;text-align:center;line-height:1.2'>" +
        T("{head} and<br>{sub}", { head: head, sub: sub }) + "</h2>" +
        "<div style='margin-top:26px'>" +
        impactRow(CHAT, T("Stay connected"),
          T("Messages, requests and friends' Stories all still work.")) +
        impactRow(MOON, T("Reclaim your focus"),
          T("No feed, no Reels, no Explore. Nothing to fall into.")) +
        impactRow(SHIELD, T("Lock it when you're ready"),
          T("One tap locks the Instagram app. Two passes a day, no snooze.")) +
        "</div>" +
        // The proof block floats between the claims and Continue (Sep 1),
        // biased upward: more of the spare space goes below it, so it
        // never sits on the button.
        "<div style='flex:1;min-height:8px'></div>" + proofBlock() +
        "<div style='flex:2;min-height:22px'></div></div>" +
        "<div class='imp-foot'>" +
        "<button class='imp-btn' data-act='pay'>" + T("Continue") + "</button></div>";
    }
    // The one App Store review (Canada, Aug 20 2026) left this page on Sep 1:
    // the proof block above carries the role, and the card no longer fit
    // above the Continue button.

    // S14: post-purchase activation. Trial buyers get the recap and the
    // reminder promise (Matthew's words, Sep 1); every buyer gets the
    // notification ask on the button tap (unread alerts for all, the
    // "ends in 2 days" reminder scheduled only on grant and only with a
    // trial). Lifetime gets its own recap line.
    // The drawn check: scales in (im-pop) while the stroke runs tip to
    // tail (im-draw). Shared by the paid confirmation and the free
    // build's reveal.
    function drawnCheck(head, sub) {
      return "<svg width='118' height='118' viewBox='0 0 24 24' fill='none' stroke='currentColor'" +
        " stroke-width='2' stroke-linecap='round' stroke-linejoin='round'" +
        " style='margin-bottom:38px;color:var(--accent);" +
        "animation:im-pop .5s ease-out both'>" +
        "<path d='M20 6 9 17l-5-5' stroke-dasharray='24' stroke-dashoffset='24'" +
        " style='animation:im-draw .6s ease-out .3s forwards'/></svg>" +
        "<div style='font-size:44px;font-weight:700;letter-spacing:-0.05em;line-height:1;" +
        "text-align:center'>" + head + "</div>" +
        "<p style='font-size:17px;line-height:1.5;color:var(--mut);margin-top:16px;" +
        "text-align:center'>" + (sub || T("Your messages are waiting.")) + "</p>";
    }

    // The last page (Aug 22): shown only once the shield is up. The check
    // draws, a beat, then the wall fades into the inbox on its own.
    function protectedPage() {
      return "<div class='imp-mid' style='align-items:center;padding:0 34px'>" +
        drawnCheck(T("You're protected."),
          T("Instagram is blocked. Your DMs remain available through Konvo.")) +
        "</div>";
    }

    function successPage(pid) {
      var pr = prod();
      var td = pid === "konvo.pro.yearly" ? (pr.yearly.trialDays || 0)
             : pid === "konvo.pro.monthly" ? (pr.monthly.trialDays || 0) : 0;
      var recap = "";
      if (pid === "konvo.pro.lifetime") recap = T("Lifetime access active.");
      else if (td) recap = T("Free until {date}.", { date: dateIn(td) });
      return "<div class='imp-mid' style='align-items:center;padding:0 34px'>" +
        drawnCheck(T("You're in.")) +
        (recap ? "<p style='font-size:15px;font-weight:600;margin-top:14px;" +
          "text-align:center'>" + recap + "</p>" : "") +
        (td ? "<p style='font-size:15px;color:var(--mut);margin-top:6px;" +
          "text-align:center'>" + T("We'll remind you 2 days before it ends.") + "</p>" : "") +
        "</div>" +
        "<div class='imp-foot' style='padding:0 28px 40px'>" +
        "<button class='imp-btn' data-act='done'>" + T("Open my messages") + "</button></div>";
    }

    // The shield is armed only at a successful end of the sequence: a
    // purchase or trial on paid builds, the beta grant, the free build's
    // end. A user who connects Screen Time and then declines the price
    // must walk away with Instagram exactly as it was (Aug 21; before
    // this, the block went up at the connect page, before the paywall).
    var cagePending = false;
    // Setup-only mode (Aug 21): a paying user with no shield - a reinstall
    // or a new phone - gets the Screen Time step alone, then "You're all
    // set", then the inbox. Before this the inbox opened unblocked.
    var setupOnly = false, setupVia;
    // How the Screen Time step ends, wherever it ran: done arms the shield
    // and shows "You're protected"; skipped, denied or nothing picked goes
    // to the inbox as it is.
    function cageExit(done) {
      setupOnly = false;
      if (!done) { dismiss(); return; }
      armCage(function () {
        swap(protectedPage());
        setTimeout(dismiss, 2400);
      });
    }
    // The tail of every successful sequence (Aug 22): purchase, trial,
    // restore, beta grant or the free build's end lead HERE, and only now
    // does the Screen Time step run - the shield goes up after the money,
    // never before. A shield already authorised and picked (a lapsed
    // subscriber coming back) is simply re-armed. Without iOS 16 there is
    // no shield to set up, so the plain confirmation stands in.
    // A lapsed subscriber's wall says why it is there (Aug 23): the plan
    // ended and the shield is down until they pick one. Cleared by finish.
    var lapsedWall = false;
    function finish(screen) {
      lapsedWall = false;
      track("onboarding_completed", { screen_id: screen });
      try { localStorage.konvoDone = "1"; } catch (e) {}
      var td = lastBuy === "konvo.pro.yearly" ? (prod().yearly.trialDays || 0)
             : lastBuy === "konvo.pro.monthly" ? (prod().monthly.trialDays || 0) : 0;
      // Every buyer is asked (Sep 1): the permission now also carries the
      // unread-message alerts (KonvoStore.checkUnread). With a trial length
      // the native side schedules the "ends in 2 days" reminder; the
      // in-inbox bar (trialBar) keeps the promise when the prompt is
      // declined. iOS prompts only if never asked.
      if (td) { try { localStorage.konvoTrialEnd = String(Date.now() + td * 86400000); } catch (e) {} }
      storekit("notify", String(td), function (r) {
        track("notify_answered", { granted: !!(r && r.granted), trial: !!td });
      });
      var moved = false;
      var fallback = setTimeout(function () {
        moved = true;
        swap(successPage(lastBuy));
      }, 900);
      storekit("cageStatus", null, function (s) {
        if (moved) return;
        clearTimeout(fallback);
        // A shield this install already picked (a lapsed subscriber back)
        // is simply re-armed. Nobody is asked here any more (Sep 1): of 17
        // trials whose block went live at purchase, 13 cancelled within
        // the hour and none paid, while every payer so far never had it.
        // The block is offered from the inbox instead: the lock button,
        // and one nudge on a later day (nudgeBlock).
        if (s && s.supported && s.authorized && s.picked) { cagePending = true; cageExit(true); return; }
        swap(successPage(lastBuy));
      });
    }
    function armCage(then) {
      if (!cagePending) { if (then) then(); return; }
      cagePending = false;
      storekit("cageOn", null, function () {
        track("cage_enabled", {});
        markCaged();
        if (then) then();
      });
    }

    var wall = null;
    var lastBuy = "";
    // The whole funnel up to and including the paywall is the light design;
    // the phone's appearance takes over only when the wall is out of the
    // way. Native launched pinned Light (lib.rs) - this asks KonvoStore to
    // unpin, flipping the letterbox, the status bar, and Instagram's own
    // prefers-color-scheme in one move. No reply comes back, and without
    // the bridge (tests, old builds) it is a silent no-op.
    var lastAppearance = "light";
    function appearance(mode) {
      if (mode === lastAppearance) return;
      lastAppearance = mode;
      try {
        window.webkit.messageHandlers.konvoStore.postMessage(
          { cmd: "appearance", id: 0, productId: mode });
      } catch (e) {}
    }
    function goAuto() { appearance("auto"); }
    // The wall leaves slowly: appearance flips to the phone first, then the
    // wall fades off the now-correct chat over .8s. The reveal IS the
    // payoff moment - an instant removal read as a glitch.
    function dismiss() {
      if (!wall) return;
      var w = wall;
      wall = null;
      goAuto();
      w.style.transition = "opacity .8s ease";
      w.style.opacity = "0";
      setTimeout(function () {
        if (w.parentNode) w.parentNode.removeChild(w);
      }, 850);
    }
    function buy(btn, productId) {
      // Beta builds cannot complete a purchase - App Store products do not
      // load until the Paid Apps agreement is active - so the main CTA
      // would spin and strand the tester on the wall. Let it through to
      // the inbox instead, and record WHICH plan they chose: that tap is
      // the pricing signal the whole exercise exists for.
      if (window.__konvoBeta && !window.__konvoNoFree) {
        track("beta_free_taken", {
          plan: productId.indexOf("yearly") > 0 ? "annual"
            : productId.indexOf("monthly") > 0 ? "monthly" : "lifetime",
          via: "cta",
          screen_id: "s13_paywall",
        });
        grantBeta();
        finish("s13_paywall");
        return;
      }
      btn.disabled = true;
      storekit("purchase", productId, function (res) {
        btn.disabled = false;
        if (res && res.ok && res.entitled) {
          setCache(true);
          lastBuy = productId;
          finish("s13_paywall");
        }
      });
    }
    function tickRows() {
      var rows = wall.querySelectorAll(".imp-row");
      for (var i = 0; i < rows.length; i++) {
        (function (el, delay) { setTimeout(function () {
          if (wall) el.classList.add("done");
        }, delay); })(rows[i], 400 + i * 650);
      }
    }
    // Page changes inside the wall crossfade instead of cutting. The fade
    // lives on an INNER page wrapper: the wall itself keeps its opaque
    // background the whole time, or the live inbox behind it peeks through
    // for the length of the fade.
    function setPage(html, still) {
      // still: repaint without the entrance fade - the package cards
      // replace the same page and must not flash.
      wall.innerHTML = "<div class='imp-page'" +
        (still ? " style='animation:none'" : "") + ">" + html + "</div>";
    }
    function swap(html, then) {
      if (!wall) return;
      var pg = wall.firstChild;
      if (pg) { pg.style.transition = "opacity .28s ease"; pg.style.opacity = "0"; }
      setTimeout(function () {
        if (!wall) return;
        setPage(html);
        if (then) then();
      }, 300);
    }
    var swPending = false, swTried = false, rcTried = false, entitlementKnown = false;
    var skipTracked = false;
    function ensure() {
      if (wall || !atInbox()) return;
      // The login conversion is a fact about the session, not the wall
      // (Aug 31): an entitled restorer is dismissed before the wall ever
      // mounts, and the old wall-mount tracking missed every one of them
      // - six silent sign-ins on build 60 alone, person-matched. Counted
      // here, ahead of every early return, once per install.
      try {
        if (!localStorage.konvoLoginTracked &&
            /(?:^|; )ds_user_id=\d/.test(document.cookie)) {
          localStorage.konvoLoginTracked = "1";
          track("login_succeeded", { screen_id: "s12_connected" });
        }
      } catch (e) {}
      if (!setupOnly && (cached() || seenSequence())) {
        // Returning users (paid cache, or a finished/granted sequence) fire
        // login and inbox events but never remount the wall. Say so once
        // per session, or funnels read them as a post-login drop-off - the
        // Aug 25 analysis lost a day to exactly that.
        if (!skipTracked) {
          skipTracked = true;
          track("sequence_skipped", { reason: cached() ? "entitled" : "seen" });
        }
        return;
      }
      // A paying customer must never see a frame of this. On a fresh
      // install there is no cache yet, so without waiting for the receipt
      // the sequence starts underneath them and only vanishes once
      // RevenueCat answers. Hold until the verdict lands, or until the
      // timeout gives up on it.
      if (!entitlementKnown) return;
      // Verified session first, always. The check is synchronous, so the
      // wall rises in the same tick the cookie appears.
      if (!authed) { checkAuth(); if (!authed) return; }
      // Superwall experiment layer, on only when the cage-patch says
      // {"superwall": true}: the native placement presents Superwall's
      // remotely-designed paywall over the webview instead of the injected
      // wall below. The injected wall stays the enforcement floor - it
      // rises the moment Superwall's sheet ends without an entitlement, so
      // a closed sheet never leaves the inbox open. One attempt per
      // session; after that the floor rules.
      if (!setupOnly && window.__konvoSW && !swTried) {
        if (!swPending) {
          swPending = true;
          storekit("paywall", null, function (res) {
            swPending = false;
            swTried = true;
            if (res && res.entitled) { setCache(true); dismiss(); }
            else ensure();
          });
        }
        return;
      }
      // The wall is light-only design: re-pin Light for the rare case of a
      // lapsed subscription raising it over an already-dark app.
      // The wall follows the system now (Aug 16); the pin only matters
      // for the lapsed-subscription case where it rises over a live app.
      appearance("auto");
      wall = document.createElement("div");
      wall.id = "im-pay";
      // A lapsed subscriber on an install that already finished the
      // sequence sees the price and nothing else (Aug 22): the pitch is
      // not replayed at someone who has heard it.
      var lapsed = false;
      try { lapsed = !!localStorage.konvoDone; } catch (e) {}
      // A payer opening the Screen Time step from the inbox has konvoDone
      // set and is not lapsed: without this the price fetch below painted
      // the paywall over the setup page (Sep 1, caught by the suite).
      if (setupOnly) lapsed = false;
      lapsedWall = lapsed;
      if (setupOnly) track("cage_pitch_viewed", { screen_id: "s12f_cage", via: setupVia });
      setPage(setupOnly ? cageIntroPage() : lapsed ? "" : PAGES.connected);
      wall.addEventListener("click", function (e) {
        var t = e.target.closest("[data-act]");
        if (!t || !wall) return;
        var act = t.getAttribute("data-act");
        if (act === "pk-y" || act === "pk-m" || act === "pk-l") {
          var plan = act.slice(3);
          track("plan_selected", { plan: plan === "y" ? "annual"
            : plan === "m" ? "monthly" : "lifetime", screen_id: "s13_paywall" });
          setPage(pay(plan), true);
        } else if (act === "keep") {
          wall.classList.remove("im-reveal");
          track("perks_viewed", { screen_id: "s12d_perks" });
          swap(perksPage());
        } else if (act === "impact") {
          track("impact_viewed", { screen_id: "s12e_impact" });
          swap(impactPage());
        } else if (act === "welcomed") {
          // Free build: the sequence is done, and it does not come back.
          try { localStorage.setItem("konvoWelcomed", "1"); } catch (e) {}
          finish("s12c_delete");
        } else if (act === "cage-close") {
          // Back to the inbox exactly as it was; the lock button stays.
          track("cage_setup_closed", { via: setupVia });
          cageExit(false);
        } else if (act === "cage-setup-go") {
          // One flight at a time: Apple's consent dialog sits over the
          // page and a user who keeps tapping the button underneath
          // fired this chain eleven times in a row (field report,
          // Aug 17). Re-armed when the chain resolves either way.
          if (window.__konvoCageBusy) return;
          window.__konvoCageBusy = true;
          // Apple's Screen Time sheet takes its time to appear; the tap is
          // acknowledged at once so nobody taps twice or wonders.
          t.disabled = true;
          storekit("cageAuthorize", null, function (a) {
            track("cage_authorized", { granted: !!(a && a.authorized) });
            window.__konvoCageBusy = false;
            if (!a || !a.authorized) { cageExit(false); return; }
            storekit("cagePick", null, function (p) {
              var n = (p && p.count) || 0;
              track("cage_picked", { count: n });
              if (!n) { cageExit(false); return; }
              // Picked, not armed: the shield waits for the sequence to
              // end well (see armCage). The selection is stored natively.
              cagePending = true;
              storekit("notify", null, function () { cageExit(true); });
            });
          });
        } else if (act === "pay") {
          // {"rcPaywall": true} (Sep 1): the price step is RevenueCat's
          // remotely designed paywall, presented natively over the wall,
          // so copy and layout change without a build and RevenueCat can
          // run experiments on it. The injected price screen stays the
          // floor: it paints when the offering has no paywall, when the
          // bridge fails, or when the sheet ends without an entitlement.
          // One attempt per session.
          if (window.__konvoRC && !rcTried) {
            rcTried = true;
            track("paywall_viewed", { variant: "rc", screen_id: "s13_rc" });
            storekit("rcPaywall", null, function (res) {
              track("rc_paywall", { result: res && res.result ? res.result : "bridge_failed" });
              if (res && res.entitled) {
                if (res.productId) lastBuy = res.productId;
                setCache(true); finish("s13_paywall"); return;
              }
              track("paywall_viewed", { variant: "default", screen_id: "s13_paywall" });
              if (!pricesReady()) fetchProducts();
              swap(pay("y"));
            });
            return;
          }
          track("paywall_viewed", { variant: "default", screen_id: "s13_paywall" });
          if (!pricesReady()) fetchProducts();
          swap(pay("y"));
        } else if (act === "betafree") {
          // Beta only: unlock without charging, and record that the price
          // was seen and declined - which is the whole point of showing it.
          track("beta_free_taken", { via: "escape", screen_id: "s13_paywall" });
          grantBeta();
          finish("s13_paywall");
        } else if (act === "buy-y") {
          buy(t, "konvo.pro.yearly");
        } else if (act === "buy-m") {
          buy(t, "konvo.pro.monthly");
        } else if (act === "buy-l") {
          buy(t, "konvo.pro.lifetime");
        } else if (act === "restore") {
          // Sync then re-read entitlements; unlocking straight to the
          // inbox - a restorer is returning, not starting a trial.
          // A restorer is returning, not starting a trial - but on this
          // phone the shield may not exist yet, so the tail still runs.
          storekit("restore", null, function (res) {
            if (res && res.entitled) { setCache(true); finish("s13_paywall"); }
          });
        } else if (act === "done") {
          track("onboarding_completed", { screen_id: "s14_success" });
          // Land in messages, never wherever the page happened to drift to.
          if (!atInbox()) location.assign("/direct/inbox/");
          dismiss();
        } else if (act === "terms") {
          openExternal("https://konvoinstall.com/terms");
        } else if (act === "privacy") {
          openExternal("https://konvoinstall.com/privacy");
        }
      });
      // The wall eases on rather than slamming over the fresh login: a
      // short fade so "Instagram connected." arrives, not appears.
      wall.style.opacity = "0";
      (document.body || document.documentElement).appendChild(wall);
      requestAnimationFrame(function () {
        var w = wall;
        if (!w) return;
        w.style.transition = "opacity .35s ease";
        w.style.opacity = "1";
      });
      // Live prices arrive while the connected/loader beat plays; the S13
      // render reads whatever answered by then. The cadence is deliberately
      // slow: ~1.8s on connected, ~4.4s of rows ticking, crossfades between.
      var payShown = false;
      var showPay = function () {
        if (payShown || !wall) return;
        payShown = true;
        track("paywall_viewed", { variant: "default", screen_id: "s13_paywall", via: "lapsed" });
        setPage(pay("y"));
      };
      var priceTries = 0;
      fetchProducts = function () {
        storekit("products", null, function (res) {
          if (res && res.ok) {
            P = res;
            // A pending paywall repaints itself with the real localized
            // prices the moment they exist.
            if (wall && document.getElementById("im-pricewait")) setPage(pay("y"), true);
            if (lapsed) showPay();
            return;
          }
          if (lapsed) showPay();
          if (priceTries++ < 40 && wall) setTimeout(fetchProducts, 2500);
        });
      };
      // The setup-only wall sells nothing: no price fetch, no retries.
      if (setupOnly) return;
      fetchProducts();
      // Live prices first when they arrive in time; the stand-ins after.
      if (lapsed) { setTimeout(showPay, 1500); return; }
      setTimeout(function () {
        swap(loaderPage(), tickRows);
      }, 1800);
      setTimeout(function () {
        // Screen Time setup before the sell (Aug 16): a supported build
        // goes loader -> connect -> perks. konvo-free included since
        // Aug 17 - the block ships free in v1.0 (pricing deferred, so a
        // free TestFlight and App Store build still carries the
        // centerpiece). iOS 15 and a bridge that never answers land on
        // perks; the timeout is the hung-bridge fallback, and a MISSING
        // bridge (macOS) answers null instantly through storekit's catch.
        // The reveal (Aug 22): straight from the loader, the wall clears
        // over the user's own inbox. The Screen Time step moved to the
        // tail of the sequence (finish), after the money.
        track("inbox_reveal_viewed", { screen_id: "s12d_reveal" });
        swap(revealPage(), function () { if (wall) wall.classList.add("im-reveal"); });
      }, 6200);
    }

    // ── The five-minute pass (locked Aug 16) ────────────────────────────
    // Once a day, reason first, and it relocks itself: DeviceActivity
    // counts five minutes of Instagram use and the monitor extension
    // re-raises the shield with Konvo dead. Bounded autonomy is what
    // keeps the block installed past the first story someone needs to
    // post. The reason is a category enum and never free text; it is the
    // only payload the event carries.
    // markCaged flips the button on: called at boot when the cage is
    // already active, and directly after setup succeeds - the first
    // session bug (Aug 16) was relying on boot alone, which had already
    // answered "no cage" before onboarding enabled it, and the SPA never
    // loads another document to ask again.
    var passAvail = false;
    // What the sheet shows comes from cageStatus (PassPolicy is the one
    // source of truth); these are only the bridge-absent defaults.
    var passMins = 5, passLeft = 2;
    var markCaged = function () {};
    if (isPhone) {
      var passStyle = document.createElement("style");
      // Light by default, dark under the media query: the sheet shipped
      // hardcoded dark and looked wrong on a light-mode phone (field
      // report, Aug 17). Blue button and the grays read fine on both.
      passStyle.textContent =
        '#im-pass{display:none;position:fixed;right:16px;bottom:136px;width:44px;' +
        'height:44px;border-radius:50%;background:rgba(255,255,255,.94);color:#1c1c1e;' +
        'z-index:2147483000;align-items:center;justify-content:center;border:0;' +
        'box-shadow:0 2px 10px rgba(0,0,0,.18)}' +
        'html.im-inbox.im-caged #im-pass{display:flex}' +
        // No shield yet: the same button offers the block (Sep 1), never
        // while any wall is up.
        'html.im-inbox.im-lockable #im-pass{display:flex}' +
        'body:has(#im-pay) #im-pass{display:none !important}' +
        '#im-pass-sheet{position:fixed;inset:0;z-index:2147483200;display:flex;' +
        'align-items:flex-end;background:rgba(0,0,0,.45)}' +
        '#im-pass-card{width:100%;background:rgba(242,242,247,.98);color:#1c1c1e;' +
        'border-radius:20px 20px 0 0;padding:22px 20px 34px;' +
        'font-family:-apple-system,system-ui,sans-serif}' +
        '#im-pass-card h3{margin:0;font-size:19px;font-weight:700;' +
        'line-height:1.35;letter-spacing:-0.01em;color:inherit}' +
        '#im-pass-card .im-pr{display:block;width:100%;text-align:left;margin-top:10px;' +
        'padding:14px 16px;border:0;border-radius:14px;background:rgba(120,120,128,.12);' +
        'color:#1c1c1e;font-size:16px;font-family:inherit}' +
        '#im-pass-card .im-pr.on{box-shadow:inset 0 0 0 2px rgba(10,132,255,1)}' +
        '#im-pass-card .im-go{display:block;width:100%;margin-top:16px;padding:15px 0;' +
        'border:0;border-radius:999px;background:rgba(10,132,255,1);color:#fff;' +
        'font-size:16.5px;font-weight:700;font-family:inherit}' +
        '#im-pass-card .im-go[disabled]{opacity:.4}' +
        '#im-pass-card .im-fb{display:block;width:100%;margin:6px 0 0;background:none;border:0;padding:8px;font:500 14px -apple-system,system-ui,sans-serif;color:#0a84ff}' +
        '#im-pass-card .im-x{display:block;width:100%;margin-top:10px;padding:10px 0;' +
        'border:0;background:none;color:rgba(142,142,147,1);font-size:15px;' +
        'font-family:inherit}' +
        '#im-pass-card p{margin:8px 0 0;font-size:13.5px;' +
        'color:rgba(142,142,147,1);line-height:1.4}' +
        '@media (prefers-color-scheme: dark){' +
        '#im-pass{background:rgba(38,38,38,.92);color:#f5f5f7;' +
        'box-shadow:0 2px 10px rgba(0,0,0,.4)}' +
        '#im-pass-card{background:rgba(28,28,30,.98);color:#f5f5f7}' +
        '#im-pass-card .im-pr{background:rgba(255,255,255,.08);color:#f5f5f7}' +
        '}';
      (document.head || document.documentElement).appendChild(passStyle);
      var passBtn = document.createElement("button");
      passBtn.id = "im-pass";
      passBtn.setAttribute("aria-label", "Five minute pass");
      passBtn.innerHTML =
        "<svg width='22' height='22' viewBox='0 0 24 24' fill='none'" +
        " stroke='currentColor' stroke-width='2' stroke-linecap='round'" +
        " stroke-linejoin='round'>" +
        "<circle cx='12' cy='12' r='9'/><path d='M12 7v5l3 3'/></svg>";
      (document.body || document.documentElement).appendChild(passBtn);
      var CLOCK = passBtn.innerHTML;
      var LOCKICON = "<svg width='22' height='22' viewBox='0 0 24 24' fill='none'" +
        " stroke='currentColor' stroke-width='2' stroke-linecap='round'" +
        " stroke-linejoin='round'><rect x='4' y='10.5' width='16' height='10.5' rx='3'/>" +
        "<path d='M8.5 10.5V8a3.5 3.5 0 0 1 7 0'/></svg>";
      // Lockable = Screen Time is available and no shield exists: the
      // button is the way into the block, the user's own decision (Sep 1).
      var lockable = false;
      function setLockable(on) {
        lockable = on;
        document.documentElement.classList.toggle("im-lockable", on);
        passBtn.setAttribute("aria-label", on ? "Block Instagram" : "Five minute pass");
        passBtn.innerHTML = on ? LOCKICON : CLOCK;
      }
      markCaged = function () {
        document.documentElement.classList.add("im-caged");
        setLockable(false);
        passAvail = true;
        passLeft = 2;
      };
      storekit("cageStatus", null, function (s) {
        if (s && s.active) {
          markCaged();
          passAvail = !!s.passAvailable;
          passMins = s.passMins || 5;
          passLeft = s.passesLeft != null ? s.passesLeft : (passAvail ? 2 : 0);
        } else if (s && s.supported) {
          setLockable(true);
        }
      });
      // One nudge, once, on a later day, on the first return from a chat:
      // the app has just done its job. Never the first day, never under a
      // wall, never once a shield exists.
      nudgeBlock = function (days) {
        try {
          if (!lockable || document.getElementById("im-pay")) return false;
          if (localStorage.konvoBlockNudged) return false;
          if (days < 2) return false;
          if (!threadsThisSession) return false;
          localStorage.konvoBlockNudged = "1";
        } catch (e) { return false; }
        track("block_nudge_shown", {});
        var sheet = document.createElement("div");
        sheet.id = "im-pass-sheet";
        sheet.innerHTML = "<div id='im-pass-card'><h3>" + T("Ready to lock the Instagram app?") +
          "</h3><p>" + T("Konvo keeps your DMs. Two 5 minute passes a day.") + "</p>" +
          "<button class='im-go im-block'>" + T("Block Instagram") + "</button>" +
          "<button class='im-x'>" + T("Not now") + "</button></div>";
        sheet.addEventListener("click", function (e) {
          var go = e.target.closest(".im-block");
          if (!go && !e.target.closest(".im-x") && e.target !== sheet) return;
          if (sheet.parentNode) sheet.parentNode.removeChild(sheet);
          track("block_nudge", { choice: go ? "block" : "later" });
          if (go) { setupVia = "nudge"; setupOnly = true; ensure(); }
        });
        (document.body || document.documentElement).appendChild(sheet);
        return true;
      };
      passBtn.addEventListener("click", function () {
        if (lockable) {
          track("block_button_tapped", {});
          setupVia = "button"; setupOnly = true; ensure();
          return;
        }
        // "Reply to someone" was a reason in the first cut and made no
        // sense - replies live in Konvo. Calls do not (documented trade),
        // so calling is exactly what the pass is for.
        var REASONS = [["story", "Post a story"], ["call", "Call someone"],
          ["post", "Post a picture or Reel"], ["other", "Something else"]];
        var opts = "";
        for (var i = 0; i < REASONS.length; i++) {
          opts += "<button class='im-pr' data-r='" + REASONS[i][0] + "'>" +
            REASONS[i][1] + "</button>";
        }
        var sheet = document.createElement("div");
        sheet.id = "im-pass-sheet";
        sheet.innerHTML = "<div id='im-pass-card'>" + (passAvail
          ? "<h3>Why do you want to unlock Instagram?</h3>" + opts +
            "<button class='im-go' disabled>Unlock for " + passMins +
            " mins</button>" +
            "<p>Unlocks left: " + passLeft + " (" + passMins +
            (passLeft > 1 ? " mins each)" : " mins)") + "</p>"
          : "<h3>No pass left today</h3>" +
            "<p>They come back tomorrow.</p>") +
          // The one Konvo-owned surface in daily use, so feedback lives
          // here (Sep 1). ponytail: English like the rest of the card;
          // translate the card as a whole when the pass sheet is localized.
          "<button class='im-fb'>Send feedback</button>" +
          "<button class='im-x'>Close</button></div>";
        var reason = "";
        sheet.addEventListener("click", function (e) {
          if (e.target.closest(".im-fb")) {
            track("feedback_opened", {});
            storekit("feedback", null, function () {});
            if (sheet.parentNode) sheet.parentNode.removeChild(sheet);
            return;
          }
          var r = e.target.closest(".im-pr");
          if (r) {
            reason = r.dataset.r;
            var rs = sheet.querySelectorAll(".im-pr");
            for (var j = 0; j < rs.length; j++) rs[j].classList.remove("on");
            r.classList.add("on");
            var go = sheet.querySelector(".im-go");
            if (go) go.disabled = false;
            return;
          }
          var go2 = e.target.closest(".im-go");
          if (go2 && !go2.disabled && reason) {
            storekit("cagePass", null, function (res) {
              if (res && res.granted) {
                track("pass_used", { reason: reason, mins: passMins });
                // cageStatus corrects this on the next launch either way.
                passLeft = Math.max(passLeft - 1, 0);
                passAvail = passLeft > 0;
              }
              if (sheet.parentNode) sheet.parentNode.removeChild(sheet);
            });
            return;
          }
          if (e.target.closest(".im-x") || e.target === sheet) {
            if (sheet.parentNode) sheet.parentNode.removeChild(sheet);
          }
        });
        (document.body || document.documentElement).appendChild(sheet);
      });
    }

    // Verify at every launch; the verdict beats the cache in both
    // directions. No reply (bridge missing, StoreKit unreachable offline)
    // changes nothing - the cache carries a paying user through airplane
    // mode, and a fresh user has no cache to be wrongly unlocked by.
    // The verdict gates the sequence (see ensure). A missing bridge answers
    // null immediately; a bridge that never replies is covered by the
    // timeout, so a hung StoreKit cannot lock a new user out of onboarding.
    storekit("entitlements", null, function (res) {
      entitlementKnown = true;
      if (!res) return;
      setCache(!!res.entitled);
      if (res.entitled) {
        dismiss();
        // No Screen Time step on launch (Sep 1): a payer without a shield
        // has the lock button in the inbox and decides for themselves.
      } else {
        // A lapsed subscription must not hold Instagram hostage: lift the
        // cage unless beta access still covers it. cageOff is a no-op when
        // no cage was ever set.
        try {
          if (!localStorage.konvoBetaFree) storekit("cageOff", null, function () {});
        } catch (e) {}
      }
    });
    setTimeout(function () { entitlementKnown = true; }, 2500);
    // Retention: fired once per launch, never per navigation.
    // sessionStorage dies with the webview session, so a relaunch counts and
    // moving between screens does not.
    try {
      if (!sessionStorage.konvoOpened) {
        sessionStorage.konvoOpened = "1";
        track("app_opened");
      }
    } catch (e) {}

    // A paying user never sees a wall, so the phone rules immediately.
    if (cached()) goAuto();
    // Same belt-and-braces cadence as enforce(): the inbox is reached by SPA
    // navigation after login, which fires no event this script can hook.
    setInterval(ensure, 800);
    ensure();
  })();

  // Both sweeps are whole-document scans (one of them reads textContent off
  // every span/div/a), and Instagram mutates the DOM on every keystroke,
  // scroll tick and presence ping. Running them per mutation was free on a
  // fast phone and visible jank on an older one, so mutations only ever
  // SCHEDULE a sweep: at most one per frame, and never more than one per
  // 400ms. The CSS rules hide the same doorways instantly anyway; these
  // scans are the fallback for markup the selectors miss.
  var sweepPending = false, sweptAt = 0;
  function sweep() { hideProfileLink(); }
  function scheduleSweep() {
    if (sweepPending) return;
    sweepPending = true;
    var wait = Math.max(0, 400 - (Date.now() - sweptAt));
    setTimeout(function () {
      // Idle time when the engine offers it: a scan that lands mid-scroll
      // or mid-keystroke is exactly the frame the user feels. The timeout
      // guarantees it still runs on a busy page.
      var run = function () {
        sweepPending = false;
        sweptAt = Date.now();
        sweep();
      };
      if (window.requestIdleCallback) requestIdleCallback(run, { timeout: 1200 });
      else requestAnimationFrame(run);
    }, wait);
  }
  new MutationObserver(scheduleSweep)
    .observe(document.documentElement, { childList: true, subtree: true });
  sweep();
})();
