import type { Meta, StoryObj } from '@storybook/react-vite';
import { TypographySmall } from './TypographySmall';

const meta = {
  component: TypographySmall,
  title: 'TypographySmall',
} satisfies Meta<typeof TypographySmall>;
export default meta;

type Story = StoryObj<typeof TypographySmall>;

export const Default: Story = { args: { children: 'Small text' } };
