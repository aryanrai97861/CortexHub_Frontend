// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  // This is where Tailwind scans your files for utility classes
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}", // For pages in src/pages (if you have them)
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",   // For App Router pages and layouts
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}", // For components in src/components
    // Add any other directories where you use Tailwind classes
  ],
  theme: {
    extend: {
      colors: {
        // Your custom colors defined here
        'cortex-dark-blue': '#1a202c',
        'cortex-light-blue': '#3b82f6',
        'cortex-accent-blue': '#60a5fa',
        'cortex-text-light': '#f8fafc',
        'cortex-card-bg': '#ffffff',
        'cortex-card-text': '#4a5568',
        'cortex-border': '#e2e8f0',
      },
      // You can add other theme extensions here (e.g., fontFamily, spacing)
    },
  },
  plugins: [],
};

export default config;
