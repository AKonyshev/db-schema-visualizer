import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;

/**
 * The only browser test in the repository, and it runs against the built site
 * rather than the dev server.
 *
 * That is the whole point: every other check here is green when the editor is
 * fetched from a CDN at run time. The types compile, the unit tests pass, the
 * container starts — and the left half of the page is empty on a closed
 * network. Only loading the real bundle in a real browser and watching what it
 * asks for can tell.
 */
export default defineConfig({
  testDir: "./e2e",
  // One worker and no retries: a flaky pass here would be worse than no test,
  // because the failure it exists to catch is not intermittent.
  workers: 1,
  retries: 0,
  reporter: [["list"]],

  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: "off",
  },

  // `vite preview` serves `dist`, so the test cannot pass against source that
  // was never built. It does not build: a stale `dist` should fail the test
  // rather than be quietly repaired by it.
  //
  // `--host 127.0.0.1` rather than the default: `vite preview` binds to
  // `localhost`, which on a machine where that name resolves to `::1` first
  // leaves nothing listening on 127.0.0.1 and the server never comes up as far
  // as Playwright is concerned. Naming the address on both sides removes the
  // question.
  webServer: {
    command: `yarn vite preview --port ${PORT} --strictPort --host 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: false,
    timeout: 60_000,
  },

  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
