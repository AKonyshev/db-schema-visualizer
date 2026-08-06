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
    extend: {},
  },
  plugins: [],
  darkMode: "selector",
};
