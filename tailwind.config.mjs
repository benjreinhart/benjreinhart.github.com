import defaultTheme from 'tailwindcss/defaultTheme';
import Typography from '@tailwindcss/typography';
import DaisyUIPlugin from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  daisyui: {
    themes: ['light', 'dark'],
  },
  theme: {
    extend: {
      fontFamily: {
        mono: ['IBM Plex Mono', ...defaultTheme.fontFamily.mono],
      },
    },
  },
  plugins: [Typography, DaisyUIPlugin],
};
