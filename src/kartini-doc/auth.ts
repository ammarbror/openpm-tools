import { execSync } from 'node:child_process';

export function getKartiniOsToken(): string {
  // 1. Check environment variable (DOC_AUTH_TOKEN or legacy KARTINI_OS_AUTH_TOKEN)
  const envToken = process.env.DOC_AUTH_TOKEN || process.env.KARTINI_OS_AUTH_TOKEN;
  if (envToken) {
    return envToken.trim();
  }

  // 2. Extract from active Google Chrome tab
  const appleScript = `
tell application "Google Chrome"
    repeat with w in windows
        repeat with t in tabs of w
            if URL of t contains "kartini-os.com" then
                return execute t javascript "JSON.parse(localStorage.getItem(\\"sb-zubhkexpkefjahotobnx-auth-token\\")).access_token"
            end if
        end repeat
    end repeat
end tell`;

  try {
    const token = execSync(`osascript -e '${appleScript}'`, { encoding: 'utf-8' }).trim();
    if (token && token.length > 20) {
      return token;
    }
  } catch (err) {
    // Chrome extraction failed (e.g. Chrome not open, or Apple Events permission disabled)
  }

  throw new Error(
    'Unable to obtain Kartini OS auth token. Ensure Google Chrome is open with an active tab logged into https://kartini-os.com, and "Allow JavaScript from Apple Events" is enabled under Chrome > View > Developer, or provide KARTINI_OS_AUTH_TOKEN in .env.'
  );
}

export function reloadKartiniOsChromeTab(): boolean {
  const appleScript = `
tell application "Google Chrome"
    repeat with w in windows
        repeat with t in tabs of w
            if URL of t contains "kartini-os.com" then
                execute t javascript "location.reload()"
                return "reloaded"
            end if
        end repeat
    end repeat
end tell`;

  try {
    execSync(`osascript -e '${appleScript}'`, { encoding: 'utf-8' });
    return true;
  } catch {
    return false;
  }
}
