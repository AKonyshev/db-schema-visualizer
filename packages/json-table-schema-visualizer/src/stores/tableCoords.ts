import { PersistableStore } from "./PersitableStore";
import { detailLevelStore } from "./detailLevelStore";

import type { JSONTableRef, JSONTableTable } from "shared/types/tableSchema";
import type { XYPosition, XYWHPosition } from "@/types/positions";

import computeTablesPositions from "@/utils/tablePositioning/computeTablesPositions";
import { tableRelationsVisibilityStore } from "@/stores/tableRelationsVisibilityStore";
import { getRelationStyle } from "@/stores/relationStyle";
import eventEmitter from "@/events-emitter";
import { defaultTableCoord } from "@/constants/tableCoords";
import { TableDetailLevel } from "@/types/tableDetailLevel";

/**
 * A layout belongs to a document *and* to a detail level.
 *
 * The arrangement is computed from how tall the tables are drawn, so the three
 * levels want three different ones — and a reader who has moved tables about at
 * one level should find them where they left them when they come back to it,
 * rather than have the move thrown away because they looked at the schema
 * another way in between.
 */
const storeKeyFor = (documentKey: string, level: TableDetailLevel): string =>
  `${documentKey}#${level}`;

class TableCoordsStore extends PersistableStore<Array<[string, XYWHPosition]>> {
  private tableCoords = new Map<string, XYWHPosition>();
  private currentDocumentKey = "none";
  private currentStoreKey = storeKeyFor("none", TableDetailLevel.FullDetails);

  static RESET_POS_EVENT_NAME = "tableCoords:resetTablesPositions";

  constructor() {
    super("tableCoords");
  }

  public getCurrentStore(): Map<string, XYWHPosition> {
    return this.tableCoords;
  }

  public subscribeToReset(
    callback: (pos: Map<string, XYWHPosition>) => void,
  ): () => void {
    eventEmitter.on(TableCoordsStore.RESET_POS_EVENT_NAME, callback);

    return () => {
      eventEmitter.off(TableCoordsStore.RESET_POS_EVENT_NAME, callback);
    };
  }

  public resetPositions(
    tables: JSONTableTable[],
    refs: JSONTableRef[],
    options?: { force?: boolean },
  ): void {
    // Hidden relations are hidden from the layout too: a table the reader has
    // silenced should be arranged as one with no relations, not left sitting in
    // the middle of a fan it no longer draws.
    const hidden = new Set(
      tables
        .map((table) => table.name)
        .filter((name) =>
          tableRelationsVisibilityStore.areTableRelationsHidden(name),
        ),
    );
    // The relation style decides how much room the lines need between tables.
    // A right angle is routed round what stands in its way and a curve is not,
    // so an arrangement made for curves is the roomier of the two.
    const detailLevel = detailLevelStore.getCurrentDetailLevel();
    const tablesPos = computeTablesPositions(
      tables,
      refs,
      detailLevel,
      hidden,
      getRelationStyle(),
    );

    if (options?.force !== true) {
      const recoveredStore = this.retrieve(this.currentStoreKey) as Array<
        [string, XYWHPosition]
      > | null;

      if (recoveredStore !== null && Array.isArray(recoveredStore)) {
        const recoveredMap = new Map(recoveredStore);
        for (const [tableName] of tablesPos) {
          if (recoveredMap.has(tableName)) {
            const rc = recoveredMap.get(tableName);
            const computed = tablesPos.get(tableName);
            if (rc != null && computed != null) {
              tablesPos.set(tableName, { ...rc, w: computed.w, h: computed.h });
            }
          }
        }
      } else {
        // A file's own coordinates are a full-detail arrangement — that is the
        // only kind written back into one, see `getCoordEntriesForMetaInfo`.
        // Laying headers out on them would space them as though every column
        // were still there, which is the arrangement this level exists to get
        // away from, so at a reduced level they are passed over for a computed
        // one.
        const hasMetaInfo =
          detailLevel === TableDetailLevel.FullDetails &&
          tables.some((t) => t.fromMetaInfo === true);
        if (hasMetaInfo) {
          tables.forEach((table) => {
            if (table.fromMetaInfo === true && tablesPos.has(table.name)) {
              const existing = tablesPos.get(table.name);
              if (existing == null) return;
              tablesPos.set(table.name, {
                x: table.x,
                y: table.y,
                w: existing.w,
                h: existing.h,
              });
            }
          });
        }
      }
    }

    this.tableCoords = tablesPos;
    this.persist(this.currentStoreKey, Array.from(this.tableCoords.entries()));
    eventEmitter.emit(TableCoordsStore.RESET_POS_EVENT_NAME, tablesPos);
  }

  public getCurrentStoreValue(): Map<string, XYWHPosition> {
    return this.tableCoords;
  }

  public saveCurrentStore(): void {
    const storeValue = Array.from(this.tableCoords);
    this.persist(this.currentStoreKey, storeValue);
  }

