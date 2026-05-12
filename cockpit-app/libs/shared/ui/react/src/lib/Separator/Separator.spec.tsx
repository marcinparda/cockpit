import { render } from '@testing-library/react';
import { Separator } from './Separator';

describe('Separator', () => {
  it('renders without crashing', () => {
    const { container } = render(<Separator />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renders horizontal orientation by default', () => {
    const { container } = render(<Separator />);
    expect(container.firstChild).toHaveAttribute(
      'data-orientation',
      'horizontal',
    );
  });

  it('renders vertical orientation when specified', () => {
    const { container } = render(<Separator orientation="vertical" />);
    expect(container.firstChild).toHaveAttribute(
      'data-orientation',
      'vertical',
    );
  });
});
