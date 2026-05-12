import type { Preview } from '@storybook/react';
import { TooltipProvider } from '../src/lib/Tooltip/Tooltip';
import '../src/styles/global.css';

const preview: Preview = {
  decorators: [(Story) => <TooltipProvider><Story /></TooltipProvider>],
};

export default preview;
