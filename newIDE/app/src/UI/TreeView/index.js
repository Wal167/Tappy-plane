// @flow

import * as React from 'react';
import { FixedSizeList } from 'react-window';
import memoizeOne from 'memoize-one';
import GDevelopThemeContext from '../Theme/GDevelopThemeContext';
import { treeView } from '../../EventsSheet/EventsTree/ClassNames';
import './TreeView.css';
import ContextMenu, { type ContextMenuInterface } from '../Menu/ContextMenu';
import { useResponsiveWindowWidth } from '../Reponsive/ResponsiveWindowMeasurer';
import TreeViewRow from './TreeViewRow';
import { makeDragSourceAndDropTarget } from '../DragAndDrop/DragSourceAndDropTarget';
import { type HTMLDataset } from '../../Utils/HTMLDataset';
import useForceUpdate from '../../Utils/UseForceUpdate';

export const navigationKeys = [
  'ArrowDown',
  'ArrowUp',
  'ArrowRight',
  'ArrowLeft',
];

export type ItemBaseAttributes = {
  +isRoot?: boolean,
  +isPlaceholder?: boolean,
};

type FlattenedNode<Item> = {|
  id: string,
  name: string,
  hasChildren: boolean,
  canHaveChildren: boolean,
  extraClass: string,
  depth: number,
  dataset?: ?HTMLDataset,
  collapsed: boolean,
  selected: boolean,
  disableCollapse: boolean,
  thumbnailSrc?: ?string,
  item: Item,
|};

export type ItemData<Item> = {|
  onOpen: (FlattenedNode<Item>) => void,
  onSelect: ({| node: FlattenedNode<Item>, exclusive?: boolean |}) => void,
  onBlurField: () => void,
  flattenedData: FlattenedNode<Item>[],
  onStartRenaming: (nodeId: ?string) => void,
  onEndRenaming: (item: Item, newName: string) => void,
  onContextMenu: ({|
    item: Item,
    index: number,
    x: number,
    y: number,
  |}) => void,
  renamedItemId: ?string,
  canDrop?: ?(Item) => boolean,
  onDrop: (Item, where: 'before' | 'inside' | 'after') => void,
  onEditItem?: Item => void,
  isMobileScreen: boolean,
  DragSourceAndDropTarget: any => React.Node,
  getItemHtmlId?: (Item, index: number) => ?string,
|};

const getItemProps = memoizeOne(
  <Item>(
    flattenedData: FlattenedNode<Item>[],
    onOpen: (FlattenedNode<Item>) => void,
    onSelect: ({| node: FlattenedNode<Item>, exclusive?: boolean |}) => void,
    onBlurField: () => void,
    onStartRenaming: (nodeId: ?string) => void,
    onEndRenaming: (item: Item, newName: string) => void,
    renamedItemId: ?string,
    onContextMenu: ({|
      item: Item,
      index: number,
      x: number,
      y: number,
    |}) => void,
    canDrop?: ?(Item) => boolean,
    onDrop: (Item, where: 'before' | 'inside' | 'after') => void,
    onEditItem?: Item => void,
    isMobileScreen: boolean,
    DragSourceAndDropTarget: any => React.Node,
    getItemHtmlId?: (Item, index: number) => ?string
  ): ItemData<Item> => ({
    onOpen,
    onSelect,
    onBlurField,
    flattenedData,
    onStartRenaming,
    onEndRenaming,
    renamedItemId,
    onContextMenu,
    canDrop,
    onDrop,
    onEditItem,
    isMobileScreen,
    DragSourceAndDropTarget,
    getItemHtmlId,
  })
);

export type TreeViewInterface<Item> = {|
  forceUpdateList: () => void,
  scrollToItem: (Item, placement?: 'smart' | 'start') => void,
  renameItem: Item => void,
  openItems: (string[]) => void,
  closeItems: (string[]) => void,
  animateItem: Item => void,
  areItemsOpen: (Array<Item>) => boolean[],
|};