  /**
   * Point the store at one stored layout, computing it if there is none.
   *
   * `announceRecovered` is what separates the two callers. Switching documents
   * remounts the diagram, so a recovered layout is already what the new tables
   * render with and announcing it would only make them fit twice. Switching
   * detail levels remounts nothing: the tables are on screen at the old
   * arrangement's coordinates and nothing else will tell them to move.
   */
  private adoptStoreKey(
    storeKey: string,
    tables: JSONTableTable[],
    refs: JSONTableRef[],
    announceRecovered: boolean,
  ): void {
    this.saveCurrentStore();

    this.currentStoreKey = storeKey;
    const recoveredStore = this.retrieve(this.currentStoreKey) as Array<
      [string, XYWHPosition]
    > | null;
    if (recoveredStore === null || !Array.isArray(recoveredStore)) {
      // Announces the reset itself.
      this.resetPositions(tables, refs);
      return;
    }

    this.tableCoords = new Map<string, XYWHPosition>(recoveredStore);
    if (announceRecovered) {
      eventEmitter.emit(
        TableCoordsStore.RESET_POS_EVENT_NAME,
        this.tableCoords,
      );
    }
  }

  public switchTo(
    newStoreKey: string,
    newTables: JSONTableTable[],
    refs: JSONTableRef[],
  ): void {
    this.currentDocumentKey = newStoreKey;
    this.adoptStoreKey(
      storeKeyFor(newStoreKey, detailLevelStore.getCurrentDetailLevel()),
      newTables,
      refs,
      false,
    );
  }

  /**
   * The same document, arranged for the detail level now in force.
   *
   * Called after the level has changed, so the level it reads is the new one.
   */
  public switchToDetailLevel(
    tables: JSONTableTable[],
    refs: JSONTableRef[],
  ): void {
    this.adoptStoreKey(
      storeKeyFor(
        this.currentDocumentKey,
        detailLevelStore.getCurrentDetailLevel(),
      ),
      tables,
      refs,
      true,
    );
  }

  /**
   * Everything remembered for one document, at every level.
   *
   * The caller names a document, not a layout — it has no idea there are three
   * — so clearing the one that happens to be current would leave the other two
   * to be adopted the moment the reader pressed `D`.
   */
  public clear(documentKey: string): void {
    for (const level of Object.values(TableDetailLevel)) {
      super.clear(storeKeyFor(documentKey, level));
    }
  }

  public getCoords(table: string): XYPosition {
    return this.tableCoords.get(table) ?? defaultTableCoord;
  }

  public getFullCoords(table: string): XYWHPosition {
    const coords = this.tableCoords.get(table);
    if (coords != null) {
      return coords;
    }

    return {
      ...defaultTableCoord,
      w: 0,
      h: 0,
    };
  }

  public getAllCoords(): Map<string, XYWHPosition> {
    return this.tableCoords;
  }

  public getXYWHCoords(): XYWHPosition {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const value of this.tableCoords.values()) {
      if (value.x < minX) minX = value.x;
      if (value.y < minY) minY = value.y;
      if (value.x + value.w > maxX) maxX = value.x + value.w;
      if (value.y + value.h > maxY) maxY = value.y + value.h;
    }

    if (!isFinite(minX)) minX = 0;
    if (!isFinite(minY)) minY = 0;
    if (!isFinite(maxX)) maxX = 0;
    if (!isFinite(maxY)) maxY = 0;

    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }

  public setCoords(table: string, coords: XYPosition): void {
    const existing = this.tableCoords.get(table);
    this.tableCoords.set(table, {
      x: coords.x,
      y: coords.y,
      w: existing?.w ?? 0,
      h: existing?.h ?? 0,
    });
    eventEmitter.emit("table:coords:updated");
  }

  public setFullCoords(table: string, coords: XYWHPosition): void {
    this.tableCoords.set(table, coords);
    eventEmitter.emit("table:coords:updated");
  }

  public remove(table: string): void {
    this.tableCoords.delete(table);
  }

  /**
   * The arrangement to write into the file, or `null` when there is none to
   * write.
   *
   * A file holds one set of coordinates and cannot say which detail level they
   * were made at, so they have to mean the same thing every time they are read.
   * They mean the full-detail arrangement: it is the roomiest of the three, and
   * it is the only one that can be laid out again at any level without tables
   * landing on top of each other.
   *
   * So a reader at a reduced level writes nothing of their own. If they have a
   * full-detail layout stored for this document it goes out unchanged — moving
   * headers about does not disturb it — and if they have never opened the
   * document at full detail there is nothing honest to write, and this says so.
   *
   * `null` rather than an empty list, because the two are opposite
   * instructions: `upsertMetaInfoInDbml` given an empty list replaces the
   * file's coordinate block with an empty one, which would delete the layout
   * the reader is trying not to touch.
   */
  public getCoordEntriesForMetaInfo(): Array<{
    name: string;
    x: number;
    y: number;
  }> | null {
    const entriesOf = (
      coords: Map<string, XYWHPosition>,
    ): Array<{ name: string; x: number; y: number }> =>
      Array.from(coords.entries()).map(([name, value]) => ({
        name,
        x: value.x,
        y: value.y,
      }));

    if (
      detailLevelStore.getCurrentDetailLevel() === TableDetailLevel.FullDetails
    ) {
      return entriesOf(this.tableCoords);
    }

    const stored = this.retrieve(
      storeKeyFor(this.currentDocumentKey, TableDetailLevel.FullDetails),
    ) as Array<[string, XYWHPosition]> | null;

    return stored === null || !Array.isArray(stored)
      ? null
      : entriesOf(new Map(stored));
  }
}

export const tableCoordsStore = new TableCoordsStore();
