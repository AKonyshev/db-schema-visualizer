import type { DatabaseSchema } from "../types";

// Two schemas: "public" (users, orders) and "audit" (logs).
// One cross-schema ref: public.orders.user_id -> audit.logs.id.
export function twoSchemaFixture(): DatabaseSchema {
  return {
    tables: [
      { name: "users", schemaName: "public" },
      { name: "orders", schemaName: "public" },
      { name: "logs", schemaName: "audit" },
    ],
    enums: [
      { name: "user_role", schemaName: "public" },
      { name: "log_level", schemaName: "audit" },
    ],
    refs: [
      // fully inside public: orders.user_id -> users.id
      {
        endpoints: [
          { schemaName: "public", tableName: "orders" },
          { schemaName: "public", tableName: "users" },
        ],
      },
      // cross-schema: public.orders -> audit.logs
      {
        endpoints: [
          { schemaName: "public", tableName: "orders" },
          { schemaName: "audit", tableName: "logs" },
        ],
      },
      // fully inside audit
      {
        endpoints: [
          { schemaName: "audit", tableName: "logs" },
          { schemaName: "audit", tableName: "logs" },
        ],
      },
    ],
    fields: { "public.users": [], "public.orders": [], "audit.logs": [] },
    tableConstraints: { "public.users": {}, "audit.logs": {} },
    indexes: { "public.orders": [], "audit.logs": [] },
    checks: { "public.users": [], "audit.logs": [] },
  };
}
