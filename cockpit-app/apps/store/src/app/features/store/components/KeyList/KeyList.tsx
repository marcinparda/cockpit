import { useReducer, useEffect, useRef } from 'react';
import { Server, Folder, Key, ChevronRight, ChevronDown, Plus } from 'lucide-react';
import { Skeleton, Separator, Input } from '@cockpit-app/shared-react-ui';
import { getStorePrefixes, getStoreCategories, getStoreKeys } from '../../api/api';

interface KeyListProps {
  selectedKey: string | null;
  deletedKey: string | null;
  createdKey: string | null;
  onKeySelected: (key: string) => void;
  onCreate: (ctx?: { prefix: string; category: string }) => void;
}

interface CategoryNode {
  name: string;
  keys: string[];
  expanded: boolean;
  loading: boolean;
}

interface PrefixNode {
  name: string;
  categories: CategoryNode[];
  expanded: boolean;
  loading: boolean;
  addingCategory: boolean;
  newCategoryInput: string;
}

interface TreeState {
  prefixNodes: PrefixNode[];
  loadingPrefixes: boolean;
  addingPrefix: boolean;
  newPrefixInput: string;
}

type TreeAction =
  | { type: 'SET_LOADING_PREFIXES'; loading: boolean }
  | { type: 'SET_PREFIXES'; prefixes: string[] }
  | { type: 'TOGGLE_PREFIX'; prefix: string }
  | { type: 'SET_CATEGORIES'; prefix: string; categories: string[] }
  | { type: 'TOGGLE_CATEGORY'; prefix: string; category: string }
  | { type: 'SET_KEYS'; prefix: string; category: string; keys: string[] }
  | { type: 'START_ADD_PREFIX' }
  | { type: 'CONFIRM_ADD_PREFIX'; name: string }
  | { type: 'CANCEL_ADD_PREFIX' }
  | { type: 'SET_NEW_PREFIX_INPUT'; value: string }
  | { type: 'START_ADD_CATEGORY'; prefix: string }
  | { type: 'CONFIRM_ADD_CATEGORY'; prefix: string; name: string }
  | { type: 'CANCEL_ADD_CATEGORY'; prefix: string }
  | { type: 'SET_NEW_CATEGORY_INPUT'; prefix: string; value: string }
  | { type: 'REMOVE_KEY'; key: string }
  | { type: 'ADD_KEY'; key: string };

const initialState: TreeState = {
  prefixNodes: [],
  loadingPrefixes: true,
  addingPrefix: false,
  newPrefixInput: '',
};

