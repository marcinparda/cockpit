import type { Meta, StoryObj } from '@storybook/react-vite';
import { TypographyH1 } from './TypographyH1';

const meta = {
  component: TypographyH1,
  title: 'TypographyH1',
} satisfies Meta<typeof TypographyH1>;
export default meta;

type Story = StoryObj<typeof TypographyH1>;

export const Default: Story = { args: { children: 'Heading 1' } };
