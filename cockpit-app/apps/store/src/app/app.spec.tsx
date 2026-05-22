import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './app';

vi.mock('./features/store/pages/StoreBrowserPage/StoreBrowserPage', () => ({
  default: () => <div data-testid="store-page" />,
}));

describe('App', () => {
  it('should render without crashing', () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </MemoryRouter>
    );
  });
});
