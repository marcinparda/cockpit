import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from './Sheet';

function renderSheet(
  onOpenChange = vi.fn(),
  contentProps: Partial<React.ComponentProps<typeof SheetContent>> = {},
) {
  render(
    <Sheet open onOpenChange={onOpenChange}>
      <SheetContent {...contentProps}>
        <SheetHeader>
          <SheetTitle>Add Habit</SheetTitle>
        </SheetHeader>
        <p>Body</p>
        <SheetFooter>
          <SheetClose>Done</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>,
  );
  return onOpenChange;
}

describe('Sheet', () => {
  it('renders an open dialog named by its title', () => {
    renderSheet();
    expect(screen.getByRole('dialog', { name: 'Add Habit' })).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('prefers an explicit aria-label over the title for the accessible name', () => {
    renderSheet(vi.fn(), { 'aria-label': 'Check in for Run' });
    expect(
      screen.getByRole('dialog', { name: 'Check in for Run' }),
    ).toBeInTheDocument();
  });

  it('renders a Close button in the corner by default', async () => {
    const onOpenChange = renderSheet();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('can hide the corner Close button', () => {
    renderSheet(vi.fn(), { showClose: false });
    expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    const onOpenChange = renderSheet();
    await userEvent.keyboard('{Escape}');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('closes when the overlay is pressed', async () => {
    const onOpenChange = renderSheet();
    const overlay = document.querySelector('[data-slot="sheet-overlay"]');
    expect(overlay).not.toBeNull();
    // Radix attaches its outside-pointer listener on the next tick
    await new Promise((resolve) => setTimeout(resolve, 0));
    fireEvent.pointerDown(overlay as Element);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('slides from the bottom by default and accepts other sides', () => {
    const { unmount } = render(
      <Sheet open>
        <SheetContent>
          <SheetTitle>t</SheetTitle>
        </SheetContent>
      </Sheet>,
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('data-side', 'bottom');
    unmount();
    render(
      <Sheet open>
        <SheetContent side="right">
          <SheetTitle>t</SheetTitle>
        </SheetContent>
      </Sheet>,
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('data-side', 'right');
  });

  it('renders nothing when closed', () => {
    render(
      <Sheet open={false}>
        <SheetContent>
          <SheetTitle>Hidden</SheetTitle>
        </SheetContent>
      </Sheet>,
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
