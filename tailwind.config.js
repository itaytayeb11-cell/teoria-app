// מערכת העיצוב — ראה docs/design.md
// הצבעים כאן חייבים להישאר תואמים ל-constants/Colors.ts
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
    './screens/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1D4ED8',
          dark: '#1A44BE',
          soft: '#6C9CF0',
          tint: '#EAF1FE',
        },
        bg: '#F4F5F7',
        card: '#FFFFFF',
        pill: '#F0F1F5',
        ink: {
          DEFAULT: '#25324D', // טקסט ראשי
          soft: '#6B7280', // טקסט משני
        },
        line: '#E5E7EB',
        success: { DEFAULT: '#3BA55C', bg: '#E7F6EC' },
        danger: { DEFAULT: '#E5484D', bg: '#FDECEC' },
        warning: '#E8850C',
        gold: '#F5C24B',
        explain: '#6B4EE6',
      },
      borderRadius: {
        card: '16px',
        btn: '14px',
        pill: '12px',
      },
    },
  },
  plugins: [],
};
