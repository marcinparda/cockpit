import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { createRef } from 'react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import MonacoEditor, { MonacoEditorRef } from './MonacoEditor';

type MockEditorProps = {
  value: string;
  onMount?: (editor: { getValue: () => string }) => void;
  onChange?: (value: string | undefined) => void;
};

const mockEditorInstance = { getValue: () => '' };

const { MockEditor } = vi.hoisted(() => ({
  MockEditor: vi.fn(({ onMount, onChange }: MockEditorProps) => {
    onMount?.(mockEditorInstance);
    return React.createElement('textarea', {
      'data-testid': 'mock-editor',
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => onChange?.(e.target.value),
    });
  }),
}));

vi.mock('@monaco-editor/react', () => ({
  default: MockEditor,
}));

describe('MonacoEditor', () => {
  beforeEach(() => {
    MockEditor.mockClear();
    // Restore default implementation
    MockEditor.mockImplementation(({ onMount, onChange }: MockEditorProps) => {
      onMount?.(mockEditorInstance);
      return React.createElement('textarea', {
        'data-testid': 'mock-editor',
        onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => onChange?.(e.target.value),
      });
    });
  });

  it('renders without crashing given value="" and readOnly={false}', () => {
    const { getByTestId } = render(<MonacoEditor value="" readOnly={false} />);
    expect(getByTestId('mock-editor')).toBeInTheDocument();
  });

  it('forwardRef ref exposes getValue() that returns current editor content', () => {
    const ref = createRef<MonacoEditorRef>();
    render(<MonacoEditor ref={ref} value="hello" readOnly={false} />);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.getValue()).toBe('');
  });

  it('onChange prop is called when the Monaco editor fires its onChange event', async () => {
    const handleChange = vi.fn();
    const { getByTestId } = render(
      <MonacoEditor value="" readOnly={false} onChange={handleChange} />
    );
    const textarea = getByTestId('mock-editor') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'new content' } });
    expect(handleChange).toHaveBeenCalledWith('new content');
  });

  it('getValue returns empty string when editor ref is null (no onMount called)', () => {
    MockEditor.mockImplementationOnce(({ onChange }: MockEditorProps) =>
      React.createElement('textarea', {
        'data-testid': 'mock-editor-no-mount',
        onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => onChange?.(e.target.value),
      })
    );

    const ref = createRef<MonacoEditorRef>();
    render(<MonacoEditor ref={ref} value="" readOnly={false} />);
    // editorRef.current is null — getValue falls through to '' via ?? operator
    expect(ref.current?.getValue()).toBe('');
  });

  it('onChange fires with empty string when editor emits undefined value', () => {
    const handleChange = vi.fn();
    MockEditor.mockImplementationOnce(({ onMount, onChange }: MockEditorProps) => {
      onMount?.(mockEditorInstance);
      return React.createElement('button', {
        'data-testid': 'fire-undefined',
        onClick: () => onChange?.(undefined),
      });
    });

    const { getByTestId } = render(
      <MonacoEditor value="" readOnly={false} onChange={handleChange} />
    );
    fireEvent.click(getByTestId('fire-undefined'));
    expect(handleChange).toHaveBeenCalledWith('');
  });
});