function treeReducer(state: TreeState, action: TreeAction): TreeState {
  switch (action.type) {
    case 'SET_LOADING_PREFIXES':
      return { ...state, loadingPrefixes: action.loading };

    case 'SET_PREFIXES':
      return {
        ...state,
        loadingPrefixes: false,
        prefixNodes: action.prefixes.map((name) => ({
          name,
          categories: [],
          expanded: false,
          loading: false,
          addingCategory: false,
          newCategoryInput: '',
        })),
      };

    case 'TOGGLE_PREFIX':
      return {
        ...state,
        prefixNodes: state.prefixNodes.map((p) =>
          p.name === action.prefix
            ? { ...p, expanded: !p.expanded, loading: !p.expanded && p.categories.length === 0 }
            : p,
        ),
      };

    case 'SET_CATEGORIES':
      return {
        ...state,
        prefixNodes: state.prefixNodes.map((p) =>
          p.name === action.prefix
            ? {
                ...p,
                loading: false,
                categories: action.categories.map((name) => ({
                  name,
                  keys: [],
                  expanded: false,
                  loading: false,
                })),
              }
            : p,
        ),
      };

    case 'TOGGLE_CATEGORY':
      return {
        ...state,
        prefixNodes: state.prefixNodes.map((p) =>
          p.name === action.prefix
            ? {
                ...p,
                categories: p.categories.map((c) =>
                  c.name === action.category
                    ? {
                        ...c,
                        expanded: !c.expanded,
                        loading: !c.expanded && c.keys.length === 0,
                      }
                    : c,
                ),
              }
            : p,
        ),
      };

    case 'SET_KEYS':
      return {
        ...state,
        prefixNodes: state.prefixNodes.map((p) =>
          p.name === action.prefix
            ? {
                ...p,
                categories: p.categories.map((c) =>
                  c.name === action.category
                    ? { ...c, loading: false, keys: action.keys }
                    : c,
                ),
              }
            : p,
        ),
      };

    case 'START_ADD_PREFIX':
      return { ...state, addingPrefix: true, newPrefixInput: '' };

    case 'CONFIRM_ADD_PREFIX':
      if (!action.name.trim()) return { ...state, addingPrefix: false, newPrefixInput: '' };
      return {
        ...state,
        addingPrefix: false,
        newPrefixInput: '',
        prefixNodes: [
          ...state.prefixNodes,
          {
            name: action.name.trim(),
            categories: [],
            expanded: false,
            loading: false,
            addingCategory: false,
            newCategoryInput: '',
          },
        ],
      };

    case 'CANCEL_ADD_PREFIX':
      return { ...state, addingPrefix: false, newPrefixInput: '' };

    case 'SET_NEW_PREFIX_INPUT':
      return { ...state, newPrefixInput: action.value };

    case 'START_ADD_CATEGORY':
      return {
        ...state,
        prefixNodes: state.prefixNodes.map((p) =>
          p.name === action.prefix ? { ...p, addingCategory: true, newCategoryInput: '' } : p,
        ),
      };

    case 'CONFIRM_ADD_CATEGORY':
      return {
        ...state,
        prefixNodes: state.prefixNodes.map((p) =>
          p.name === action.prefix
            ? {
                ...p,
                addingCategory: false,
                newCategoryInput: '',
                categories: action.name.trim()
                  ? [
                      ...p.categories,
                      {
                        name: action.name.trim(),
                        keys: [],
                        expanded: false,
                        loading: false,
                      },
                    ]
                  : p.categories,
              }
            : p,
        ),
      };

    case 'CANCEL_ADD_CATEGORY':
      return {
        ...state,
        prefixNodes: state.prefixNodes.map((p) =>
          p.name === action.prefix ? { ...p, addingCategory: false, newCategoryInput: '' } : p,
        ),
      };

    case 'SET_NEW_CATEGORY_INPUT':
      return {
        ...state,
        prefixNodes: state.prefixNodes.map((p) =>
          p.name === action.prefix ? { ...p, newCategoryInput: action.value } : p,
        ),
      };

    case 'REMOVE_KEY': {
      const [keyPrefix, keyCategory] = action.key.split(':');
      return {
        ...state,
        prefixNodes: state.prefixNodes.map((p) =>
          p.name === keyPrefix
            ? {
                ...p,
                categories: p.categories.map((c) =>
                  c.name === keyCategory
                    ? { ...c, keys: c.keys.filter((k) => k !== action.key) }
                    : c,
                ),
              }
            : p,
        ),
      };
    }

    case 'ADD_KEY': {
      const [keyPrefix, keyCategory] = action.key.split(':');
      return {
        ...state,
        prefixNodes: state.prefixNodes.map((p) =>
          p.name === keyPrefix
            ? {
                ...p,
                categories: p.categories.map((c) =>
                  c.name === keyCategory && c.expanded
                    ? { ...c, keys: [...c.keys, action.key] }
                    : c,
                ),
              }
            : p,
        ),
      };
    }

    default:
      return state;
  }
}

