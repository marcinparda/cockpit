import { Label, Input, Button, ThemeToggle } from '@cockpit-app/shared-react-ui';
import { cn } from '@cockpit-app/shared-utils';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { login } from '@cockpit-app/common-shared-data-access';
import { environments } from '@cockpit-app/shared-utils';

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const [state, formAction] = useActionState(
    async (_prevState: unknown, formData: FormData) => {
      const email = formData.get('email') as string;
      const password = formData.get('password') as string;
      const loggedIn = await login(email, password);
      if (loggedIn) {
        window.location.replace(environments.cockpitUrl);
        return { error: null, success: true };
      }
      return { error: 'Invalid email or password', success: false };
    },
    { error: null, success: false },
  );

  const { pending } = useFormStatus();

  return (
    <div
      className={cn('relative flex h-screen items-center justify-center', className)}
      {...props}
    >
      <div className="absolute top-4 left-4 z-10">
        <ThemeToggle />
      </div>
      <div className="flex h-full w-full">
        <div className="flex w-full items-center justify-center lg:w-1/2">
        <div className="outline-border/40 outline-offset-0.5 dark:outline-border/80 relative flex w-full max-w-sm flex-col items-center p-8 outline-0 sm:outline-2">
          {/* Decorative border lines */}
          <div className="absolute inset-x-0 top-0 w-[calc(100%+4rem)] -translate-x-8 border-t max-sm:hidden" />
          <div className="absolute inset-x-0 bottom-0 w-[calc(100%+4rem)] -translate-x-8 border-b max-sm:hidden" />
          <div className="absolute inset-y-0 left-0 h-[calc(100%+4rem)] -translate-y-8 border-s max-sm:hidden" />
          <div className="absolute inset-y-0 right-0 h-[calc(100%+4rem)] -translate-y-8 border-e max-sm:hidden" />
          <div className="absolute inset-x-0 -top-1 w-[calc(100%+3rem)] -translate-x-6 border-t max-sm:hidden" />
          <div className="absolute inset-x-0 -bottom-1 w-[calc(100%+3rem)] -translate-x-6 border-b max-sm:hidden" />
          <div className="absolute inset-y-0 -left-1 h-[calc(100%+3rem)] -translate-y-6 border-s max-sm:hidden" />
          <div className="absolute inset-y-0 -right-1 h-[calc(100%+3rem)] -translate-y-6 border-e max-sm:hidden" />

          <p className="mt-4 text-xl font-medium">Login to Cockpit</p>

          <form className="mt-8 w-full space-y-4" action={formAction}>
            <div className="flex w-full flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="Email"
                required
                disabled={pending}
                autoComplete="username"
              />
            </div>
            <div className="flex w-full flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Password"
                required
                disabled={pending}
                autoComplete="current-password"
              />
            </div>
            <Button type="submit" className="mt-4 w-full" disabled={pending}>
              {pending ? 'Logging in...' : 'Login'}
            </Button>
            {state.error && (
              <div className="text-center text-sm text-red-500">
                {state.error}
              </div>
            )}
          </form>
        </div>
        </div>

        <div className="bg-muted relative hidden w-1/2 border-l lg:block">
          <img
            alt=""
            className="absolute inset-0 size-full object-cover dark:grayscale"
            src="/login-bg.png"
          />
        </div>
      </div>
    </div>
  );
}
