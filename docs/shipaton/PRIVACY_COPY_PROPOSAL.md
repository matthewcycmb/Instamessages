# Privacy copy proposal (words for Matthew's approval, nothing applied)

Where the live text at konvoinstall.com/privacy (app/privacy/page.tsx) and the App Store description disagree with the code, with replacement wording. No em dashes.

## 1. "Anonymous usage events ... These carry a random identifier generated on your device, not your Instagram username"

Code today (before the Sep 3 change): the username WAS sent once. After the Sep 3 change the id is still sent. Proposed replacement paragraph:

"Anonymous usage events. Which onboarding screen you reached, whether sign-in succeeded, that the app was opened, and whether a purchase went through. They carry a random identifier created by our billing provider on your device, the app's build number and your phone's language. Once, after your first successful sign-in, the app also records your Instagram account's numeric id, so we can tell a returning device from a new one. We never send your username, your password, or the contents of anything you read or write."

## 2. Missing: the session cookie snapshot and the unread check

Add under "What stays on your device":

"After you sign in, Konvo keeps a copy of your Instagram session cookies in the app's own storage on your phone, protected by iOS until the phone is first unlocked. It exists so a force-quit does not sign you out and so the app can ask Instagram for your unread count in the background. That copy never leaves your phone."

## 3. Missing: RevenueCat, the invite link, push tokens, UserJot

Add under "What we do collect" or a new "Services we use":

"Subscriptions are handled by RevenueCat with Apple's App Store; RevenueCat sees your purchase and an anonymous id, never your Instagram account. If you send an invite link, your Instagram username becomes the link and we store it with your anonymous id so we can count how many friends joined. If you allow notifications, we store a push token for your device so we can wake the app to check for unread messages; the server never sees a message. If you open the feedback board, what you type there goes to UserJot under the same anonymous id."

## 4. "Your email address, only if you type it in"

Verify: the current onboarding has no email step (screens s1 to s11 and the wall). If it is gone, delete this paragraph.

## 5. "showing your messages and friends' stories, with the feed, Reels, and Explore hidden"

Accurate. Keep.

## 6. App Store description line "It collects basic usage analytics, such as which setup screens are reached and whether features work"

Proposed: "It collects anonymous usage analytics, such as which setup screens are reached and whether a purchase went through, plus your Instagram account's numeric id once after sign-in. It never collects your password, your username or your messages."

## 7. App Privacy label (App Store Connect, Matthew's clicks)

Data linked to the user: none. Data not linked to the user: Identifiers (User ID: the anonymous RevenueCat id and the Instagram numeric id), Usage Data (product interaction), Purchases (purchase history via RevenueCat), Diagnostics (none collected: no crash reporter). Device push token if notifications are on. UserJot: user content only if the feedback board is used.
