/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'canvas-bg': 'var(--canvas-bg)',
        'card-bg': 'var(--card-bg)',
        'card-surface': 'var(--card-surface)',
        'card-subtle': 'var(--card-subtle)',
        'border-main': 'var(--border-main)',
        'border-subtle': 'var(--border-subtle)',
        'text-heading': 'var(--text-heading)',
        'text-body': 'var(--text-body)',
        'text-muted': 'var(--text-muted)',
        'text-faint': 'var(--text-faint)',
        'accent-primary': 'var(--accent-primary)',
        'accent-secondary': 'var(--accent-secondary)',
        'accent-emerald': 'var(--accent-emerald)',
        'accent-amber': 'var(--accent-amber)',
        'accent-rose': 'var(--accent-rose)',
        brand: {
          cyan: '#0284c7',
          darkCyan: '#38bdf8',
          indigo: '#4f46e5',
          darkIndigo: '#818cf8',
          emerald: '#059669',
          darkEmerald: '#34d399',
          amber: '#d97706',
          darkAmber: '#fbbf24',
          rose: '#e11d48',
          darkRose: '#fb7185',
        },
        smart: {
          bg: 'var(--canvas-bg)',
          surface: 'var(--card-surface)',
          card: 'var(--card-bg)',
          border: 'var(--border-main)',
          accent: 'var(--accent-primary)',
          text: 'var(--text-body)',
          heading: 'var(--text-heading)',
          muted: 'var(--text-muted)'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'ui-monospace', 'monospace'],
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glowPulse 2s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
