/** @type {import('tailwindcss').Config} */
export default {
  // The visualizer package's own sources are scanned too: its components carry
  // the toolbar, search and legend classes, and without this glob they would be
  // stripped from the stylesheet and the interface would render unstyled.
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../json-table-schema-visualizer/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // The palette, reachable as utilities: `bg-surface`, `text-muted`,
      // `border-subtle`, `bg-accent/10`. The values are custom properties, so a
      // component names a role once and the theme decides the colour — see
      // `json-table-schema-visualizer/src/styles/palette.ts`.
      colors: {
        surface: {
          DEFAULT: "var(--surface)",
          raised: "var(--surface-raised)",
          sunken: "var(--surface-sunken)",
        },
        subtle: "var(--border)",
        strong: "var(--border-strong)",
        content: {
          DEFAULT: "var(--text)",
          muted: "var(--text-muted)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          contrast: "var(--accent-contrast)",
          soft: "var(--accent-soft)",
        },
        danger: "var(--danger)",
        warning: "var(--warning)",
        success: "var(--success)",
      },
    },
  },
  plugins: [],
  darkMode: "selector",
};
