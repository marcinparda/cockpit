import { render, screen } from '@testing-library/react';
import { TypographyH1 } from './TypographyH1';

describe('TypographyH1', () => {
  it('renders children', () => {
    render(<TypographyH1>Hello</TypographyH1>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders as h1 element', () => {
    render(<TypographyH1>Title</TypographyH1>);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders without children', () => {
    const { container } = render(<TypographyH1 />);
    expect(container.querySelector('h1')).toBeInTheDocument();
  });
});
