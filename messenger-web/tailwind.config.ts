import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        messenger: {
          blue: "#0084FF",
          light: "#E4E6EB",
          dark: "#18191A",
          hover: "#3A3B3C",
          input: "#3A3B3C",
        }
      },
    },
  },
  plugins: [],
};
export default config;
