import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { LoginForm } from './LoginForm';
import * as dataAccess from '@cockpit-app/common-shared-data-access';

vi.mock('@cockpit-app/common-shared-data-access', () => ({
  login: vi.fn(),
}));

vi.mock('@cockpit-app/shared-utils', () => ({
  cn: (...args: string[]) => args.filter(Boolean).join(' '),
  environments: { cockpitUrl: 'http://cockpit.test' },
}));

vi.mock('@cockpit-app/shared-react-ui', () => ({
  Label: ({ children, htmlFor }: any) => <label htmlFor={htmlFor}>{children}</label>,
  Input: ({ id, name, type, placeholder, required, disabled, autoComplete }: any) => (
    <input
      id={id}
      name={name}
      type={type}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      autoComplete={autoComplete}
    />
  ),
  Button: ({ children, type, disabled, className, onClick }: any) => (
    <button type={type} disabled={disabled} className={className} onClick={onClick}>
      {children}
    </button>
  ),
  ThemeToggle: () => <div data-testid="theme-toggle" />,
}));

describe('LoginForm', () => {
  const mockLogin = dataAccess.login as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email input', () => {
    render(<LoginForm />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('renders password input', () => {
    render(<LoginForm />);
    expect(screen.getByRole('textbox', { hidden: true }) || document.querySelector('input[type="password"]')).toBeTruthy();
    const passwordInput = document.querySelector('input[type="password"]');
    expect(passwordInput).toBeInTheDocument();
  });

  it('renders submit button with Login text', () => {
    render(<LoginForm />);
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('shows error message when login returns false', async () => {
    mockLogin.mockResolvedValue(false);
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(document.querySelector('input[type="password"]')!, 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
  });

  it('does not show error message initially', () => {
    render(<LoginForm />);
    expect(screen.queryByText('Invalid email or password')).not.toBeInTheDocument();
  });

  it('shows success message when login succeeds', async () => {
    mockLogin.mockResolvedValue({ detail: 'ok' });
    // Override window.location entirely to allow replace mock
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { replace: vi.fn() },
    });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText('Email'), 'test@example.com');
    await user.type(document.querySelector('input[type="password"]')!, 'correctpassword');
    await user.click(screen.getByRole('button', { name: /login/i }));

    expect(await screen.findByText('Login successful!')).toBeInTheDocument();
  });
});
