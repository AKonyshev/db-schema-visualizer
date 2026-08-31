import {
  type JSONTableEnum,
  type JSONTableRef,
  type JSONTableTable,
} from "shared/types/tableSchema";
import { type ReactNode } from "react";

import TablesInfoProvider from "./TablesInfoProvider";
import EnumsProvider from "./EnumsProvider";
import TablesColorProvider from "./TablesColorProvider";
import ForeignKeysProvider from "./ForeignKeysProvider";

interface MainProvidersProps {
  tables: JSONTableTable[];
  refs: JSONTableRef[];
  enums: JSONTableEnum[];
  children: ReactNode;
}
const MainProviders = ({
  enums,
  tables,
  refs,
  children,
}: MainProvidersProps) => {
  return (
    <TablesInfoProvider tables={tables}>
      <TablesColorProvider tables={tables}>
        <ForeignKeysProvider tables={tables} refs={refs}>
          <EnumsProvider enums={enums}>{children}</EnumsProvider>
        </ForeignKeysProvider>
      </TablesColorProvider>
    </TablesInfoProvider>
  );
};

export default MainProviders;
