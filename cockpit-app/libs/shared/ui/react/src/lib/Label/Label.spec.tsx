import { render, screen } from '@testing-library/react';
import { Label } from './Label';

describe('Label', () => {
  it('renders label text', () => {
    render(<Label>Email</Label>);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders as a label element', () => {
    render(<Label>Name</Label>);
    expect(screen.getByText('Name').tagName).toBe('LABEL');
  });

  it('supports htmlFor attribute', () => {
    render(<Label htmlFor="my-input">Username</Label>);
    expect(screen.getByText('Username')).toHaveAttribute('for', 'my-input');
  });
});
