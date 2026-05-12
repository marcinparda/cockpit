import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from './Card';

describe('Card components', () => {
  it('Card renders children', () => {
    render(<Card>card body</Card>);
    expect(screen.getByText('card body')).toBeInTheDocument();
  });

  it('CardHeader renders children', () => {
    render(<CardHeader>header</CardHeader>);
    expect(screen.getByText('header')).toBeInTheDocument();
  });

  it('CardTitle renders children', () => {
    render(<CardTitle>My Title</CardTitle>);
    expect(screen.getByText('My Title')).toBeInTheDocument();
  });

  it('CardContent renders children', () => {
    render(<CardContent>content</CardContent>);
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('CardFooter renders children', () => {
    render(<CardFooter>footer</CardFooter>);
    expect(screen.getByText('footer')).toBeInTheDocument();
  });
});
