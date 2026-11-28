import { useState } from 'react';
import {
  fetchVapidPublicKey,
  useSettings,
  useUpdateSettings,
} from '@cockpit-app/habits-data-access';
import { PageHeader, Switch } from '@cockpit-app/habits-ui';
import { Button, Input } from '@cockpit-app/shared-react-ui';

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

export function SettingsPage() {
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
        <PageHeader title="Settings" />
        <p className="text-muted-foreground mt-4">Loading...</p>
      </div>
    );
  }

  const notificationsEnabled = settings?.notifications_enabled ?? false;

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <PageHeader title="Settings" />

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
          <Switch
            data-testid="push-toggle"
            aria-label="Push Notifications"
            checked={notificationsEnabled}
            disabled={isPending || isSubscribing}
            onCheckedChange={() => void handlePushToggle()}
          />
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
            <Input
              data-testid="reminder-time"
              type="time"
              aria-label="Reminder time"
              value={reminderTime}
              disabled={isPending}
              onChange={(e) => handleReminderChange(e.target.value)}
              className="w-auto"
            />
            {reminderTime && (
              <Button
                data-testid="reminder-clear"
                type="button"
                variant="link"
                size="sm"
                disabled={isPending}
                onClick={() => updateSettings({ reminder_time: null })}
                className="text-muted-foreground underline"
              >
                Clear
              </Button>
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
