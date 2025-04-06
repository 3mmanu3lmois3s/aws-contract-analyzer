// tailwind.config.cjs (Using CJS explicitly)
const defaultTheme = require("tailwindcss/defaultTheme");

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}", // Use the full glob pattern again first
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter var"', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        /* ... primary/gray palettes ... */
      },
    },
  },
  plugins: [],
};
