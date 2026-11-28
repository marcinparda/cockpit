import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '../Button/Button';
import { Input } from '../Input/Input';
import { Label } from '../Label/Label';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './Sheet';

const meta = {
  component: SheetContent,
  title: 'Sheet',
} satisfies Meta<typeof SheetContent>;
export default meta;

type Story = StoryObj<typeof SheetContent>;

export const Bottom: Story = {
  render: (args) => (
    <Sheet>
      <SheetTrigger asChild>
        <Button>Open sheet</Button>
      </SheetTrigger>
      <SheetContent {...args} className="h-[50vh] p-6">
        <SheetHeader>
          <SheetTitle>Add Habit</SheetTitle>
          <SheetDescription>Bottom sheet used on phones.</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-2">
          <Label htmlFor="sheet-name">Name</Label>
          <Input id="sheet-name" placeholder="e.g. Morning run" />
        </div>
        <SheetFooter>
          <Button>Save</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  ),
  args: { side: 'bottom' },
};

export const Right: Story = {
  ...Bottom,
  args: { side: 'right' },
};
