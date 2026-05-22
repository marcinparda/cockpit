import { useEffect, useRef, useState } from 'react';
import type { StoreEnvelope } from '../../api/schemas';
import { useCreateOrUpdateStoreEntry, useDeleteStoreEntry } from '../../api/hooks';
import MonacoEditor from '../MonacoEditor/MonacoEditor';
import type { MonacoEditorRef } from '../MonacoEditor/MonacoEditor';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@cockpit-app/shared-react-ui';
import { Badge } from '@cockpit-app/shared-react-ui';
import { Button } from '@cockpit-app/shared-react-ui';
import { Input } from '@cockpit-app/shared-react-ui';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@cockpit-app/shared-react-ui';

interface EntryPanelProps {
  visible: boolean;
  mode: 'view' | 'create';
  envelope: StoreEnvelope | null;
  currentPrefix?: string;
  currentCategory?: string;
  onClose: () => void;
  onSaved: (envelope: StoreEnvelope) => void;
  onDeleted: (key: string) => void;
}

const TYPE_OPTIONS = ['object', 'string', 'number', 'boolean', 'array', 'cv_section'];

export default function EntryPanel({
  visible,
  mode,
  envelope,
  currentPrefix,
  currentCategory,
  onClose,
  onSaved,
  onDeleted,
}: EntryPanelProps) {
  const editorRef = useRef<MonacoEditorRef>(null);

  // View/edit mode state
  const [editMode, setEditMode] = useState(false);
  const [editType, setEditType] = useState('object');
  const [editTags, setEditTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jsonValue, setJsonValue] = useState('{}');

  // Create mode state
  const [newPrefix, setNewPrefix] = useState(currentPrefix ?? '');
  const [newCategory, setNewCategory] = useState(currentCategory ?? '');
  const [newKey, setNewKey] = useState('');
  const [newType, setNewType] = useState('object');
  const [newTags, setNewTags] = useState('');
  const [newJson, setNewJson] = useState('{}');

  const { mutateAsync: createOrUpdate } = useCreateOrUpdateStoreEntry();
  const { mutateAsync: deleteEntry } = useDeleteStoreEntry();

  useEffect(() => {
    if (envelope) {
      const serialized =
        typeof envelope.data === 'string'
          ? envelope.data
          : JSON.stringify(envelope.data, null, 2);
      setJsonValue(serialized);
      setEditType(envelope.meta.type);
      setEditTags(envelope.meta.tags.join(', '));
      setEditMode(false);
      setError(null);
    }
  }, [envelope]);

  useEffect(() => {
    if (mode === 'create') {
      setNewPrefix(currentPrefix ?? '');
      setNewCategory(currentCategory ?? '');
      setNewKey('');
      setNewType('object');
      setNewTags('');
      setNewJson('{}');
    }
  }, [mode, currentPrefix, currentCategory]);

  function parseKeyParts(key: string): { prefix: string; category: string; keyName: string } {
    const parts = key.split(':');
    return {
      prefix: parts[0] ?? '',
      category: parts[1] ?? '',
      keyName: parts[2] ?? '',
    };
  }

  async function handleSave() {
    if (!envelope) return;

    const raw = editorRef.current?.getValue() ?? '{}';
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      setError('Invalid JSON');
      return;
    }

    const { prefix, category, keyName } = parseKeyParts(envelope.meta.key);
    const tags = editTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    setSaving(true);
    setError(null);
    try {
      const result = await createOrUpdate({
        prefix,
        category,
        key: keyName,
        body: { type: editType, tags, data: parsed },
      });
      onSaved(result);
      setEditMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleCreate() {
    if (!newPrefix.trim() || !newCategory.trim() || !newKey.trim()) {
      setError('Prefix, category, and key are required');
      return;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(newJson);
    } catch {
      setError('Invalid JSON');
      return;
    }

    const tags = newTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    setSaving(true);
    setError(null);
    try {
      const result = await createOrUpdate({
        prefix: newPrefix.trim(),
        category: newCategory.trim(),
        key: newKey.trim(),
        body: { type: newType, tags, data: parsed },
      });
      onSaved(result);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Create failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!envelope) return;
    const { prefix, category, keyName } = parseKeyParts(envelope.meta.key);
    try {
      await deleteEntry({ prefix, category, key: keyName });
      onDeleted(envelope.meta.key);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  if (!visible) return null;

  if (mode === 'create') {
    return (
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Create Entry</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            Close
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Input
          placeholder="Prefix"
          value={newPrefix}
          onChange={(e) => setNewPrefix(e.target.value)}
        />
        <Input
          placeholder="Category"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
        />
        <Input
          placeholder="Key"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
        />

        <Select value={newType} onValueChange={setNewType}>
          <SelectTrigger>
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Tags (comma-separated)"
          value={newTags}
          onChange={(e) => setNewTags(e.target.value)}
        />

        <div className="h-64">
          <MonacoEditor
            ref={editorRef}
            value={newJson}
            readOnly={false}
            onChange={setNewJson}
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleCreate} disabled={saving}>
            {saving ? 'Creating...' : 'Create'}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  // View mode
  if (!envelope) return null;

  const { prefix, category, keyName } = parseKeyParts(envelope.meta.key);

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{keyName}</h2>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
          Close
        </Button>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Type:</span>
        {editMode ? (
          <Select value={editType} onValueChange={setEditType}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TYPE_OPTIONS.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Badge>{editType}</Badge>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Tags:</span>
        {editMode ? (
          <Input
            value={editTags}
            onChange={(e) => setEditTags(e.target.value)}
            placeholder="Tags (comma-separated)"
          />
        ) : (
          envelope.meta.tags.map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))
        )}
      </div>

      <div className="h-64">
        <MonacoEditor
          ref={editorRef}
          value={jsonValue}
          readOnly={!editMode}
          onChange={setJsonValue}
        />
      </div>

      <div className="flex gap-2">
        {editMode ? (
          <>
            <Button onClick={handleSave} disabled={saving} aria-label="Save">
              {saving ? 'Saving...' : 'Save'}
            </Button>
            <Button variant="ghost" onClick={() => setEditMode(false)}>
              Cancel
            </Button>
          </>
        ) : (
          <Button onClick={() => setEditMode(true)} aria-label="Edit">
            Edit
          </Button>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" aria-label="Delete">
              Delete
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Entry</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {prefix}:{category}:{keyName}? This action cannot
                be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>Confirm</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
