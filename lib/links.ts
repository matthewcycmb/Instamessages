/**
 * Install destinations, shared by the landing page and the download modal.
 *
 * The authuser/hl params the store hands you are stripped: authuser pins the
 * link to whichever Google account copied it, hl forces English.
 */
export const CHROME_STORE_URL: string | null =
  "https://chromewebstore.google.com/detail/idgmjfcejigebpealmimgjebhfnfjcnj?utm_source=item-share-cb";

// A plain browser download, quarantine and all: users right-click > Open past
// Gatekeeper. The curl | bash installer (and its xattr un-quarantine) was
// removed 2026-08-02 after Safe Browsing flagged konvoinstall.com for exactly
// that pattern - do not bring it back; notarization is the real fix.
export const MAC_ZIP =
  "https://github.com/matthewcycmb/instamessages/releases/download/mac-preview/Konvo-mac.zip";

// Approved 2026-08-21. Every mobile CTA on the site is an App Store badge
// pointing here; TestFlight below is only left for the desktop modal's
// "on iPhone" row. The pt/ct params are the ASC campaign token so site
// clicks show up under App Analytics > Acquisition > Campaigns as "Konvo".
export const APP_STORE_URL =
  "https://apps.apple.com/app/apple-store/id6794756261?pt=129211722&ct=Konvo&mt=8";

// Public join link for the External Friends TestFlight group; Apple's page
// handles the rest (installs TestFlight, redeems the code).
export const TESTFLIGHT_URL = "https://testflight.apple.com/join/SH37gxDw";

// The desktop builds are signed but NOT notarized: Apple has not enabled the
// notary service for this team yet (statusCode 7000, "Team is not yet
// configured for notarization"). Until that clears, the platform rows render
// disabled rather than handing anyone a download Gatekeeper will block.
export const MAC_DMG: string | null = null;
export const WINDOWS_EXE: string | null = null;
