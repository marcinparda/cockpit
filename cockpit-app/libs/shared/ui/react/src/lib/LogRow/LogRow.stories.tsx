import type { Meta, StoryObj } from '@storybook/react-vite';
import { Star } from 'lucide-react';
import { LogRow } from './LogRow';

const meta = {
  component: LogRow,
  title: 'LogRow',
  args: {
    icon: <Star size={20} />,
    color: '#0ea5e9',
    title: 'Drink water',
    subtitle: '3/8',
    value: 'unset',
    onSelectDone: () => undefined,
    onSelectNotDone: () => undefined,
    onRowClick: () => undefined,
  },
} satisfies Meta<typeof LogRow>;
export default meta;

type Story = StoryObj<typeof LogRow>;

export const Unset: Story = {};
export const Done: Story = { args: { value: 'done' } };
export const NotDone: Story = { args: { value: 'notDone' } };
