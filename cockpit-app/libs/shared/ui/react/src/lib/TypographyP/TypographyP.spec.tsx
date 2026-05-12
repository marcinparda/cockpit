import { render, screen } from '@testing-library/react';
import { TypographyP } from './TypographyP';

describe('TypographyP', () => {
  it('renders children', () => {
    render(<TypographyP>Paragraph text</TypographyP>);
    expect(screen.getByText('Paragraph text')).toBeInTheDocument();
  });

  it('renders as p element', () => {
    render(<TypographyP>Content</TypographyP>);
    expect(screen.getByText('Content').tagName).toBe('P');
  });

  it('renders without children', () => {
    const { container } = render(<TypographyP />);
    expect(container.querySelector('p')).toBeInTheDocument();
  });
});
