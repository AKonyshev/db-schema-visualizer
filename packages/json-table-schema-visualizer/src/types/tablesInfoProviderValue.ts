export type ColsIndexesMap = Record<string, number>;

// Hover and column highlighting used to live here too, which made every pointer
// move a change to this value and so a re-render of everything reading it. They
// are in `stores/hoverStore` now; what is left changes only when the schema or
// the detail level does.
export interface TablesInfoProviderValue {
  colsIndexes: ColsIndexesMap;
}
