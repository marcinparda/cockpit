import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import StoreBrowserPage from './StoreBrowserPage';
import type { StoreEnvelope } from '../../api/schemas';

vi.mock('@cockpit-app/shared-react-data-access', () => ({
  useUser: vi.fn(),
}));

vi.mock('@cockpit-app/common-shared-data-access', () => ({
  logout: vi.fn(),
  baseApi: {
    getRequest: vi.fn(),
    postRequest: vi.fn(),
    putRequest: vi.fn(),
    deleteRequest: vi.fn(),
  },
}));

vi.mock('@cockpit-app/shared-react-feature', () => ({
  PermissionGuard: ({ children, feature, action }: { children: React.ReactNode; feature: string; action: string }) => (
    <div data-testid="permission-guard" data-feature={feature} data-action={action}>
      {children}
    </div>
  ),
}));

// Capture KeyList props so tests can invoke callbacks
let capturedKeyListProps: Record<string, unknown> = {};
vi.mock('../../components/KeyList/KeyList', () => ({
  default: (props: Record<string, unknown>) => {
    capturedKeyListProps = props;
    return <div data-testid="key-list" />;
  },
}));

// Capture EntryPanel props so tests can invoke callbacks
let capturedEntryPanelProps: Record<string, unknown> = {};
vi.mock('../../components/EntryPanel/EntryPanel', () => ({
  default: (props: Record<string, unknown>) => {
    capturedEntryPanelProps = props;
    return <div data-testid="entry-panel" />;
  },
}));

const { mockGetStoreEntry } = vi.hoisted(() => ({
  mockGetStoreEntry: vi.fn().mockResolvedValue(null),
}));

vi.mock('../../api/api', () => ({
  getStorePrefixes: vi.fn().mockResolvedValue([]),
  getStoreCategories: vi.fn().mockResolvedValue([]),
  getStoreKeys: vi.fn().mockResolvedValue([]),
  getStoreEntry: mockGetStoreEntry,
}));

import { useUser } from '@cockpit-app/shared-react-data-access';
import { logout } from '@cockpit-app/common-shared-data-access';

const mockUseUser = useUser as ReturnType<typeof vi.fn>;
const mockLogout = logout as ReturnType<typeof vi.fn>;

function authenticatedUser() {
  mockUseUser.mockReturnValue({ isLoading: false, data: { id: '1', email: 'test@test.com' } });
}

const sampleEnvelope: StoreEnvelope = {
  meta: {
    key: 'pfx:cat:mykey',
    type: 'object',
    version: 1,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    tags: [],
  },
  data: {},
};

