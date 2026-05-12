import type { Meta, StoryObj } from '@storybook/react-vite';
import { Label } from './Label';

const meta = {
  component: Label,
  title: 'Label',
} satisfies Meta<typeof Label>;
export default meta;

type Story = StoryObj<typeof Label>;

export const Default: Story = { args: { children: 'Label text' } };
