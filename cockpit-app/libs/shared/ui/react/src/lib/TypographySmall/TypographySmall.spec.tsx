import { render, screen } from '@testing-library/react';
import { TypographySmall } from './TypographySmall';

describe('TypographySmall', () => {
  it('renders children', () => {
    render(<TypographySmall>Small text</TypographySmall>);
    expect(screen.getByText('Small text')).toBeInTheDocument();
  });

  it('renders as small element', () => {
    render(<TypographySmall>Content</TypographySmall>);
    expect(screen.getByText('Content').tagName).toBe('SMALL');
  });

  it('renders without children', () => {
    const { container } = render(<TypographySmall />);
    expect(container.querySelector('small')).toBeInTheDocument();
  });
});