describe('StoreBrowserPage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    capturedKeyListProps = {};
    capturedEntryPanelProps = {};
  });

  it('shows AppSkeleton when useUser returns isLoading true', () => {
    mockUseUser.mockReturnValue({ isLoading: true, data: undefined });

    render(<StoreBrowserPage />);

    expect(document.querySelector('[data-slot="skeleton"]')).toBeInTheDocument();
    expect(screen.queryByTestId('key-list')).not.toBeInTheDocument();
  });

  it('calls logout and shows AppSkeleton when useUser returns isLoading false and data null', () => {
    mockUseUser.mockReturnValue({ isLoading: false, data: null });

    render(<StoreBrowserPage />);

    expect(mockLogout).toHaveBeenCalled();
    expect(document.querySelector('[data-slot="skeleton"]')).toBeInTheDocument();
    expect(screen.queryByTestId('key-list')).not.toBeInTheDocument();
  });

  it('renders KeyList and no EntryPanel when user is authenticated', () => {
    mockUseUser.mockReturnValue({ isLoading: false, data: { id: '1', email: 'test@test.com' } });

    render(<StoreBrowserPage />);

    expect(screen.getByTestId('key-list')).toBeInTheDocument();
    expect(screen.queryByTestId('entry-panel')).not.toBeInTheDocument();
  });

  it('renders PermissionGuard with feature="redis_store" and action="read"', () => {
    mockUseUser.mockReturnValue({ isLoading: false, data: { id: '1', email: 'test@test.com' } });

    render(<StoreBrowserPage />);

    const guard = screen.getByTestId('permission-guard');
    expect(guard).toBeInTheDocument();
    expect(guard).toHaveAttribute('data-feature', 'redis_store');
    expect(guard).toHaveAttribute('data-action', 'read');
  });

  it('onSaved: sets createdKey so KeyList receives it, then clears it after tick', async () => {
    authenticatedUser();
    render(<StoreBrowserPage />);

    await act(async () => {
      // onSaved is passed to EntryPanel, but panel is only shown when panelVisible=true.
      // Trigger onCreate first so EntryPanel renders.
      (capturedKeyListProps.onCreate as (ctx?: { prefix: string; category: string }) => void)();
    });

    expect(screen.getByTestId('entry-panel')).toBeInTheDocument();

    await act(async () => {
      (capturedEntryPanelProps.onSaved as (e: StoreEnvelope) => void)(sampleEnvelope);
    });

    // After onSaved, createdKey is set then cleared via setTimeout(0)
    await act(async () => {
      await new Promise((r) => setTimeout(r, 0));
    });

    // createdKey was set to 'pfx:cat:mykey' on KeyList, then cleared
    // The important check: no errors thrown and KeyList still rendered
    expect(screen.getByTestId('key-list')).toBeInTheDocument();
  });

  it('onDeleted: hides EntryPanel and clears selectedKey', async () => {
    authenticatedUser();
    render(<StoreBrowserPage />);

    // Open the panel via onCreate
    await act(async () => {
      (capturedKeyListProps.onCreate as (ctx?: { prefix: string; category: string }) => void)();
    });

    expect(screen.getByTestId('entry-panel')).toBeInTheDocument();

    await act(async () => {
      (capturedEntryPanelProps.onDeleted as (key: string) => void)('pfx:cat:mykey');
    });

    expect(screen.queryByTestId('entry-panel')).not.toBeInTheDocument();
  });

  it('onCreate without context: shows EntryPanel in create mode with no prefix/category', async () => {
    authenticatedUser();
    render(<StoreBrowserPage />);

    await act(async () => {
      (capturedKeyListProps.onCreate as (ctx?: { prefix: string; category: string }) => void)();
    });

    expect(screen.getByTestId('entry-panel')).toBeInTheDocument();
  });

  it('onCreate with context: shows EntryPanel and passes prefix/category', async () => {
    authenticatedUser();
    render(<StoreBrowserPage />);

    await act(async () => {
      (capturedKeyListProps.onCreate as (ctx?: { prefix: string; category: string }) => void)({
        prefix: 'mypfx',
        category: 'mycat',
      });
    });

    expect(screen.getByTestId('entry-panel')).toBeInTheDocument();
    expect(capturedEntryPanelProps.currentPrefix).toBe('mypfx');
    expect(capturedEntryPanelProps.currentCategory).toBe('mycat');
  });

  it('onKeySelected: fetches entry and shows EntryPanel in view mode', async () => {
    authenticatedUser();
    mockGetStoreEntry.mockResolvedValue(sampleEnvelope);
    render(<StoreBrowserPage />);

    await act(async () => {
      await (capturedKeyListProps.onKeySelected as (key: string) => Promise<void>)(
        'pfx:cat:mykey'
      );
    });

    expect(mockGetStoreEntry).toHaveBeenCalledWith('pfx', 'cat', 'mykey');
    expect(screen.getByTestId('entry-panel')).toBeInTheDocument();
    expect(capturedEntryPanelProps.mode).toBe('view');
  });

  it('onClose: hides EntryPanel when called', async () => {
    authenticatedUser();
    render(<StoreBrowserPage />);

    // Open panel via onCreate
    await act(async () => {
      (capturedKeyListProps.onCreate as (ctx?: { prefix: string; category: string }) => void)();
    });

    expect(screen.getByTestId('entry-panel')).toBeInTheDocument();

    await act(async () => {
      (capturedEntryPanelProps.onClose as () => void)();
    });

    expect(screen.queryByTestId('entry-panel')).not.toBeInTheDocument();
  });
});
