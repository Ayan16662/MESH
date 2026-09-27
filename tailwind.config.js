/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0F172A',     // Slate Deep Navy (CAD Workbench)
        panel: '#1E293B',    // Steel CAD Panel
        panel2: '#131C2E',   // Darker Slate Inner Panel
        line: '#334155',     // Crisp Technical CAD Grid Line
        ice: '#0EA5E9',      // Electric Cyan Accent
        ice2: '#38BDF8',     // Sky Blue Thermal Highlight
        ember: '#EA580C',    // Engineering Heat Alert
        ember2: '#F97316',   // High-Temperature Highlight
        frost: '#F8FAFC',    // Pure White High-Readability Technical Text
        slate: '#94A3B8',    // Slate Engineering Sub-label
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        data: ['"JetBrains Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
}
