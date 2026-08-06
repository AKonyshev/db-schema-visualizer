import {
  type JSONTableEnum,
  type JSONTableRef,
  type JSONTableTable,
} from "shared/types/tableSchema";
import { type ReactNode } from "react";

import EmptyTableMessage from "../Messages/EmptyTableMessage";
import Search from "../Search/Search";

import DiagramWrapper from "./DiagramWrapper";
import RelationsConnections from "./Connections";
import Tables from "./Tables";

import TablesPositionsProvider from "@/providers/TablesPositionsProvider";
import MainProviders from "@/providers/MainProviders";
import TableLevelDetailProvider from "@/providers/TableDetailLevelProvider";
import { useThemeContext } from "@/hooks/theme";
import { Theme } from "@/types/theme";

interface DiagramViewerProps {
  tables: JSONTableTable[];
  refs: JSONTableRef[];
  enums: JSONTableEnum[];
  documentKey?: string | null;
  syncEffects?: ReactNode;
}

const DiagramViewer = ({
  refs,
  tables,
  enums,
  documentKey = null,
  syncEffects = null,
}: DiagramViewerProps) => {
  const { theme } = useThemeContext();

  if (tables.length === 0) {
    return <EmptyTableMessage />;
  }

  return (
    <TableLevelDetailProvider>
      <TablesPositionsProvider tables={tables} refs={refs}>
        <MainProviders tables={tables} enums={enums}>
          <main
            // `h-full w-full` so the diagram below can measure a real box. This
            // element had no height of its own and did not need one while the
            // stage sized itself to the viewport regardless of its container.
            className={`relative flex h-full w-full flex-col items-center ${theme === Theme.dark ? "dark" : ""}`}
          >
            {syncEffects}
            <Search tables={tables} />

            <DiagramWrapper tables={tables} refs={refs}>
              <RelationsConnections
                refs={refs}
                documentKey={documentKey ?? undefined}
              />
              <Tables tables={tables} />
            </DiagramWrapper>
          </main>
        </MainProviders>
      </TablesPositionsProvider>
    </TableLevelDetailProvider>
  );
};

export default DiagramViewer;
