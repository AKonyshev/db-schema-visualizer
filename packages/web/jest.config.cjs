/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  moduleNameMapper: {
    // The workspace package's `main` points at a `src/index.js` that only exists
    // as TypeScript, so the bare import cannot be resolved without this.
    "^dbml-to-json-table-schema$":
      "<rootDir>/../dbml-to-json-table-schema/src/index.ts",
  },
};
