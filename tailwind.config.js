/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    safelist: [
        // Dynamic client category colors (Clients.tsx, CoachDashboard.tsx)
        // These are constructed via template literals like `bg-${color}-500/10`
        // and would be purged in production without safelisting.
        {
            pattern: /bg-(orange|blue|purple|teal|red|indigo|gold)-(400|500)\/(10|15)/,
        },
        {
            pattern: /text-(orange|blue|purple|teal|red|indigo|gold)-(400|500)/,
        },
        {
            pattern: /border-(orange|blue|purple|teal|red|indigo|gold)-(500)\/(20|40)/,
        },
    ],
    theme: {
        extend: {
            colors: {
                // Dark base palette (near-black with blue undertone)
                navy: {
                    50: '#c5cae9',
                    100: '#9fa8da',
                    200: '#7986cb',
                    300: '#5c6bc0',
                    400: '#3f51b5',
                    500: '#303f9f',
                    600: '#1a237e',
                    700: '#141b54',
                    800: '#0e1338',
                    900: '#0a0d24',
                    950: '#060814',
                },
                // Gold accent palette
                gold: {
                    50: '#fff9e6',
                    100: '#fff0b3',
                    200: '#ffe680',
                    300: '#ffd740',
                    400: '#ffc400',
                    500: '#d4a017',
                    600: '#c9942a',
                    700: '#a67b1e',
                    800: '#7a5a14',
                    900: '#4e3a0d',
                    950: '#2b2006',
                },
            },
            boxShadow: {
                'clay': '8px 8px 20px rgba(0,0,0,0.6), -4px -4px 12px rgba(255,255,255,0.02), inset 1px 1px 2px rgba(255,255,255,0.04)',
                'clay-sm': '4px 4px 10px rgba(0,0,0,0.5), -2px -2px 6px rgba(255,255,255,0.02), inset 1px 1px 1px rgba(255,255,255,0.03)',
                'clay-inset': 'inset 4px 4px 10px rgba(0,0,0,0.6), inset -2px -2px 6px rgba(255,255,255,0.02)',
                'clay-gold': '0 4px 24px rgba(212,160,23,0.12), inset 1px 1px 2px rgba(255,255,255,0.04)',
            },
        },
    },
    plugins: [],
}
