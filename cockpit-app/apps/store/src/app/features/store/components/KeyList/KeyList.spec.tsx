import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import KeyList from './KeyList';

vi.mock('../../api/api', () => ({
  getStorePrefixes: vi.fn(),
  getStoreCategories: vi.fn(),
  getStoreKeys: vi.fn(),
}));

import { getStorePrefixes, getStoreCategories, getStoreKeys } from '../../api/api';

const mockGetStorePrefixes = getStorePrefixes as ReturnType<typeof vi.fn>;
const mockGetStoreCategories = getStoreCategories as ReturnType<typeof vi.fn>;
const mockGetStoreKeys = getStoreKeys as ReturnType<typeof vi.fn>;

function defaultProps() {
  return {
    selectedKey: null,
    deletedKey: null,
    createdKey: null,
    onKeySelected: vi.fn(),
    onCreate: vi.fn(),
  };
}

describe('KeyList', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders prefix list returned by mocked getStorePrefixes', async () => {
    mockGetStorePrefixes.mockResolvedValue(['alpha', 'beta']);

    render(<KeyList {...defaultProps()} />);

    await waitFor(() => {
      expect(screen.getByText('alpha')).toBeInTheDocument();
      expect(screen.getByText('beta')).toBeInTheDocument();
    });
  });

  it('shows Skeleton while prefixes are loading', async () => {
    mockGetStorePrefixes.mockReturnValue(new Promise(() => {}));

    render(<KeyList {...defaultProps()} />);

    await waitFor(() => {
      expect(document.querySelector('[data-slot="skeleton"]')).toBeInTheDocument();
    });
  });

  it('expands a prefix and shows categories after clicking its row', async () => {
    mockGetStorePrefixes.mockResolvedValue(['myprefix']);
    mockGetStoreCategories.mockResolvedValue(['catA', 'catB']);

    render(<KeyList {...defaultProps()} />);

    await waitFor(() => {
      expect(screen.getByText('myprefix')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('myprefix'));
    });

    await waitFor(() => {
      expect(screen.getByText('catA')).toBeInTheDocument();
      expect(screen.getByText('catB')).toBeInTheDocument();
    });

    expect(mockGetStoreCategories).toHaveBeenCalledWith('myprefix');
  });

  it('expands a category and shows keys after clicking its row', async () => {
    mockGetStorePrefixes.mockResolvedValue(['myprefix']);
    mockGetStoreCategories.mockResolvedValue(['catA']);
    mockGetStoreKeys.mockResolvedValue(['myprefix:catA:key1', 'myprefix:catA:key2']);

    render(<KeyList {...defaultProps()} />);

    await waitFor(() => {
      expect(screen.getByText('myprefix')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('myprefix'));
    });

    await waitFor(() => {
      expect(screen.getByText('catA')).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByText('catA'));
    });

    await waitFor(() => {
      expect(screen.getByText('key1')).toBeInTheDocument();
      expect(screen.getByText('key2')).toBeInTheDocument();
    });

    expect(mockGetStoreKeys).toHaveBeenCalledWith('myprefix', 'catA');
  });

  it('calls onKeySelected with the key string when a key row is clicked', async () => {
    const onKeySelected = vi.fn();
    mockGetStorePrefixes.mockResolvedValue(['myprefix']);
    mockGetStoreCategories.mockResolvedValue(['catA']);
    mockGetStoreKeys.mockResolvedValue(['myprefix:catA:key1']);

    render(<KeyList {...defaultProps()} onKeySelected={onKeySelected} />);

    await waitFor(() => expect(screen.getByText('myprefix')).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByText('myprefix'));
    });

    await waitFor(() => expect(screen.getByText('catA')).toBeInTheDocument());

    await act(async () => {
      fireEvent.click(screen.getByText('catA'));
    });

    await waitFor(() => expect(screen.getByText('key1')).toBeInTheDocument());

    fireEvent.click(screen.getByText('key1'));

    expect(onKeySelected).toHaveBeenCalledWith('myprefix:catA:key1');
  });

  it('inline add prefix: Plus button shows input row; typing a name and pressing Enter adds a new prefix node', async () => {
    mockGetStorePrefixes.mockResolvedValue(['existing']);

    render(<KeyList {...defaultProps()} />);

    await waitFor(() => expect(screen.getByText('existing')).toBeInTheDocument());

    const plusButton = screen.getByTestId('add-prefix-button');
    fireEvent.click(plusButton);

    const input = screen.getByTestId('new-prefix-input');
    expect(input).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(input, { target: { value: 'newprefix' } });
      fireEvent.keyDown(input, { key: 'Enter' });
    });

    await waitFor(() => {
      expect(screen.getByText('newprefix')).toBeInTheDocument();
    });
  });

  it('deletedKey: key disappears from expanded category when deletedKey prop is set', async () => {
    mockGetStorePrefixes.mockResolvedValue(['myprefix']);
    mockGetStoreCategories.mockResolvedValue(['catA']);
    mockGetStoreKeys.mockResolvedValue(['myprefix:catA:key1', 'myprefix:catA:key2']);

    const { rerender } = render(<KeyList {...defaultProps()} />);

    await waitFor(() => expect(screen.getByText('myprefix')).toBeInTheDocument());

    await act(async () => { fireEvent.click(screen.getByText('myprefix')); });
    await waitFor(() => expect(screen.getByText('catA')).toBeInTheDocument());
    await act(async () => { fireEvent.click(screen.getByText('catA')); });
    await waitFor(() => expect(screen.getByText('key1')).toBeInTheDocument());

    // Now pass deletedKey to remove key1
    await act(async () => {
      rerender(<KeyList {...defaultProps()} deletedKey="myprefix:catA:key1" />);
    });

    await waitFor(() => {
      expect(screen.queryByText('key1')).not.toBeInTheDocument();
      expect(screen.getByText('key2')).toBeInTheDocument();
    });
  });

  it('createdKey: key is added to expanded category node when createdKey prop is set', async () => {
    mockGetStorePrefixes.mockResolvedValue(['myprefix']);
    mockGetStoreCategories.mockResolvedValue(['catA']);
    mockGetStoreKeys.mockResolvedValue(['myprefix:catA:key1']);

    const { rerender } = render(<KeyList {...defaultProps()} />);

    await waitFor(() => expect(screen.getByText('myprefix')).toBeInTheDocument());

    await act(async () => { fireEvent.click(screen.getByText('myprefix')); });
    await waitFor(() => expect(screen.getByText('catA')).toBeInTheDocument());
    await act(async () => { fireEvent.click(screen.getByText('catA')); });
    await waitFor(() => expect(screen.getByText('key1')).toBeInTheDocument());

    // Pass createdKey to add newkey into expanded catA
    await act(async () => {
      rerender(<KeyList {...defaultProps()} createdKey="myprefix:catA:newkey" />);
    });

    await waitFor(() => {
      expect(screen.getByText('newkey')).toBeInTheDocument();
    });
  });
});
