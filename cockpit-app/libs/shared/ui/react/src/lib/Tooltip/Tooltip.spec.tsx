import { render, screen } from '@testing-library/react';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from './Tooltip';

describe('Tooltip', () => {
  it('renders trigger content', () => {
    render(
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger>Hover me</TooltipTrigger>
          <TooltipContent>Tooltip text</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    expect(screen.getByText('Hover me')).toBeInTheDocument();
  });

  it('TooltipProvider renders without crashing', () => {
    const { container } = render(<TooltipProvider><div>child</div></TooltipProvider>);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('TooltipContent applies className', () => {
    render(
      <TooltipProvider>
        <Tooltip defaultOpen>
          <TooltipTrigger>Trigger</TooltipTrigger>
          <TooltipContent className="custom-tooltip">Info</TooltipContent>
        </Tooltip>
      </TooltipProvider>,
    );
    const elements = screen.getAllByText('Info');
    const visibleEl = elements.find((el) => el.tagName !== 'SPAN' || !el.id.startsWith('radix'));
    expect(visibleEl).toHaveClass('custom-tooltip');
  });
});
