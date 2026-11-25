import { act, render, screen } from '@testing-library/react';
import { Toaster, toast } from './Toaster';

describe('Toaster (real sonner)', () => {
  it('renders a shown toast with rich colours enabled', async () => {
    render(<Toaster />);

    act(() => {
      toast.success('Saved');
    });

    const message = await screen.findByText('Saved');
    expect(message.closest('[data-sonner-toast]')?.getAttribute('data-rich-colors')).toBe('true');
  });
});
