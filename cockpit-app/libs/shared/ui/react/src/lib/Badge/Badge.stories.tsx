import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';

const meta = {
  component: Badge,
  title: 'Badge',
} satisfies Meta<typeof Badge>;
export default meta;

type Story = StoryObj<typeof Badge>;

export const Default: Story = { args: { children: 'Badge' } };
