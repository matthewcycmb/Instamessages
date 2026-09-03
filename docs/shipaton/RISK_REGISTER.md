# Risk register (2026-09-03)

Probability and severity: low, medium, high. Owner M = Matthew, C = Claude session.

| # | Area | Risk | Prob | Sev | Judge impact | Mitigation | Owner | Status |
|---|---|---|---|---|---|---|---|---|
| 1 | Eligibility | Minor entrant without the guardian consent form before Sep 30 | med | high | Disqualified | Guardian reads the rules, completes https://forms.gle/Gx2Cr4X8WPk9V1q77, guardian may hold the Devpost account | M | done 2026-09-03 (Matthew) |
| 2 | Eligibility | School email not on the Devpost account or fails the swot domain check | low | high | Not judged as Next Gen | Matthew says it is set and eligible; screenshot the checker result | M | reported done |
| 3 | Eligibility | Repo has no open-source license, so it is not "open source" per the rules | high | high | Fails intake | Add a license file (decision D3), verify GitHub shows it in About | M decides, C does | open |
| 4 | Third-party | Video shows Instagram's wordmark and logo on the login page | high | med | Rules forbid third-party marks; Section 5 allows removal, not stated as disqualifying | Blur the wordmark or start after login (decision D4) | M | open |
| 5 | Third-party | Wrapper uses undocumented Instagram endpoints and violates Instagram terms; Entrant warrants authorization | med | high | Compliance judge distrust; possible Meta action later | Say plainly what is called and why (unread count, own username), no scraping of content; legal review is outside this session | M | open, documented |
| 6 | Privacy | Instagram user id and username sent to PostHog and not disclosed in store copy or privacy label | high | med | Privacy judge finds a gap between claim and code | Disclose in the privacy page and App Privacy label, or stop sending the username (decision D5) | M | open |
| 7 | Security | Session cookies stored in a plist without an explicit protection class | med | med | Technical judge asks | Set `.completeUntilFirstUserAuthentication` on write; document | C (needs a build) | open |
| 8 | Login | Instagram challenge or 2FA loops for some accounts; App Review had this problem | med | med | Video must show a clean login | Demo account with 2FA off, record the login once | M | open |
| 9 | Blocking | A markup change hides the wrong thing or exposes a doorway | med | med | "Fragile wrapper" | Patch channel (60 s), route tests, language-proof selectors; say the boundary honestly (stories, profiles, single posts open) | C | mitigated, disclose |
| 10 | Blocking | The store copy says "no Reels anywhere" but the single reel permalink opens by design | low | low | Credibility nit | Word it as "no Reels tab, no feed" in the submission | M | open |
| 11 | Open source | Internal handoffs, plans and device ids in the public tree | high | low | Looks careless; leaks ops detail | Remove from HEAD (decision D3), keep history | C | open |
| 12 | Subscription | Founder cannot state recurring value; lifetime undecided | high | med | Criterion 3 stalls at 3 | Decision D2; write the recurring-cost sentence from the ops record | M | open |
| 13 | Measurement | "1000+ users" laurel unsupported; downloads unknown | high | high | Unverifiable claim in the app itself | Do not cite; replace or remove the laurel before the video (decision D6) | M | open |
| 14 | Measurement | login_submitted counts 30 of 443 sign-ins; attempt metrics would mislead | high | low | Only if quoted | Use login_started and login_error; fix the event in 1.5.1 or later | C | open |
| 15 | Presentation | Video over two minutes or without the purchase | low | high | Screeners stop at two minutes | Shot list at 1:50 with the purchase at 0:40 | M | open |
| 16 | Presentation | Description reads as AI-written or too long | med | med | Livestream says it works against you | Matthew writes it himself from the evidence pack | M | open |
| 17 | Reliability | No crash or error monitoring in the app | med | low | Technical judge asks how you know it works | cage_error event exists (1 person); add nothing new for the contest, state it | C | documented |
