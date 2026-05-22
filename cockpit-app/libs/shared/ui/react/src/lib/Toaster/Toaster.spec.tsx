import { render } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('sonner', () => {
  const React = require('react');
  const toast = Object.assign(
    vi.fn(),
    {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
      info: vi.fn(),
      loading: vi.fn(),
      dismiss: vi.fn(),
      custom: vi.fn(),
      promise: vi.fn(),
    }
  );
  const Toaster = ({ richColors }: { richColors?: boolean }) => (
    <div data-testid="sonner-toaster" data-rich-colors={richColors ? 'true' : 'false'} />
  );
  return { Toaster, toast };
});

describe('Toaster', () => {
  it('Toaster component renders without crashing', async () => {
    const { Toaster } = await import('./Toaster');
    const { container } = render(<Toaster />);
    expect(container).toBeTruthy();
  });

  it('toast.success call does not throw', async () => {
    const { toast } = await import('./Toaster');
    expect(() => toast.success('msg')).not.toThrow();
  });

  it('re-export: toast imported from the Toaster module equals sonner toast', async () => {
    const { toast: toasterToast } = await import('./Toaster');
    const { toast: sonnerToast } = await import('sonner');
    expect(toasterToast).toBe(sonnerToast);
  });
});
