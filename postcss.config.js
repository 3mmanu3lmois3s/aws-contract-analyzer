// postcss.config.js (Standard v3 - ESM export is usually fine here)
export default {
  plugins: {
    tailwindcss: {}, // Tailwind should find tailwind.config.cjs automatically
    autoprefixer: {},
  },
};
