import { useState, useEffect } from 'react';
import { useUser } from '@cockpit-app/shared-react-data-access';
import { logout } from '@cockpit-app/common-shared-data-access';
import { Skeleton, toast, Toaster } from '@cockpit-app/shared-react-ui';
import { PermissionGuard } from '@cockpit-app/shared-react-feature';
import { getStoreEntry } from '../../api/api';
import type { StoreEnvelope } from '../../api/schemas';
import KeyList from '../../components/KeyList/KeyList';
import EntryPanel from '../../components/EntryPanel/EntryPanel';

function AppSkeleton() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Skeleton className="h-8 w-48" />
    </div>
  );
}

export default function StoreBrowserPage() {
  const { isLoading, data: userInfo } = useUser();

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [panelVisible, setPanelVisible] = useState(false);
  const [panelMode, setPanelMode] = useState<'view' | 'create'>('view');
  const [currentEnvelope, setCurrentEnvelope] = useState<StoreEnvelope | null>(null);
  const [currentPrefix, setCurrentPrefix] = useState<string | undefined>(undefined);
  const [currentCategory, setCurrentCategory] = useState<string | undefined>(undefined);
  const [deletedKey, setDeletedKey] = useState<string | null>(null);
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  useEffect(() => {
    if (deletedKey) {
      const t = setTimeout(() => setDeletedKey(null), 0);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [deletedKey]);

  useEffect(() => {
    if (createdKey) {
      const t = setTimeout(() => setCreatedKey(null), 0);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [createdKey]);

  if (isLoading) return <AppSkeleton />;
  if (!userInfo) {
    logout();
    return <AppSkeleton />;
  }

  async function onKeySelected(key: string) {
    const [prefix, category, keyName] = key.split(':');
    setSelectedKey(key);
    const envelope = await getStoreEntry(prefix, category, keyName);
    setCurrentEnvelope(envelope);
    setPanelMode('view');
    setPanelVisible(true);
  }

  function onCreate(ctx?: { prefix: string; category: string }) {
    setPanelMode('create');
    setCurrentPrefix(ctx?.prefix);
    setCurrentCategory(ctx?.category);
    setPanelVisible(true);
    setCurrentEnvelope(null);
  }

  function onSaved(envelope: StoreEnvelope) {
    toast.success('Saved');
    setCreatedKey(envelope.meta.key);
  }

  function onDeleted(key: string) {
    toast.success('Deleted');
    setDeletedKey(key);
    setSelectedKey(null);
    setPanelVisible(false);
  }

  function onClose() {
    setPanelVisible(false);
  }

  return (
    <>
      <Toaster richColors />
      <PermissionGuard feature="redis_store" action="read">
        <div className="flex h-screen overflow-hidden">
          <div className="w-72 overflow-y-auto border-r">
            <KeyList
              selectedKey={selectedKey}
              deletedKey={deletedKey}
              createdKey={createdKey}
              onKeySelected={onKeySelected}
              onCreate={onCreate}
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {panelVisible && (
              <EntryPanel
                visible={panelVisible}
                mode={panelMode}
                envelope={currentEnvelope}
                currentPrefix={currentPrefix}
                currentCategory={currentCategory}
                onClose={onClose}
                onSaved={onSaved}
                onDeleted={onDeleted}
              />
            )}
          </div>
        </div>
      </PermissionGuard>
    </>
  );
}
