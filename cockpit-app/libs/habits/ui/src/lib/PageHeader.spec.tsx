import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom';
import { PageHeader } from './PageHeader';

describe('PageHeader', () => {
  it('renders the title as the page heading', () => {
    render(<PageHeader title="Stats" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Stats' })).toBeInTheDocument();
  });

  it('renders description, leading content and actions', () => {
    render(
      <PageHeader
        title="Run"
        description="Health"
        leading={<span data-testid="icon" />}
        actions={<button type="button">Edit</button>}
      />,
    );
    expect(screen.getByText('Health')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
  });
});
