import type { Meta, StoryObj } from '@storybook/react-vite';
import { BarChart, Home, List } from 'lucide-react';
import { MemoryRouter } from 'react-router-dom';
import { Button } from '../Button/Button';
import { AppShell } from './AppShell';

const meta = {
  component: AppShell,
  title: 'AppShell',
  parameters: { layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  args: {
    appName: 'Habits',
    navItems: [
      { to: '/', label: 'Today', icon: <Home className="h-5 w-5" /> },
      { to: '/habits', label: 'Habits', icon: <List className="h-5 w-5" /> },
      { to: '/stats', label: 'Stats', icon: <BarChart className="h-5 w-5" /> },
    ],
    userArea: <span className="text-sm">me@example.com</span>,
    children: <p className="p-4">Page content</p>,
  },
} satisfies Meta<typeof AppShell>;
export default meta;

type Story = StoryObj<typeof AppShell>;

export const Default: Story = {};
export const WithActions: Story = {
  args: { actions: <Button size="sm">New</Button> },
};
export const Mobile: Story = {
  globals: { viewport: { value: 'mobile1', isRotated: false } },
};
