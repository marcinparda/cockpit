import type { Meta, StoryObj } from '@storybook/react-vite';
import { Input } from './Input';

const meta = {
  component: Input,
  title: 'Input',
} satisfies Meta<typeof Input>;
export default meta;

type Story = StoryObj<typeof Input>;

export const Default: Story = { args: { placeholder: 'Type here...' } };
export const Disabled: Story = { args: { placeholder: 'Disabled', disabled: true } };
