import type { Meta, StoryObj } from '@storybook/react-vite';
import { ThemeToggle } from './ThemeToggle';

const meta = {
  component: ThemeToggle,
  title: 'ThemeToggle',
} satisfies Meta<typeof ThemeToggle>;
export default meta;

type Story = StoryObj<typeof ThemeToggle>;

export const Default: Story = {};
