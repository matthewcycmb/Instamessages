/**
 * Install destinations, shared by the landing page and the download modal.
 *
 * The authuser/hl params the store hands you are stripped: authuser pins the
 * link to whichever Google account copied it, hl forces English.
 */
export const CHROME_STORE_URL: string | null =
  "https://chromewebstore.google.com/detail/instachat-dms-only/idgmjfcejigebpealmimgjebhfnfjcnj";

// See public/install.sh. curl (unlike a browser) doesn't quarantine the
// download, so the app opens with no Gatekeeper wall. Retired once notarized.
export const INSTALL_CMD =
  "curl -fsSL https://konvoinstall.com/install.sh | bash";
