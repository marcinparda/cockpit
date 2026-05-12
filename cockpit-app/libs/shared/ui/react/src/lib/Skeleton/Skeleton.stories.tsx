import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from './Skeleton';

const meta = {
  component: Skeleton,
  title: 'Skeleton',
} satisfies Meta<typeof Skeleton>;
export default meta;

type Story = StoryObj<typeof Skeleton>;

export const Default: Story = { args: { className: 'h-4 w-48' } };
