import { render, screen } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders children text', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders as span by default', () => {
    render(<Badge>Label</Badge>);
    expect(screen.getByText('Label').tagName).toBe('SPAN');
  });

  it('applies additional className', () => {
    render(<Badge className="custom-class">Test</Badge>);
    expect(screen.getByText('Test')).toHaveClass('custom-class');
  });

  it('renders with secondary variant', () => {
    render(<Badge variant="secondary">Secondary</Badge>);
    expect(screen.getByText('Secondary')).toBeInTheDocument();
  });
});