type Props<Item> = {|
  height: number,
  width?: number,
  items: Item[],
  getItemName: Item => string,
  getItemId: Item => string,
  getItemHtmlId?: (Item, index: number) => ?string,
  getItemChildren: Item => ?(Item[]),
  getItemThumbnail?: Item => ?string,
  getItemDataset?: Item => ?HTMLDataset,
  onEditItem?: Item => void,
  buildMenuTemplate: (Item, index: number) => any,
  searchText?: string,
  selectedItems: $ReadOnlyArray<Item>,
  onSelectItems: (Item[]) => void,
  multiSelect: boolean,
  onRenameItem: (Item, newName: string) => void,
  onMoveSelectionToItem: (
    destinationItem: Item,
    where: 'before' | 'inside' | 'after'
  ) => void,
  canMoveSelectionToItem?: ?(destinationItem: Item) => boolean,
  reactDndType: string,
  forceAllOpened?: boolean,
  initiallyOpenedNodeIds?: string[],
  arrowKeyNavigationProps?: {|
    onGetItemInside: (item: Item) => ?Item,
    onGetItemOutside: (item: Item) => ?Item,
  |},
|};

const TreeView = <Item: ItemBaseAttributes>(
  {
    height,
    width,
    items,
    searchText,
    getItemName,
    getItemId,
    getItemHtmlId,
    getItemChildren,
    getItemThumbnail,
    getItemDataset,
    onEditItem,
    buildMenuTemplate,
    selectedItems,
    onSelectItems,
    multiSelect,
    onRenameItem,
    onMoveSelectionToItem,
    canMoveSelectionToItem,
    reactDndType,
    forceAllOpened,
    initiallyOpenedNodeIds,
    arrowKeyNavigationProps,
  }: Props<Item>,
  ref: TreeViewInterface<Item>
) => {
  const selectedNodeIds = selectedItems.map(getItemId);
  const [openedNodeIds, setOpenedNodeIds] = React.useState<string[]>(
    initiallyOpenedNodeIds || []
  );
  const [renamedItemId, setRenamedItemId] = React.useState<?string>(null);
  const contextMenuRef = React.useRef<?ContextMenuInterface>(null);
  const containerRef = React.useRef<?HTMLDivElement>(null);
  const listRef = React.useRef<?FixedSizeList>(null);
  const [
    openedDuringSearchNodeIds,
    setOpenedDuringSearchNodeIds,
  ] = React.useState<string[]>([]);
  const theme = React.useContext(GDevelopThemeContext);
  const windowWidth = useResponsiveWindowWidth();
  const forceUpdate = useForceUpdate();
  const [animatedItemId, setAnimatedItemId] = React.useState<string>('');

  const isMobileScreen = windowWidth === 'small';
  const isSearching = !!searchText;
  const flattenNode = React.useCallback(
    (
      item: Item,
      depth: number,
      searchText: ?string,
      forceOpen: boolean
    ): FlattenedNode<Item>[] => {
      const id = getItemId(item);
      const children = getItemChildren(item);
      const canHaveChildren = Array.isArray(children);
      const collapsed = !forceAllOpened && !openedNodeIds.includes(id);
      const openedDuringSearch = openedDuringSearchNodeIds.includes(id);
      let flattenedChildren = [];
      /*
       * Compute children nodes flattening if:
       * - node has children;
       * and if either one of these conditions are true:
       * - the nodes are force-opened (props)
       * - the node is opened (not collapsed)
       * - the user is searching
       * - the user opened the node during the search
       */
      if (
        children &&
        (forceAllOpened || !collapsed || !!searchText || openedDuringSearch)
      ) {
        flattenedChildren = children
          .map(child =>
            flattenNode(child, depth + 1, searchText, openedDuringSearch)
          )
          .flat();
      }

      const name = getItemName(item);
      const dataset = getItemDataset ? getItemDataset(item) : undefined;
      const extraClass =
        animatedItemId && id === animatedItemId ? 'animate' : '';

      /*
       * Append node to result if either:
       * - the user is not searching
       * - the nodes are force-opened (props)
       * - the node is force-opened (if user opened the node during the search)
       * - the node name matches the search
       * - the node contains children that should be displayed
       */
      if (
        !searchText ||
        forceAllOpened ||
        forceOpen ||
        name.toLowerCase().includes(searchText) ||
        flattenedChildren.length > 0
      ) {
        const thumbnailSrc = getItemThumbnail ? getItemThumbnail(item) : null;
        const selected = selectedNodeIds.includes(id);
        return [
          {
            id,
            name,
            hasChildren: !!children && children.length > 0,
            canHaveChildren,
            depth,
            selected,
            thumbnailSrc,
            dataset,
            item,
            extraClass,
            /*
             * If the user is searching, the node should be opened if either:
             * - it has children that should be displayed
             * - the user opened it
             */
            collapsed: !!searchText
              ? flattenedChildren.length === 0 || !openedDuringSearch
              : collapsed,
            /*
             * Disable opening of the node if:
             * - the user is searching
             * - the node has children to be displayed but it's not because the user opened it
             */
            disableCollapse:
              !!searchText &&
              flattenedChildren.length > 0 &&
              !openedDuringSearch,
          },
          ...flattenedChildren,
        ];
      }
      return [];
    },
    [
      getItemChildren,
      getItemId,
      getItemName,
      getItemThumbnail,
      getItemDataset,
      openedDuringSearchNodeIds,
      openedNodeIds,
      selectedNodeIds,
      forceAllOpened,
      animatedItemId,
    ]
  );

  const flattenOpened = React.useCallback(
    (items: Item[], searchText: ?string): FlattenedNode<Item>[] => {
      return items.map(item => flattenNode(item, 0, searchText, false)).flat();
    },
    [flattenNode]
  );

  const onOpen = React.useCallback(
    (node: FlattenedNode<Item>) => {
      if (isSearching) {
        if (node.collapsed) {
          setOpenedDuringSearchNodeIds([...openedDuringSearchNodeIds, node.id]);
        } else {
          if (!forceAllOpened)
            setOpenedDuringSearchNodeIds(
              openedDuringSearchNodeIds.filter(id => id !== node.id)
            );
        }
      } else {
        if (node.collapsed) {
          setOpenedNodeIds([...openedNodeIds, node.id]);
        } else {
          if (!forceAllOpened)
            setOpenedNodeIds(openedNodeIds.filter(id => id !== node.id));
        }
      }
    },
    [openedDuringSearchNodeIds, openedNodeIds, isSearching, forceAllOpened]
  );

  const onSelect = React.useCallback(
    ({
      node,
      exclusive,
    }: {|
      node: FlattenedNode<Item>,
      exclusive?: boolean,
    |}) => {
      if (multiSelect) {
        if (node.selected) {
          if (exclusive) {
            if (selectedItems.length === 1) return;
            onSelectItems([node.item]);
          } else
            onSelectItems(selectedItems.filter(item => item !== node.item));
        } else {
          if (exclusive) onSelectItems([node.item]);
          else onSelectItems([...selectedItems, node.item]);
        }
      } else {
        if (node.selected && selectedItems.length === 1) return;
        onSelectItems([node.item]);
      }
    },
    [multiSelect, onSelectItems, selectedItems]
  );

  const onEndRenaming = (item: Item, newName: string) => {
    const trimmedNewName = newName.trim();
    setRenamedItemId(null);
    if (!trimmedNewName) return;
    if (getItemName(item) === trimmedNewName) return;
    onRenameItem(item, trimmedNewName);
  };

  let flattenedData = React.useMemo(
    () => flattenOpened(items, searchText ? searchText.toLowerCase() : null),
    [flattenOpened, items, searchText]
  );

  const scrollToItem = React.useCallback(
    (item: Item, placement?: 'smart' | 'start' = 'smart') => {
      const list = listRef.current;
      if (list) {
        const itemId = getItemId(item);
        // Browse flattenedData in reverse order since scrollToItem is mainly used
        // to scroll to newly added object that is appended at the end of the list.
        // $FlowFixMe - Method introduced in 2022.
        const index = flattenedData.findLastIndex(node => node.id === itemId);
        if (index >= 0) {
          list.scrollToItem(index, placement);
        }
      }
    },
    [getItemId, flattenedData]
  );

  const renameItem = React.useCallback(
    (item: Item) => {
      setRenamedItemId(getItemId(item));
    },
    [getItemId]
  );

  const openItems = React.useCallback(
    (itemIds: string[]) => {
      const notAlreadyOpenedNodeIds = itemIds.filter(
        itemId => !openedNodeIds.includes(itemId)
      );
      if (notAlreadyOpenedNodeIds.length > 0)
        setOpenedNodeIds([...openedNodeIds, ...notAlreadyOpenedNodeIds]);
    },
    [openedNodeIds]
  );

  const closeItems = React.useCallback(
    (itemIds: string[]) => {
      const newOpenedNodesIds = openedNodeIds.filter(
        openedNodeId => !itemIds.includes(openedNodeId)
      );
      setOpenedNodeIds(newOpenedNodesIds);
    },
    [openedNodeIds]
  );

  const animateItem = React.useCallback(
    (item: Item) => {
      setAnimatedItemId(getItemId(item));
    },
    [getItemId]
  );

  const areItemsOpen = React.useCallback(
    (items: Item[]) => {
      const itemIds = items.map(getItemId);
      const openedNodeIdsSet = new Set(openedNodeIds);
      return itemIds.map(id => openedNodeIdsSet.has(id));
    },
    [openedNodeIds, getItemId]
  );

  React.useEffect(
    () => {
      if (animatedItemId) {
        const timeoutId = setTimeout(
          // Animated item must be reset to remove the extra class to the node.
          // Otherwise, if it has to be animated once again, the class is already here
          // and the animation won't play.
          () => setAnimatedItemId(''),
          // Corresponds to the duration of the CSS animation.
          400
        );
        return () => clearTimeout(timeoutId);
      }
    },
    [animatedItemId]
  );

  React.useImperativeHandle(
    // $FlowFixMe
    ref,
    () => ({
      forceUpdateList: forceUpdate,
      scrollToItem,
      renameItem,
      openItems,
      closeItems,
      animateItem,
      areItemsOpen,
    })
  );

  const DragSourceAndDropTarget = React.useMemo(
    () =>
      makeDragSourceAndDropTarget(reactDndType, {
        vibrate: 100,
      }),
    [reactDndType]
  );

  const openContextMenu = React.useCallback(
    ({
      x,
      y,
      item,
      index,
    }: {|
      item: Item,
      index: number,
      x: number,
      y: number,
    |}) => {
      if (contextMenuRef.current) {
        contextMenuRef.current.open(x, y, { item, index });
      }
    },
    []
  );

  const onBlurField = React.useCallback(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  const itemData: ItemData<Item> = getItemProps<Item>(
    flattenedData,
    onOpen,
    onSelect,
    onBlurField,
    setRenamedItemId,
    onEndRenaming,
    renamedItemId,
    openContextMenu,
    canMoveSelectionToItem,
    onMoveSelectionToItem,
    onEditItem,
    isMobileScreen,
    DragSourceAndDropTarget,
    getItemHtmlId
  );

  // Reset opened nodes during search when user stops searching
  // or when the search text changes.
  React.useEffect(
    () => {
      if (!searchText || searchText.length > 0) {
        setOpenedDuringSearchNodeIds([]);
      }
    },
    [searchText]
  );

  const onKeyDown = React.useCallback(
    (event: KeyboardEvent) => {
      if (!navigationKeys.includes(event.key)) return;
      let newFocusedItem;
      const item = selectedItems[0];
      let itemIndexInFlattenedData = -1;
      if (item) {
        itemIndexInFlattenedData = flattenedData.findIndex(
          node => node.id === getItemId(item)
        );
      }

      if (itemIndexInFlattenedData === -1) {
        // If no row is selected, start from the first row that is selectable.
        let i = 0;
        let newFocusedNode = flattenedData[i];
        while (
          newFocusedNode &&
          (newFocusedNode.item.isRoot || newFocusedNode.item.isPlaceholder)
        ) {
          i += 1;
          if (i > flattenedData.length - 1) {
            newFocusedNode = null;
          }
          newFocusedNode = flattenedData[i];
        }
        if (newFocusedNode) {
          newFocusedItem = newFocusedNode.item;
        }
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (itemIndexInFlattenedData < flattenedData.length - 1) {
          let delta = 1;
          let newFocusedNode = flattenedData[itemIndexInFlattenedData + delta];
          while (
            newFocusedNode &&
            (newFocusedNode.item.isRoot || newFocusedNode.item.isPlaceholder)
          ) {
            if (itemIndexInFlattenedData + delta > flattenedData.length - 1) {
              newFocusedNode = null;
            }
            delta += 1;
            newFocusedNode = flattenedData[itemIndexInFlattenedData + delta];
          }
          if (newFocusedNode) {
            newFocusedItem = newFocusedNode.item;
          }
        }
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (itemIndexInFlattenedData > 0) {
          let delta = -1;
          let newFocusedNode = flattenedData[itemIndexInFlattenedData + delta];
          while (
            newFocusedNode &&
            (newFocusedNode.item.isRoot || newFocusedNode.item.isPlaceholder)
          ) {
            if (itemIndexInFlattenedData + delta < 0) {
              newFocusedNode = null;
            }
            delta -= 1;
            newFocusedNode = flattenedData[itemIndexInFlattenedData + delta];
          }
          if (newFocusedNode) {
            newFocusedItem = newFocusedNode.item;
          }
        }
      } else if (event.key === 'ArrowRight' && arrowKeyNavigationProps) {
        event.preventDefault();
        const node = flattenedData[itemIndexInFlattenedData];
        if (node.canHaveChildren && node.collapsed) {
          openItems([node.id]);
        } else {
          newFocusedItem = arrowKeyNavigationProps.onGetItemInside(item);
        }
      } else if (event.key === 'ArrowLeft' && arrowKeyNavigationProps) {
        event.preventDefault();
        const node = flattenedData[itemIndexInFlattenedData];
        if (node.canHaveChildren && !node.collapsed) {
          closeItems([node.id]);
        } else {
          newFocusedItem = arrowKeyNavigationProps.onGetItemOutside(item);
        }
      }
      if (newFocusedItem) {
        scrollToItem(newFocusedItem);
        onSelectItems([newFocusedItem]);
      }
    },
    [
      flattenedData,
      arrowKeyNavigationProps,
      getItemId,
      onSelectItems,
      selectedItems,
      scrollToItem,
      openItems,
      closeItems,
    ]
  );

  return (
    <>
      <div
        tabIndex={0}
        className={`${treeView} ${theme.treeViewRootClassName}`}
        onKeyDown={onKeyDown}
        ref={containerRef}
      >
        <FixedSizeList
          height={height}
          itemCount={flattenedData.length}
          itemSize={32}
          width={typeof width === 'number' ? width : '100%'}
          itemKey={index => flattenedData[index].id}
          // Flow does not seem to accept the generic used in FixedSizeList
          // can itself use a generic.
          // $FlowFixMe
          itemData={itemData}
          ref={listRef}
          // Keep overscanCount relatively high so that:
          // - during in-app tutorials we make sure the tooltip displayer finds
          //   the elements to highlight
          // - on mobile it avoids jumping screens. This can happen when an item
          //   name is edited, the keyboard opens and reduces the window height
          //   making the item disappear (because or virtualization).
          overscanCount={20}
        >
          {TreeViewRow}
        </FixedSizeList>
      </div>
      <ContextMenu
        ref={contextMenuRef}
        buildMenuTemplate={(i18n, options) =>
          buildMenuTemplate(options.item, options.index)
        }
      />
    </>
  );
};

// $FlowFixMe
export default React.forwardRef(TreeView);
