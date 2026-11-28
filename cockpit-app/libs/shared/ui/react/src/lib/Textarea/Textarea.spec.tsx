import { render, screen } from '@testing-library/react';
import { Textarea } from './Textarea';

describe('Textarea', () => {
  it('renders a multi-line textbox', () => {
    render(<Textarea aria-label="Notes" />);
    const el = screen.getByRole('textbox', { name: 'Notes' });
    expect(el.tagName).toBe('TEXTAREA');
  });

  it('renders with placeholder', () => {
    render(<Textarea placeholder="Write..." />);
    expect(screen.getByPlaceholderText('Write...')).toBeInTheDocument();
  });

  it('renders as disabled when disabled prop is set', () => {
    render(<Textarea disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });

  it('applies additional className', () => {
    render(<Textarea className="custom" />);
    expect(screen.getByRole('textbox')).toHaveClass('custom');
  });
});
