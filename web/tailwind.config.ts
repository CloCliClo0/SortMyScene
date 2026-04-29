import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        neon: '0 0 20px rgba(34, 211, 238, 0.3)',
      },
    },
  },
  plugins: [],
} satisfies Config;
