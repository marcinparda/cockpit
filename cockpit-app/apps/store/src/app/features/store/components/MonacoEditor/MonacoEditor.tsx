import { forwardRef, useImperativeHandle, useRef } from 'react';
import Editor from '@monaco-editor/react';
import type * as monaco from 'monaco-editor';

interface MonacoEditorProps {
  value: string;
  readOnly: boolean;
  onChange?: (value: string) => void;
}

export type MonacoEditorRef = { getValue(): string };

const MonacoEditor = forwardRef<MonacoEditorRef, MonacoEditorProps>(
  function MonacoEditor(props, ref) {
    const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);

    useImperativeHandle(ref, () => ({
      getValue: () => editorRef.current?.getValue() ?? '',
    }));

    function handleMount(editor: monaco.editor.IStandaloneCodeEditor) {
      editorRef.current = editor;
    }

    return (
      <Editor
        value={props.value}
        language="json"
        theme="vs-dark"
        options={{
          readOnly: props.readOnly,
          minimap: { enabled: false },
          wordWrap: 'on',
        }}
        onMount={handleMount}
        onChange={(value) => props.onChange?.(value ?? '')}
      />
    );
  }
);

export default MonacoEditor;
