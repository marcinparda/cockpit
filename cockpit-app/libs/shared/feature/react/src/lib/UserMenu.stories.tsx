import type { Meta, StoryObj } from '@storybook/react-vite';
import { UserMenu } from './UserMenu';

const meta = {
  component: UserMenu,
  title: 'UserMenu',
  args: { user: { email: 'me@example.com' } },
} satisfies Meta<typeof UserMenu>;
export default meta;

type Story = StoryObj<typeof UserMenu>;

export const Default: Story = {};
