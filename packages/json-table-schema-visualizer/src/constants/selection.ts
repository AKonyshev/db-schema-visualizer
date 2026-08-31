/**
 * The Konva node name on the outline drawn around a selected table.
 *
 * A canvas has no DOM to query, so this is how a browser test says how many
 * tables are selected. Naming the node is better than picking it out by its
 * stroke width, which also matches the hidden-relations outline and the search
 * highlight — a count built that way answers the same number whatever is
 * selected, and the assertion silently passes for ever.
 */
export const SELECTED_OUTLINE_NAME = "table-selected-outline";
