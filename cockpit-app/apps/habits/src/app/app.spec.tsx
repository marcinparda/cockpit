import { render, screen } from '@testing-library/react';
import { vi, describe, it, afterEach, expect } from 'vitest';
import '@testing-library/jest-dom';

vi.mock('./router', () => ({
  default: () => <div data-testid="router">Router</div>,
}));

vi.mock('@cockpit-app/common-shared-data-access', () => ({
  logoutAndRedirect: vi.fn(),
}));

vi.mock('@cockpit-app/shared-react-data-access', () => ({
  useUser: vi.fn(),
  tanstackQueryClient: {},
}));

import App from './app';
import * as useUserModule from '@cockpit-app/shared-react-data-access';
import * as logoutModule from '@cockpit-app/common-shared-data-access';

describe('App', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to Login and renders nothing when useUser returns no user (401)', () => {
    vi.mocked(useUserModule.useUser).mockReturnValue({
      isLoading: false,
      data: undefined,
    } as any);

    const { container } = render(<App />);

    expect(logoutModule.logoutAndRedirect).toHaveBeenCalled();
    expect(container.firstChild).toBeNull();
  });

  it('renders Router when useUser returns a valid user', () => {
    vi.mocked(useUserModule.useUser).mockReturnValue({
      isLoading: false,
      data: { email: 'test@example.com' },
    } as any);

    render(<App />);

    expect(screen.getByTestId('router')).toBeInTheDocument();
  });
});
