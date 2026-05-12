import type { Meta, StoryObj } from '@storybook/react-vite';
import { Separator } from './Separator';

const meta = {
  component: Separator,
  title: 'Separator',
} satisfies Meta<typeof Separator>;
export default meta;

type Story = StoryObj<typeof Separator>;

export const Default: Story = { args: {} };
