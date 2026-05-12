import type { Meta, StoryObj } from '@storybook/react-vite';
import { TypographyP } from './TypographyP';

const meta = {
  component: TypographyP,
  title: 'TypographyP',
} satisfies Meta<typeof TypographyP>;
export default meta;

type Story = StoryObj<typeof TypographyP>;

export const Default: Story = { args: { children: 'Paragraph text content.' } };
