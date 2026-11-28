import { environments } from '@cockpit-app/shared-utils';
import { SETTINGS_ENDPOINTS } from './endpoints';

/** VAPID public key the browser needs to subscribe to Web Push. */
export async function fetchVapidPublicKey(): Promise<string> {
  const response = await fetch(
    `${environments.apiUrl}${SETTINGS_ENDPOINTS.VAPID_PUBLIC_KEY}`,
    { credentials: 'include' },
  );
  if (!response.ok) {
    throw new Error('Failed to fetch VAPID public key');
  }
  const data = (await response.json()) as { public_key: string };
  return data.public_key;
}
