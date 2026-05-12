import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { PersonalProjects } from './PersonalProjects';
import type { PersonalProject } from './PersonalProjects';

const project: PersonalProject = {
  name: 'My App',
  liveUrl: 'https://myapp.example.com',
  code: 'https://github.com/marcinparda/my-app',
  date: '2023',
  description: ['Built with React', 'Deployed on Raspberry Pi'],
};

describe('PersonalProjects', () => {
  it('renders the section title', () => {
    render(<PersonalProjects projects={[project]} />);
    expect(screen.getByText('PERSONAL PROJECTS')).toBeInTheDocument();
  });

  it('renders project name, live URL, and description', () => {
    render(<PersonalProjects projects={[project]} />);
    expect(screen.getByText('My App')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'https://myapp.example.com' })).toBeInTheDocument();
    expect(screen.getByText('Built with React')).toBeInTheDocument();
  });

  it('renders nothing when projects array is empty', () => {
    render(<PersonalProjects projects={[]} />);
    expect(screen.queryByRole('heading', { level: 4 })).not.toBeInTheDocument();
  });
});
