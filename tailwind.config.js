/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--color-primary))',
          light: 'rgb(var(--color-primary-light))',
          dark: 'rgb(var(--color-primary-dark))',
        },
        secondary: {
          DEFAULT: 'rgb(var(--color-secondary))',
          light: 'rgb(var(--color-secondary-light))',
          dark: 'rgb(var(--color-secondary-dark))',
        },
        accent: 'rgb(var(--color-accent))',
        neutral: {
          50: 'rgb(var(--color-neutral-50))',
          100: 'rgb(var(--color-neutral-100))',
          200: 'rgb(var(--color-neutral-200))',
          300: 'rgb(var(--color-neutral-300))',
          400: 'rgb(var(--color-neutral-400))',
          500: 'rgb(var(--color-neutral-500))',
          600: 'rgb(var(--color-neutral-600))',
          700: 'rgb(var(--color-neutral-700))',
          800: 'rgb(var(--color-neutral-800))',
          900: 'rgb(var(--color-neutral-900))',
        },
        success: 'rgb(var(--color-success))',
        warning: 'rgb(var(--color-warning))',
        error: 'rgb(var(--color-error))',
        info: 'rgb(var(--color-info))',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};