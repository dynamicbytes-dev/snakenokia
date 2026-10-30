/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        nokia: {
          bg: '#949f76',       // Verde LCD claro clásico de Nokia 3310
          dark: '#2d381c',     // Píxeles apagados/negro verdoso clásico
          grid: '#88936a',     // Cuadrícula sutil
          bezel: '#2b303c',    // Carcasa exterior azul oscuro mate
          accent: '#1e232d',   // Detalles de carcasa
          keypad: '#4a5061',   // Botones físicos
          keypadText: '#d8dee9'
        }
      },
      fontFamily: {
        retro: ['"Courier New"', 'Courier', 'monospace', 'ui-monospace'],
      },
      boxShadow: {
        'nokia-inset': 'inset 3px 3px 6px rgba(0,0,0,0.3), inset -3px -3px 6px rgba(255,255,255,0.1)',
        'keypad': '0 4px 0 #1b1e26, 0 5px 5px rgba(0,0,0,0.4)',
        'keypad-pressed': '0 1px 0 #1b1e26, 0 2px 2px rgba(0,0,0,0.3)',
      }
    },
  },
  plugins: [],
}
