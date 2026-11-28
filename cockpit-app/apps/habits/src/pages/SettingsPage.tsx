import { useState } from 'react';
import { useSettings, useUpdateSettings } from '../api/hooks/useSettings';
import { SETTINGS_ENDPOINTS } from '../api/endpoints';
import { environments } from '@cockpit-app/shared-utils';

async function fetchVapidPublicKey(): Promise<string> {
  const response = await fetch(`${environments.apiUrl}${SETTINGS_ENDPOINTS.VAPID_PUBLIC_KEY}`, {
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch VAPID public key');
  }
  const data = (await response.json()) as { public_key: string };
  return data.public_key;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const { mutate: updateSettings, isPending } = useUpdateSettings();
  const [pushError, setPushError] = useState<string | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);

  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const reminderTime = (settings?.reminder_time ?? '').slice(0, 5);

  function handleReminderChange(value: string) {
    if (!value) {
      updateSettings({ reminder_time: null });
      return;
    }
    // Default the timezone to the browser's the first time a reminder is set.
    updateSettings({
      reminder_time: value,
      ...(settings?.timezone ? {} : { timezone: browserTimezone }),
    });
  }

  async function handlePushToggle() {
    const currentlyEnabled = settings?.notifications_enabled ?? false;

    if (currentlyEnabled) {
      updateSettings({ notifications_enabled: false, push_subscription: null });
      return;
    }

    setPushError(null);
    setIsSubscribing(true);

    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setPushError(
          'Push notification permission was denied. Please enable it in your browser settings.',
        );
        setIsSubscribing(false);
        return;
      }

      const vapidPublicKey = await fetchVapidPublicKey();
      const serviceWorkerRegistration = await navigator.serviceWorker.ready;
      const subscription = await serviceWorkerRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      const subscriptionJson = subscription.toJSON();
      updateSettings({
        notifications_enabled: true,
        push_subscription: subscriptionJson as Record<string, unknown>,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to enable push notifications';
      setPushError(message);
    } finally {
      setIsSubscribing(false);
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-4">Loading...</p>
      </div>
    );
  }

  const notificationsEnabled = settings?.notifications_enabled ?? false;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <section aria-labelledby="notifications-heading">
        <h2 id="notifications-heading" className="text-lg font-semibold mb-4">
          Notifications
        </h2>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div>
            <p className="font-medium">Push Notifications</p>
            <p className="text-sm text-muted-foreground">
              Receive reminders to log your habits
            </p>
          </div>
          <button
            data-testid="push-toggle"
            type="button"
            role="switch"
            aria-checked={notificationsEnabled}
            disabled={isPending || isSubscribing}
            onClick={() => void handlePushToggle()}
            className={[
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
              'disabled:cursor-not-allowed disabled:opacity-50',
              notificationsEnabled ? 'bg-primary' : 'bg-muted',
            ].join(' ')}
          >
            <span
              className={[
                'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform',
                notificationsEnabled ? 'translate-x-6' : 'translate-x-1',
              ].join(' ')}
            />
          </button>
        </div>

        {pushError && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            {pushError}
          </p>
        )}
      </section>

      <section aria-labelledby="reminder-heading">
        <h2 id="reminder-heading" className="text-lg font-semibold mb-4">
          Daily reminder
        </h2>
        <div className="rounded-lg border p-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            One reminder a day, sent only if some habits are still not logged.
          </p>
          <div className="flex items-center gap-3">
            <input
              data-testid="reminder-time"
              type="time"
              aria-label="Reminder time"
              value={reminderTime}
              disabled={isPending}
              onChange={(e) => handleReminderChange(e.target.value)}
              className="rounded-md border bg-background px-3 py-2"
            />
            {reminderTime && (
              <button
                data-testid="reminder-clear"
                type="button"
                disabled={isPending}
                onClick={() => updateSettings({ reminder_time: null })}
                className="text-sm text-muted-foreground underline"
              >
                Clear
              </button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Timezone: <span className="font-medium text-foreground">{settings?.timezone ?? browserTimezone}</span>
          </p>
        </div>
      </section>
    </div>
  );
}
