
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
      "Not now": "Pas maintenant",
      "Reload": "Recharger",
      "Instagram's own page": "La page d'Instagram",
      "Konvo never reads your password": "Konvo ne lit jamais ton mot de passe",
      "Reset it here, then come back and sign in.": "Réinitialise-le ici, puis reviens te connecter.",
      "Reset done?": "Mot de passe réinitialisé ?",
      "Sign in": "Me connecter",
      "Link sent.": "Lien envoyé.",
      "Send to another friend": "Envoyer à un autre ami",
      "Your 3 free days are on.": "Tes 3 jours gratuits ont commencé.",
      "Ends {date}. Nothing to cancel, nothing charges.": "Se termine le {date}. Rien à annuler, rien à payer.",
      "Send Konvo to 3 friends": "Envoie Konvo à 3 amis",
      "Every friend who joins gets 3 days free!": "Chaque ami qui s'inscrit a 3 jours gratuits !",
      "Enable notifications for messages?": "Activer les notifications pour tes messages ?",
      "We'll remind you 2 days before your trial ends.": "On te préviendra 2 jours avant la fin de ton essai.",
      "&ldquo;Konvo&rdquo; Would Like to Send You Notifications": "« Konvo » souhaite vous envoyer des notifications",
      "Notifications may include alerts, sounds, and icon badges. These can be configured in Settings.": "Les notifications peuvent inclure des alertes, des sons et des pastilles d'icône. Vous pouvez les configurer dans Réglages.",
      "Allow": "Autoriser",
      "Turn on notifications": "Activer les notifications",
      "You can change this any time in Settings.": "Tu peux changer ça à tout moment dans Réglages.",
      "Copy link": "Copier le lien",
      "Copied": "Copié",
      "Send to 3 friends": "Envoyer à 3 amis",
      "Restore purchase": "Restaurer l'achat",
      "Loading your username": "Chargement de ton nom d'utilisateur",
      "Could not open the share sheet. Try again.": "Impossible d'ouvrir le partage. Réessaie."
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
      "Not now": "先不要",
      "Reload": "重新載入",
      "Instagram's own page": "Instagram 官方頁面",
      "Konvo never reads your password": "Konvo 絕不會讀取你的密碼",
      "Reset it here, then come back and sign in.": "在這裡重設，然後回來登入。",
      "Reset done?": "重設好了？",
      "Sign in": "登入",
      "Link sent.": "連結已送出。",
      "Send to another friend": "再傳給另一個朋友",
      "Your 3 free days are on.": "你的免費 3 天開始了。",
      "Ends {date}. Nothing to cancel, nothing charges.": "{date} 結束。不用取消，不會扣款。",
      "Send Konvo to 3 friends": "把 Konvo 傳給 3 個朋友",
      "Every friend who joins gets 3 days free!": "每個加入的朋友都免費 3 天！",
      "Enable notifications for messages?": "要開啟訊息通知嗎？",
      "We'll remind you 2 days before your trial ends.": "試用結束前 2 天我們會提醒你。",
      "&ldquo;Konvo&rdquo; Would Like to Send You Notifications": "「Konvo」想要傳送通知給你",
      "Notifications may include alerts, sounds, and icon badges. These can be configured in Settings.": "通知可能包含提示、聲音和圖像標記。你可以在「設定」中設定這些項目。",
      "Allow": "允許",
      "Turn on notifications": "開啟通知",
      "You can change this any time in Settings.": "你隨時可以在「設定」中更改。",
      "Copy link": "複製連結",
      "Copied": "已複製",
      "Send to 3 friends": "傳給 3 個朋友",
      "Restore purchase": "恢復購買",
      "Loading your username": "正在讀取你的帳號名稱",
      "Could not open the share sheet. Try again.": "無法打開分享選單，再試一次。"
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
      "Not now": "나중에",
      "Reload": "새로고침",
      "Instagram's own page": "인스타그램 공식 페이지",
      "Konvo never reads your password": "Konvo는 비밀번호를 절대 읽지 않아요",
      "Reset it here, then come back and sign in.": "여기서 재설정한 뒤 돌아와서 로그인해요.",
      "Reset done?": "재설정 끝났어요?",
      "Sign in": "로그인",
      "Link sent.": "링크를 보냈어요.",
      "Send to another friend": "다른 친구에게 보내기",
      "Your 3 free days are on.": "무료 3일이 시작됐어요.",
      "Ends {date}. Nothing to cancel, nothing charges.": "{date}에 끝나요. 취소할 것도, 결제될 것도 없어요.",
      "Send Konvo to 3 friends": "친구 3명에게 Konvo 보내기",
      "Every friend who joins gets 3 days free!": "가입하는 친구마다 3일 무료예요!",
      "Enable notifications for messages?": "메시지 알림을 켤까요?",
      "We'll remind you 2 days before your trial ends.": "체험 종료 2일 전에 미리 알려드릴게요.",
      "&ldquo;Konvo&rdquo; Would Like to Send You Notifications": "‘Konvo’에서 알림을 보내고자 합니다",
      "Notifications may include alerts, sounds, and icon badges. These can be configured in Settings.": "알림에는 경고, 사운드 및 아이콘 배지가 포함될 수 있습니다. 설정에서 구성할 수 있습니다.",
      "Allow": "허용",
      "Turn on notifications": "알림 켜기",
      "You can change this any time in Settings.": "설정에서 언제든지 바꿀 수 있어요.",
      "Copy link": "링크 복사",
      "Copied": "복사됨",
      "Send to 3 friends": "친구 3명에게 보내기",
      "Restore purchase": "구매 복원",
      "Loading your username": "사용자 이름을 불러오는 중",
      "Could not open the share sheet. Try again.": "공유 시트를 열 수 없어요. 다시 시도해요."
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
    var els = document.querySelectorAll("span,h1,div");
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.childElementCount || el.dataset.imTitle) continue;
      var t = (el.textContent || "").trim();
      if (!/^[A-Za-z0-9._]{2,30}$/.test(t)) continue;
      var r = el.getBoundingClientRect();
      if (r.width === 0 || r.top < 0 || r.top > 120) continue;
      // Latched only on a match (Sep 2): an early sweep on an inbox that
      // had not painted its header yet used to give up for good, and the
      // handle (the invite code) never arrived.
      titleSized = true;
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
  // The signed-out chain on instagram.com. reset and signup joined Sep 1
  // for the sheet; their login_step / login_left rows are the reset
  // route's own measure.
  function loginStage() {
    var p = location.pathname;
    return p.indexOf("/challenge") !== -1 ? "challenge"
      : p.indexOf("two_factor") !== -1 ? "two_factor"
      : p.indexOf("/accounts/password/reset") === 0 ? "reset"
      : p.indexOf("/accounts/emailsignup") === 0 ? "signup"
      : p.indexOf("/accounts/login") === 0 ? "login" : null;
  }
  function signedIn() { return /(?:^|; )ds_user_id=\d/.test(document.cookie); }
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
      // The sheet's own buttons report as login_sheet, not as taps on
      // Instagram's page.
      if (b.closest("#im-sheet,#im-reset-bar")) return;
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
    // Anchored to the page, not the viewport (Sep 1, build 99 on device):
    // the keyboard scrolls the form up and a fixed tip stayed over it.
    top += window.pageYOffset || 0;
    tip.setAttribute("style", "position:absolute;top:" + top + "px;left:16px;right:16px;" +
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

  // The sign-in sheet (Sep 1): Instagram's login page framed the way
  // Safari's in-app sheet frames a page - the lock, the real address,
  // reload, and a footer naming whose page it is - so signing in feels
  // like signing in on Instagram, because it is. Drawn by the cage inside
  // the one webview, never a real Safari controller: that one keeps its
  // own cookies and consumer Instagram has no way to hand the session
  // back. The strip reads location, so it cannot lie. Up on every
  // signed-out page of the chain, down the moment the session cookie
  // exists; iPhone only, the Mac has a window. No Done: there is nothing
  // behind the sheet to go back to (the onboarding bounces straight here
  // once finished), and the Konvo page that stood in for it read as a
  // stray screen on the phone (Matthew, build 99). Instagram's own
  // "Forgot password?" is the reset route; the sheet gives that page its
  // own footer line and a way back when the app returns from the email.
  // The sheet rises once, on first arrival, like a presented sheet; the
  // band above it is native (appearance "black") and goes with the sheet.
  // Half of the people lost at login never touched the page (95 of 193
  // in the week before this); the sheet is for them.
  var resetBarShown = false, footLine = "";
  var LOCK = "<svg width='11' height='13' viewBox='0 0 11 13' aria-hidden='true'>" +
    "<path d='M2 5V4a3.5 3.5 0 0 1 7 0v1h.5A1.5 1.5 0 0 1 11 6.5v5A1.5 1.5 0 0 1 9.5 13h-8" +
    "A1.5 1.5 0 0 1 0 11.5v-5A1.5 1.5 0 0 1 1.5 5H2zm1.5 0h4V4a2 2 0 0 0-4 0v1z' fill='currentColor'/></svg>";
  function sheetLook(mode) {
    try {
      window.webkit.messageHandlers.konvoStore.postMessage(
        { cmd: "appearance", id: 0, productId: mode });
    } catch (e) {}
  }
  function sheetAct(e) {
    var t = e.target.closest && e.target.closest("[data-act]");
    if (!t) return;
    var act = t.getAttribute("data-act");
    track("login_sheet", { act: act, stage: loginStage() });
    if (act === "reset_return") location.assign("/accounts/login/");
    else if (act === "reload") location.reload();
  }
  function loginSheet(st) {
    // Waits for the body: the strip and footer live inside it, and the
    // rise must start with something to show.
    if (!/iPhone|iPad|iPod/.test(navigator.userAgent) || !document.body) return;
    var strip = document.getElementById("im-sheet"), foot;
    if (!strip) {
      var css = document.createElement("style");
      css.textContent =
        "#im-sheet,#im-sheet-foot,#im-reset-bar{display:none;font-family:-apple-system,system-ui,sans-serif;-webkit-user-select:none}" +
        "html.im-sheet{background:#000 !important}" +
        // ponytail: body padding is the push; the live page (build 99 on
        // device) obeys the top and keeps its own 100vh below, so the foot
        // of Instagram's page scrolls out from under the footer.
        "html.im-sheet body{padding-top:70px !important;padding-bottom:38px !important;box-sizing:border-box}" +
        // The rise: the whole document (page, strip, footer) slides up as
        // one sheet over the black canvas, once, on first arrival.
        "html.im-sheet.im-rise{animation:ims-rise .5s cubic-bezier(.32,.72,0,1) both}" +
        "@keyframes ims-rise{from{transform:translateY(100%)}to{transform:none}}" +
        "@media (prefers-reduced-motion:reduce){html.im-sheet.im-rise{animation:none}}" +
        "html.im-sheet #im-sheet{display:block;position:fixed;top:0;left:0;right:0;z-index:2147483646;padding-top:8px;background:#000}" +
        "#im-sheet .ims-card{background:#f7f7f7;border-radius:12px 12px 0 0;border-bottom:1px solid #d9d9de}" +
        "#im-sheet .ims-grab{width:36px;height:5px;border-radius:3px;background:#c7c7cc;margin:6px auto 0}" +
        "#im-sheet .ims-bar{display:grid;grid-template-columns:64px 1fr 64px;align-items:center;height:46px;padding:0 10px}" +
        "#im-sheet button{border:0;background:none;color:#0a84ff;font:400 21px/1 -apple-system,system-ui,sans-serif;padding:8px 6px;margin:0;text-align:right}" +
        "#im-sheet .ims-url{display:flex;align-items:center;justify-content:center;gap:5px;font-size:15px;color:#1c1c1e;white-space:nowrap;overflow:hidden}" +
        "#im-sheet .ims-url svg{color:#3c3c43;flex:none}" +
        "#im-sheet .ims-path{color:#8e8e93;overflow:hidden;text-overflow:ellipsis}" +
        "html.im-sheet #im-sheet-foot{display:flex;position:fixed;left:0;right:0;bottom:0;height:38px;z-index:2147483646;" +
        "align-items:center;justify-content:center;gap:6px;font-size:12px;color:#6b6b70;background:#f7f7f7;border-top:1px solid #d9d9de}" +
        "html.im-sheet #im-reset-bar{display:flex;position:fixed;left:16px;right:16px;bottom:50px;z-index:2147483646;align-items:center;" +
        "justify-content:space-between;gap:12px;padding:8px 8px 8px 18px;border-radius:18px;background:rgba(18,22,30,.94);color:#f2f3f7;" +
        "font:600 14px/1.35 -apple-system,system-ui,sans-serif;box-shadow:0 4px 18px rgba(0,0,0,.3)}" +
        "#im-reset-bar button{border:0;border-radius:12px;background:#0a84ff;color:#fff;font:600 15px/1 -apple-system,system-ui,sans-serif;padding:11px 16px}";
      document.head.appendChild(css);
      strip = document.createElement("div");
      strip.id = "im-sheet";
      strip.innerHTML = "<div class='ims-card'><div class='ims-grab'></div><div class='ims-bar'><span></span>" +
        "<div class='ims-url'>" + LOCK + "<span class='ims-host'></span><span class='ims-path'></span></div>" +
        "<button data-act='reload' aria-label='" + T("Reload") + "'>↻</button></div></div>";
      strip.addEventListener("click", sheetAct);
      foot = document.createElement("div");
      foot.id = "im-sheet-foot";
      document.body.appendChild(strip);
      document.body.appendChild(foot);
      // Back from the email with the reset page still up: one way back.
      document.addEventListener("visibilitychange", function () {
        if (document.visibilityState !== "visible" || loginStage() !== "reset" || resetBarShown) return;
        resetBarShown = true;
        var bar = document.createElement("div");
        bar.id = "im-reset-bar";
        bar.innerHTML = "<span>" + T("Reset done?") + "</span>" +
          "<button data-act='reset_return'>" + T("Sign in") + "</button>";
        bar.addEventListener("click", sheetAct);
        document.body.appendChild(bar);
      });
      // The first document of the chain rises; the pages after it (the
      // reset page, a challenge) are the same sheet, already up.
      var rise = true;
      try { rise = !sessionStorage.konvoSheet; sessionStorage.konvoSheet = "1"; } catch (e) {}
      if (rise) {
        document.documentElement.classList.add("im-rise");
        setTimeout(function () { document.documentElement.classList.remove("im-rise"); }, 700);
      }
      sheetLook("black");
    }
    foot = document.getElementById("im-sheet-foot");
    strip.querySelector(".ims-host").textContent = location.hostname.replace(/^www\./, "");
    strip.querySelector(".ims-path").textContent = location.pathname;
    var line = st === "reset" ? T("Reset it here, then come back and sign in.")
      : LOCK + "<span>" + T("Instagram's own page") + " · " + T("Konvo never reads your password") + "</span>";
    if (footLine !== line) { footLine = line; foot.innerHTML = line; }
    document.documentElement.classList.add("im-sheet");
  }
  // The session is here (this document or the one before it): the sheet
  // and its band go, and the look is the phone's again.
  function dropLoginSheet() {
    var ids = ["im-sheet", "im-sheet-foot", "im-reset-bar"], had = false;
    for (var i = 0; i < ids.length; i++) {
      var el = document.getElementById(ids[i]);
      if (el && el.parentNode) { el.parentNode.removeChild(el); had = true; }
    }
    document.documentElement.classList.remove("im-sheet");
    try {
      if (sessionStorage.konvoSheet) { had = true; sessionStorage.removeItem("konvoSheet"); }
    } catch (e) {}
    if (had) sheetLook("auto");
  }

  // Cage exceptions were invisible until the stuck-chat hunt; three per
  // session, message only, nothing from the page's content.
  window.addEventListener("error", function (e) {
    try {
      var n = +(sessionStorage.konvoErrs || 0);
      if (n >= 3) return;
      sessionStorage.konvoErrs = n + 1;
      track("cage_error", { msg: String((e && e.message) || "").slice(0, 120) });
    } catch (x) {}
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
  // The moment (Sep 2, Matthew): the person is in (paid, on a trial, or a
  // friend's days), has read a chat, and is back at the inbox. The day
  // gate is gone; the once-per-install flag and "never under a wall" stay.
  function maybeAskReview(days) {
    try {
      if (localStorage.konvoReviewAsked) return;
      if (!localStorage.konvoPaid && !localStorage.konvoDone) return;
      if (!threadsThisSession) return;
      if (document.getElementById("im-pay")) return;
      localStorage.konvoReviewAsked = "1";
      track("review_asked", {});
      storekit("review", null, function () {});
    } catch (e) {}
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
    var ls = loginStage();
    if (ls && ls !== lastLoginStage) {
      lastLoginStage = ls;
      // A signed-in visit to these routes is not login friction.
      if (!signedIn()) track("login_step", { stage: ls });
    }
    if (ls && !signedIn()) {
      watchLogin();
      hintLoginFields(ls);
      // The sheet pushes the page down; the key tip measures the logo
      // after that, not before, or it lands on the logo (render, Sep 1).
      loginSheet(ls);
      showKeyTip(ls);
      pollLoginErrors(ls);
    } else if (signedIn()) {
      dropLoginSheet();
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
              // The handle is also the invite code (Sep 1): kept on every
              // settle so the invite page can build the link.
              var un0 = titleEl && (titleEl.textContent || "").trim();
              if (un0) localStorage.konvoHandle = un0;
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
      // {"invite": false} (Sep 2) hides the post-purchase "Send Konvo to 3
      // friends" line, the only door to the invite loop.
      if (p.invite === false) window.__konvoNoInvite = true;
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
      // The invite loop (Sep 1): the paywall's close is a plain white X on
      // the blue header, no disc; a waiting Send is dimmed.
      "#im-pay .inv-link{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:22px;padding:12px 14px;" +
      "border-radius:14px;background:var(--chip);font-size:15px;color:var(--ink);font-variant-numeric:tabular-nums}" +
      "#im-pay .inv-link .inv-url{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
      "#im-pay .inv-link .inv-copy{flex:none;color:var(--accent);font-weight:600}" +
      '#im-pay .imp-btn[disabled]{opacity:.5}' +
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
    // The notifications page (Sep 2, Matthew): the Screen Time page's
    // pattern for the one permission every buyer is asked, so the system
    // dialog lands as expected. iOS asks once per install, so the page shows
    // once (konvoNotifyAsked); the reminder it promises is the anti-forget
    // tool against the first-hour trial cancel.
    function notifyPage(td) {
      return "<div class='imp-mid' style='padding:24px'>" +
        "<h2 style='font-size:26px;text-align:center'>" + T("Enable notifications for messages?") + "</h2>" +
        "<div style='border:2px solid var(--accent);border-radius:20px;padding:7px;" +
        "margin:22px auto 0;max-width:300px;width:100%'>" +
        "<div style='background:var(--icbg);border-radius:14px;padding:14px 12px 0;text-align:center'>" +
        "<b style='font-size:14px;display:block'>" + T("&ldquo;Konvo&rdquo; Would Like to Send You Notifications") + "</b>" +
        "<p style='font-size:11.5px;line-height:1.4;color:var(--mut);margin-top:5px'>" +
        T("Notifications may include alerts, sounds, and icon badges. These can be configured in Settings.") + "</p>" +
        "<div style='display:flex;border-top:1px solid rgba(120,120,128,.25);margin-top:12px'>" +
        "<span style='flex:1;padding:11px 0;color:var(--accent);font-size:15.5px;" +
        "border-right:1px solid rgba(120,120,128,.25)'>" + T("Don&rsquo;t Allow") + "</span>" +
        "<span style='flex:1;padding:11px 0;color:var(--accent);font-weight:700;font-size:15.5px'>" + T("Allow") + "</span>" +
        "</div></div></div>" +
        "<svg width='34' height='40' viewBox='0 0 34 40' fill='none' stroke='var(--accent)' stroke-width='3'" +
        " stroke-linecap='round' stroke-linejoin='round' style='margin:10px 0 0 62%'>" +
        "<path d='M24 36 C 26 22, 22 12, 14 5'/><path d='M22 7 L14 5 L13 13'/></svg>" +
        "<p style='text-align:center;font-size:13.5px;line-height:1.5;color:var(--mut);margin-top:14px'>" +
        // The reminder promise sits here for a trial (Sep 2, Matthew): the
        // page has no description, so this line is the only mention of it.
        (td ? T("We'll remind you 2 days before your trial ends.") : T("You can change this any time in Settings.")) + "</p>" +
        "</div><div class='imp-foot'>" +
        "<button class='imp-btn' data-act='notify-go'>" + T("Turn on notifications") + "</button>" +
        "<div class='imp-links'><span data-act='notify-skip'>" + T("Not now") + "</span></div></div>";
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
    var PROOF_IMG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA4QAAAG/CAYAAAAAbBl8AAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAADhKADAAQAAAABAAABvwAAAAA5LQIoAABAAElEQVR4Aey9CaBlRXUuvOdzzr23b88DzSyNIK2AQsApClFRVDQvEU3EKGoElWDEIRGHeB0eDigkShxQo8/E3xd4+dWQxAy/kfh8jhA1EcSAiIJM3fTt6Q7nnD383/et2rdv+xxBuvveXnXv2bt21aratb61qmpV1d61o4mJJoncOQKOgCPgCDgCjoAj4Ag4Ao6AI+AI7FcINE0T71cMO7OOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AIOAKOgCPgCDgCjoAj4Ag4Ao6AI+AI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";
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

    // ── The invite loop (Sep 1) ──────────────────────────────────
    // Reached only from "You're in" (Sep 2, final): the paywall stays a
    // hard gate with no close, so nothing here competes with the price.
    // Send is the iOS share sheet through the bridge, never Instagram's
    // composer. A friend who pastes the link at their paywall gets 3 days
    // free, three friends per code at most; the sender gets nothing. The
    // draft is Matthew's (lowercase, no adjectives, link last) and stays
    // English in every language; the chrome speaks the phone's language.
    var DRAFTS = [
      "not an ad lol but i've been using this app called konvo, it's just instagram dms with no feed or reels. been on my phone way less. you get 3 days free off my link if u want: {link}"
    ];
    var claimAsked = false, inviteExpires = 0, handleTries = 0;
    function handle() { try { return localStorage.konvoHandle || ""; } catch (e) { return ""; } }
    function inviteLink() { return "https://konvoinstall.com/i/" + handle(); }
    // The message the share sheet carries (Matthew's first draft); the
    // page itself shows no text to edit (Sep 1 evening: "no pre written
    // text", the page reads like the rest of the sequence).
    function draftText() { return DRAFTS[0].split("{link}").join("konvoinstall.com/i/" + handle()); }
    function invitePage() {
      var h = handle();
      return "<div class='imp-mid' style='align-items:center;padding:0 34px'>" +
        "<h2 style='font-size:28px;text-align:center'>" + T("Send Konvo to 3 friends") + "</h2>" +
        "<p style='font-size:17px;line-height:1.5;color:var(--ink);margin-top:14px;text-align:center'>" +
        T("Every friend who joins gets 3 days free!") + "</p>" +
        // The link itself, to copy and paste anywhere (Matthew, Sep 2).
        "<div class='inv-link'" + (h ? " data-act='inv-copy'" : "") + "><span class='inv-url'>konvoinstall.com/i/" +
        (h || "\u2026") + "</span><span class='inv-copy'>" + T("Copy link") + "</span></div></div>" +
        "<div class='imp-foot' style='padding:10px 28px 24px'>" +
        "<button class='imp-btn' data-act='inv-send'" + (h ? "" : " disabled") + ">" +
        (h ? T("Send to 3 friends") : T("Loading your username")) + "</button>" +
        "<div class='imp-links'><span data-act='inv-later'>" + T("Not now") + "</span></div></div>";
    }
    // After the share sheet completes: nothing is granted for sending (Sep
    // 2). The sender's 3 days land when the first friend joins, so the page
    // says so, and asks the server once whether that already happened.
    function inviteSent() {
      return "<div class='imp-mid' style='align-items:center;padding:0 34px'>" +
        "<h2 style='font-size:30px;text-align:center'>" + T("Link sent.") + "</h2>" +
        "<p style='font-size:17px;line-height:1.5;color:var(--mut);margin-top:14px;text-align:center'>" +
        T("Every friend who joins gets 3 days free!") + "</p></div>" +
        "<div class='imp-foot' style='padding:10px 28px 24px'>" +
        "<button class='imp-btn' data-act='inv-send'>" + T("Send to another friend") + "</button>" +
        "<div class='imp-links'><span data-act='inv-open'>" + T("Open my messages") + "</span></div></div>";
    }
    // The 3 free days are on (a friend who pasted, or a sender whose first
    // friend joined while the page was up).
    function daysOn(head) {
      var days = inviteExpires ? Math.max(1, Math.round((inviteExpires - Date.now()) / 86400000)) : 3;
      return "<div class='imp-mid' style='align-items:center;padding:0 34px'>" +
        drawnCheck(head, T("Ends {date}. Nothing to cancel, nothing charges.",
          { date: "<b style='color:var(--ink);font-weight:600'>" + dateIn(days) + "</b>" })) + "</div>" +
        "<div class='imp-foot' style='padding:0 28px 40px'>" +
        "<button class='imp-btn' data-act='inv-open'>" + T("Open my messages") + "</button></div>";
    }
    // Send waits for the handle (captured at the inbox settle under the
    // wall) rather than sending a broken link.
    // The inbox title under the wall is not a reliable source (Sep 2,
    // device: "Loading your username" forever). Instagram's own account
    // endpoints answer with the signed-in username, with the headers their
    // web client sends; two are tried in turn and each attempt reports its
    // status, so a refusal is visible in PostHog instead of a stuck button.
    // The username and nothing else is kept.
    var handleAsked = false;
    function igGet(path) {
      var csrf = (document.cookie.match(/(?:^|; )csrftoken=([^;]+)/) || [])[1] || "";
      return fetch(path, { credentials: "include", headers: {
        "X-IG-App-ID": "936619743392459", "X-ASBD-ID": "129477", "X-IG-WWW-Claim": "0",
        "X-CSRFToken": csrf, "X-Requested-With": "XMLHttpRequest", "Accept": "*/*" } })
        .then(function (r) {
          return r.json().then(function (j) { return { status: r.status, json: j }; },
            function () { return { status: r.status, json: null }; });
        });
    }
    function learnHandle() {
      if (handleAsked || !window.fetch) return;
      handleAsked = true;
      var uid = (document.cookie.match(/(?:^|; )ds_user_id=(\d+)/) || [])[1];
      var tries = [["current_user", "/api/v1/accounts/current_user/?edit=true"]];
      if (uid) tries.push(["user_info", "/api/v1/users/" + uid + "/info/"]);
      (function next(i) {
        if (i >= tries.length) return;
        igGet(tries[i][1]).then(function (r) {
          var u = r.json && r.json.user && r.json.user.username;
          var ok = !!(u && /^[A-Za-z0-9._]{1,30}$/.test(u));
          track("invite_handle", { source: tries[i][0], status: r.status, found: ok });
          if (ok) { try { localStorage.konvoHandle = u; } catch (e) {} } else next(i + 1);
        }, function () {
          track("invite_handle", { source: tries[i][0], status: 0, found: false });
          next(i + 1);
        });
      })(0);
    }
    function waitHandle() {
      if (handle() || handleTries++ > 40 || !wall) return;
      learnHandle();
      setTimeout(function () {
        if (!wall || !wall.querySelector("[data-act='inv-send']")) return;
        if (handle()) setPage(invitePage(), true); else waitHandle();
      }, 500);
    }
    // The friend's side: an entitled answer from the claim sheet ends the
    // sequence the way a purchase does.
    function claimCb(res) {
      if (!res || !res.entitled) return;
      track("invite_claimed", { method: res.method || "clipboard", screen_id: "s13_paywall" });
      inviteExpires = +res.expires || 0;
      setCache(true);
      swap(daysOn(T("Your 3 free days are on.")));
    }
    // Once per session, at the first price paint: if the clipboard holds
    // a web link, the native claim sheet comes up instead of the cards.
    function claimAuto() {
      if (claimAsked) return;
      claimAsked = true;
      storekit("claim", "auto", claimCb);
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
        "<button class='imp-btn' data-act='done'>" + T("Open my messages") + "</button>" +
        "</div>";
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
      finishTd = td;
      finishAfter = landing;
      // The notifications page first (Sep 2), once per install; iOS only
      // ever prompts once, so a second time through goes straight on.
      if (notifyAsked()) { askNotify(); return; }
      swap(notifyPage(td));
    }
    var finishTd = 0, finishAfter = null;
    function notifyAsked() { try { return !!localStorage.konvoNotifyAsked; } catch (e) { return true; } }
    // The page holds still under the system prompt (Sep 2, device: it
    // moved on to the next page while the prompt was still up); the
    // sequence continues only when iOS answers.
    function askNotify() {
      try { localStorage.konvoNotifyAsked = "1"; } catch (e) {}
      var b = wall && wall.querySelector("[data-act='notify-go']");
      if (b) b.disabled = true;
      storekit("notify", String(finishTd), function (r) {
        track("notify_answered", { granted: !!(r && r.granted), trial: !!finishTd });
        if (finishAfter) finishAfter();
      });
    }
    function skipNotify() {
      try { localStorage.konvoNotifyAsked = "1"; } catch (e) {}
      track("notify_answered", { granted: false, trial: !!finishTd, skipped: true });
      if (finishAfter) finishAfter();
    }
    function landing() {
      var moved = false;
      var fallback = setTimeout(function () {
        moved = true;
        inviteStep();
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
        inviteStep();
      });
    }
    // The gift is its own page (Sep 2, Matthew): notifications, then
    // "Send Konvo to 3 friends", then "You're in". Only a purchase gets
    // it; the beta grant, the free build and a restore go straight on.
    // {"invite": false} in the cage patch skips it.
    function inviteStep() {
      if (window.__konvoNoInvite || !lastBuy) { swap(successPage(lastBuy)); return; }
      track("invite_page_viewed", { via: "flow", screen_id: "s15_invite" });
      swap(invitePage());
      handleTries = 0;
      waitHandle();
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
        // What happened after the buy tap (Sep 2): Apple's sheet closed,
        // a StoreKit error, a pending approval, or a purchase. Until now
        // 84 people who compared plans and walked were indistinguishable
        // from a broken sheet. Enum only, never the error text.
        track("purchase_result", {
          plan: productId.indexOf("yearly") > 0 ? "annual"
            : productId.indexOf("monthly") > 0 ? "monthly" : "lifetime",
          result: !res ? "no_bridge" : (res.ok && res.entitled) ? "purchased"
            : res.cancelled ? "cancelled" : res.pending ? "pending"
            : res.ok ? "not_entitled" : "error",
          screen_id: "s13_paywall",
        });
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
              claimAuto();
            });
            return;
          }
          track("paywall_viewed", { variant: "default", screen_id: "s13_paywall" });
          if (!pricesReady()) fetchProducts();
          swap(pay("y"));
          claimAuto();
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
        } else if (act === "inv-copy") {
          track("invite_link_copied", { screen_id: "s15_invite" });
          var copied = function () {
            var l = wall.querySelector(".inv-copy");
            if (l) { l.textContent = T("Copied"); setTimeout(function () { if (l.isConnected) l.textContent = T("Copy link"); }, 1500); }
          };
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(inviteLink()).then(copied, copied);
          } else { copied(); }
        } else if (act === "notify-go") {
          askNotify();
        } else if (act === "notify-skip") {
          skipNotify();
        } else if (act === "inv-later") {
          swap(successPage(lastBuy));
        } else if (act === "inv-send") {
          if (t.disabled || !handle()) return;
          var sentDraft = 0;
          t.disabled = true;
          storekit("invite", JSON.stringify({ handle: handle(), text: draftText(), url: inviteLink(), draft: sentDraft }),
            function (res) {
              if (!wall) return;
              t.disabled = false;
              if (!res || !res.ok) { t.textContent = T("Could not open the share sheet. Try again."); return; }
              if (!res.sent) return;
              track("invite_sent", { draft: sentDraft, screen_id: "s15_invite" });
              swap(inviteSent());
            });
        } else if (act === "inv-open") {
          // A friend ending their claim finishes the sequence here (with
          // the notifications page once); a payer from "You're in" already did.
          var fresh = false;
          try {
            if (!localStorage.konvoDone) {
              fresh = true;
              track("onboarding_completed", { screen_id: "s15_invite" });
              localStorage.konvoDone = "1";
            }
          } catch (e) {}
          var toInbox = function () { if (!atInbox()) location.assign("/direct/inbox/"); dismiss(); };
          if (fresh && !notifyAsked()) { finishTd = 0; finishAfter = toInbox; swap(notifyPage(0)); return; }
          toInbox();
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
        claimAuto();
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
