import { QuickPickItemKind, l10n, window, type QuickPickItem } from "vscode";
import { listDatabases, listSchemas, withDatabase } from "db-to-dbml";

export interface ImportPreselect {
  connectionString: string;
  databaseName?: string;
  schemaName?: string;
}

export interface ImportTarget {
  databaseName: string;
  schemaNames: string[];
}

// `databaseName` is what carries a picked schema back to the database it came
// from — two databases' worth of `public` are indistinguishable by label alone.
type SchemaPickItem = QuickPickItem & { databaseName?: string };

interface DatabaseSchemas {
  databaseName: string;
  schemaNames: string[];
  unreadable: boolean;
}

async function pickDatabases(
  connectionString: string,
): Promise<string[] | undefined> {
  const databases = await listDatabases(connectionString);
  if (databases.length === 0) {
    void window.showWarningMessage(
      l10n.t("No databases found on this server."),
    );
    return undefined;
  }
  if (databases.length === 1) {
    return databases;
  }

  const picked = await window.showQuickPick(databases, {
    canPickMany: true,
    placeHolder: l10n.t("Select the databases to import"),
  });
  return picked === undefined || picked.length === 0 ? undefined : picked;
}

// The catalogue queries are one round trip each, so they go out together — this
// is the cheap half of the package, unlike the full reads the import itself
// does one at a time. A database whose schemas cannot be read must not sink the
// whole selection: on a shared server that is an ordinary state of affairs.
async function schemasByDatabase(
  connectionString: string,
  databaseNames: string[],
): Promise<DatabaseSchemas[]> {
  return await Promise.all(
    databaseNames.map(async (databaseName) => {
      try {
        return {
          databaseName,
          schemaNames: await listSchemas(
            withDatabase(connectionString, databaseName),
          ),
          unreadable: false,
        };
      } catch (error) {
        console.error("[dbml] listing schemas failed", databaseName, error);
        return { databaseName, schemaNames: [], unreadable: true };
      }
    }),
  );
}

export async function pickImportTargets(
  preselect: ImportPreselect,
): Promise<ImportTarget[] | undefined> {
  const { connectionString, databaseName, schemaName } = preselect;

  if (databaseName !== undefined && schemaName !== undefined) {
    return [{ databaseName, schemaNames: [schemaName] }];
  }

  const databases =
    databaseName !== undefined
      ? [databaseName]
      : await pickDatabases(connectionString);
  if (databases === undefined) {
    return undefined;
  }

  const listed = await schemasByDatabase(connectionString, databases);

  const unreadable = listed
    .filter((entry) => entry.unreadable)
    .map((entry) => entry.databaseName);
  if (unreadable.length > 0) {
    void window.showWarningMessage(
      l10n.t("Could not read the schemas of: {0}", unreadable.join(", ")),
    );
  }

  const readable = listed.filter((entry) => entry.schemaNames.length > 0);
  if (readable.length === 0) {
    void window.showWarningMessage(
      l10n.t("No user schemas found in this database."),
    );
    return undefined;
  }

  // The one case worth not asking about, and the behaviour the command had
  // before there was anything to choose between.
  if (readable.length === 1 && readable[0].schemaNames.length === 1) {
    return [
      {
        databaseName: readable[0].databaseName,
        schemaNames: readable[0].schemaNames,
      },
    ];
  }

  const items: SchemaPickItem[] = readable.flatMap((entry) => [
    { label: entry.databaseName, kind: QuickPickItemKind.Separator },
    ...entry.schemaNames.map((name) => ({
      label: name,
      description: entry.databaseName,
      picked: true,
      databaseName: entry.databaseName,
    })),
  ]);

  const picked = await window.showQuickPick(items, {
    canPickMany: true,
    placeHolder: l10n.t("Select the schemas to import"),
  });
  if (picked === undefined || picked.length === 0) {
    return undefined;
  }

  return readable
    .map((entry) => ({
      databaseName: entry.databaseName,
      schemaNames: picked
        .filter((item) => item.databaseName === entry.databaseName)
        .map((item) => item.label),
    }))
    .filter((target) => target.schemaNames.length > 0);
}
