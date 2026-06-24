import { colors } from './src/theme/colors.js';
import { typography } from './src/theme/typography.js';
import { shadows } from './src/theme/shadows.js';
import { radius } from './src/theme/radius.js';
import { spacing } from './src/theme/spacing.js';
import { gradients } from './src/theme/gradients.js';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors,
      fontFamily: typography.fontFamily,
      fontSize: typography.fontSize,
      fontWeight: typography.fontWeight,
      boxShadow: shadows,
      borderRadius: radius,
      spacing,
      backgroundImage: gradients,
    },
  },
  plugins: [],
}
