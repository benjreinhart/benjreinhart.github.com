import Typography from '@tailwindcss/typography';
import DaisyUIPlugin from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  daisyui: {
    themes: false,
  },
  theme: {
    extend: {},
  },
  plugins: [Typography, DaisyUIPlugin],
};
