import { environments } from '@cockpit-app/shared-utils';
import { logout } from './api';

/**
 * Ends the session and sends the user to Login, with `redirect_uri` set to the
 * current page so they come back after logging in. Redirects even when the
 * logout call fails: the user asked to leave.
 */
export async function logoutAndRedirect(): Promise<void> {
  try {
    await logout();
  } catch {
    // Session may already be gone; leave anyway.
  }
  const redirectUrl = new URL(environments.loginUrl);
  redirectUrl.searchParams.set('redirect_uri', window.location.href);
  window.location.href = redirectUrl.toString();
}