function KeyList({ selectedKey, deletedKey, createdKey, onKeySelected, onCreate }: KeyListProps) {
  const [state, dispatch] = useReducer(treeReducer, initialState);
  const newPrefixInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    dispatch({ type: 'SET_LOADING_PREFIXES', loading: true });
    getStorePrefixes().then((prefixes) => {
      dispatch({ type: 'SET_PREFIXES', prefixes });
    });
  }, []);

  useEffect(() => {
    if (deletedKey) {
      dispatch({ type: 'REMOVE_KEY', key: deletedKey });
    }
  }, [deletedKey]);

  useEffect(() => {
    if (createdKey) {
      dispatch({ type: 'ADD_KEY', key: createdKey });
    }
  }, [createdKey]);

  function togglePrefix(prefix: string) {
    const node = state.prefixNodes.find((p) => p.name === prefix);
    if (!node) return;
    dispatch({ type: 'TOGGLE_PREFIX', prefix });
    if (!node.expanded && node.categories.length === 0) {
      getStoreCategories(prefix).then((categories) => {
        dispatch({ type: 'SET_CATEGORIES', prefix, categories });
      });
    }
  }

  function toggleCategory(prefix: string, category: string) {
    const prefixNode = state.prefixNodes.find((p) => p.name === prefix);
    const catNode = prefixNode?.categories.find((c) => c.name === category);
    if (!catNode) return;
    dispatch({ type: 'TOGGLE_CATEGORY', prefix, category });
    if (!catNode.expanded && catNode.keys.length === 0) {
      getStoreKeys(prefix, category).then((keys) => {
        dispatch({ type: 'SET_KEYS', prefix, category, keys });
      });
    }
  }

  function handleAddPrefixClick() {
    dispatch({ type: 'START_ADD_PREFIX' });
    setTimeout(() => newPrefixInputRef.current?.focus(), 0);
  }

  function handleConfirmAddPrefix() {
    dispatch({ type: 'CONFIRM_ADD_PREFIX', name: state.newPrefixInput });
  }

  function handlePrefixInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleConfirmAddPrefix();
    if (e.key === 'Escape') dispatch({ type: 'CANCEL_ADD_PREFIX' });
  }

  function handleConfirmAddCategory(prefix: string, value: string) {
    dispatch({ type: 'CONFIRM_ADD_CATEGORY', prefix, name: value });
  }

  function handleCategoryInputKeyDown(prefix: string, value: string, e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleConfirmAddCategory(prefix, value);
    if (e.key === 'Escape') dispatch({ type: 'CANCEL_ADD_CATEGORY', prefix });
  }

  return (
    <div className="flex flex-col gap-1 p-2">
      {state.loadingPrefixes && (
        <div className="flex flex-col gap-2 p-2">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-5/6" />
        </div>
      )}

      {state.prefixNodes.map((prefixNode) => (
        <div key={prefixNode.name}>
          <div
            className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-accent"
            onClick={() => togglePrefix(prefixNode.name)}
          >
            {prefixNode.expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            <Server className="h-4 w-4" />
            <span>{prefixNode.name}</span>
          </div>

          {prefixNode.expanded && (
            <div className="ml-4">
              {prefixNode.loading && <Skeleton className="m-2 h-4 w-3/4" />}

              {prefixNode.categories.map((catNode) => (
                <div key={catNode.name}>
                  <div
                    className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-accent"
                    onClick={() => toggleCategory(prefixNode.name, catNode.name)}
                  >
                    {catNode.expanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                    <Folder className="h-4 w-4" />
                    <span>{catNode.name}</span>
                    <button
                      className="ml-auto rounded p-0.5 hover:bg-accent"
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreate({ prefix: prefixNode.name, category: catNode.name });
                      }}
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  {catNode.expanded && (
                    <div className="ml-4">
                      {catNode.loading && <Skeleton className="m-2 h-4 w-1/2" />}

                      {catNode.keys.map((keyName) => {
                        const displayName = keyName.split(':').pop() ?? keyName;
                        return (
                          <div
                            key={keyName}
                            className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1 hover:bg-accent ${
                              selectedKey === keyName ? 'bg-accent' : ''
                            }`}
                            onClick={() => onKeySelected(keyName)}
                          >
                            <Key className="h-4 w-4" />
                            <span>{displayName}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              {prefixNode.addingCategory && (
                <div className="px-2 py-1">
                  <Input
                    value={prefixNode.newCategoryInput}
                    onChange={(e) =>
                      dispatch({
                        type: 'SET_NEW_CATEGORY_INPUT',
                        prefix: prefixNode.name,
                        value: e.target.value,
                      })
                    }
                    onKeyDown={(e) =>
                      handleCategoryInputKeyDown(
                        prefixNode.name,
                        prefixNode.newCategoryInput,
                        e,
                      )
                    }
                    onBlur={() =>
                      handleConfirmAddCategory(prefixNode.name, prefixNode.newCategoryInput)
                    }
                    placeholder="Category name..."
                    autoFocus
                  />
                </div>
              )}
            </div>
          )}

          <Separator className="my-0.5" />
        </div>
      ))}

      {state.addingPrefix && (
        <div className="px-2 py-1">
          <Input
            ref={newPrefixInputRef}
            data-testid="new-prefix-input"
            value={state.newPrefixInput}
            onChange={(e) =>
              dispatch({ type: 'SET_NEW_PREFIX_INPUT', value: e.target.value })
            }
            onKeyDown={handlePrefixInputKeyDown}
            onBlur={handleConfirmAddPrefix}
            placeholder="Prefix name..."
          />
        </div>
      )}

      <button
        data-testid="add-prefix-button"
        className="flex items-center gap-2 rounded px-2 py-1 text-muted-foreground hover:bg-accent hover:text-foreground"
        onClick={handleAddPrefixClick}
      >
        <Plus className="h-4 w-4" />
        <span>Add prefix</span>
      </button>
    </div>
  );
}

export default KeyList;
