/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        // Standard SaaS typography scale (12px, 14px, 16px, 18px, 20px, 24px, 30px, 36px)
        xs: ['0.75rem', { lineHeight: '1.5', letterSpacing: '0' }],      // 12px
        sm: ['0.875rem', { lineHeight: '1.5', letterSpacing: '0' }],     // 14px
        base: ['1rem', { lineHeight: '1.5', letterSpacing: '0' }],        // 16px
        lg: ['1.125rem', { lineHeight: '1.5', letterSpacing: '-0.01em' }], // 18px
        xl: ['1.25rem', { lineHeight: '1.4', letterSpacing: '-0.01em' }],  // 20px
        '2xl': ['1.5rem', { lineHeight: '1.4', letterSpacing: '-0.02em' }], // 24px
        '3xl': ['1.875rem', { lineHeight: '1.3', letterSpacing: '-0.02em' }], // 30px
        '4xl': ['2.25rem', { lineHeight: '1.2', letterSpacing: '-0.03em' }], // 36px
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
      },
    },
  },
  plugins: [],
}

