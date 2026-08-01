/**
 * Install destinations, shared by the landing page and the download modal.
 *
 * The authuser/hl params the store hands you are stripped: authuser pins the
 * link to whichever Google account copied it, hl forces English.
 */
export const CHROME_STORE_URL: string | null =
  "https://chromewebstore.google.com/detail/instachat-dms-only/idgmjfcejigebpealmimgjebhfnfjcnj";

// A plain browser download, quarantine and all: users right-click > Open past
// Gatekeeper. The curl | bash installer (and its xattr un-quarantine) was
// removed 2026-08-02 after Safe Browsing flagged konvoinstall.com for exactly
// that pattern - do not bring it back; notarization is the real fix.
export const MAC_ZIP =
  "https://github.com/matthewcycmb/instamessages/releases/download/mac-preview/Konvo-mac.zip";
