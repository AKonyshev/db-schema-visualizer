import { PersistableStore } from "./PersitableStore";

import type { JSONTableRef, JSONTableTable } from "shared/types/tableSchema";
import type { XYPosition, XYWHPosition } from "@/types/positions";

import computeTablesPositions from "@/utils/tablePositioning/computeTablesPositions";
import eventEmitter from "@/events-emitter";
import { defaultTableCoord } from "@/constants/tableCoords";

class TableCoordsStore extends PersistableStore<Array<[string, XYWHPosition]>> {
  private tableCoords = new Map<string, XYWHPosition>();
  private currentStoreKey = "none";

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
    const tablesPos = computeTablesPositions(tables, refs);

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
        const hasMetaInfo = tables.some((t) => t.fromMetaInfo === true);
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

  public switchTo(
    newStoreKey: string,
    newTables: JSONTableTable[],
    refs: JSONTableRef[],
  ): void {
    this.saveCurrentStore();

    this.currentStoreKey = newStoreKey;
    const recoveredStore = this.retrieve(this.currentStoreKey) as Array<
      [string, XYWHPosition]
    > | null;
    if (recoveredStore === null || !Array.isArray(recoveredStore)) {
      this.resetPositions(newTables, refs);
      return;
    }

    this.tableCoords = new Map<string, XYWHPosition>(recoveredStore);
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

  public getCoordEntriesForMetaInfo(): Array<{
    name: string;
    x: number;
    y: number;
  }> {
    return Array.from(this.tableCoords.entries()).map(([name, value]) => ({
      name,
      x: value.x,
      y: value.y,
    }));
  }
}

export const tableCoordsStore = new TableCoordsStore();
