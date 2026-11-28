import type { Meta, StoryObj } from '@storybook/react-vite';
import { Textarea } from './Textarea';

const meta = {
  component: Textarea,
  title: 'Textarea',
} satisfies Meta<typeof Textarea>;
export default meta;

type Story = StoryObj<typeof Textarea>;

export const Default: Story = { args: { placeholder: 'Write your diary entry...' } };
export const Disabled: Story = { args: { placeholder: 'Disabled', disabled: true } };
