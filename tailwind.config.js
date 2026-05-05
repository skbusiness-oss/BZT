/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    safelist: [
        // Dynamic client category + level colors (Clients.tsx, CoachDashboard.tsx,
        // WorkoutWizard.tsx). Constructed via template literals like
        // `bg-${color}-500/10` and would be purged in production without
        // safelisting. Keep this in sync with CLIENT_CATEGORIES + LEVEL_OPTIONS
        // — tightened to only actually-used utilities.
        { pattern: /bg-(orange|blue|purple|teal|red|emerald|yellow|green|indigo)-500\/(5|10|15|20|30|40)/ },
        { pattern: /bg-(orange|blue|purple|teal|red|emerald|yellow|green|indigo)-400\/(10|15|20)/ },
        { pattern: /text-(orange|blue|purple|teal|red|emerald|yellow|green|indigo)-(300|400)/ },
        { pattern: /border-(orange|blue|purple|teal|red|emerald|yellow|green|indigo)-500\/(20|30|40)/ },
        { pattern: /border-(orange|blue|purple|teal|red|emerald|yellow|green|indigo)-400(\/(20|30))?/ },
        { pattern: /ring-(orange|blue|purple|teal|red|emerald|yellow|green|indigo)-400/ },
        { pattern: /(from|to)-(orange|blue|purple|teal|red|emerald|yellow|green|indigo)-(400|600)\/(10|15|20)/ },
    ],
    theme: {
        extend: {
            colors: {
                // Theme tokens — defined in src/index.css under :root and [data-theme="light"].
                // The `<alpha-value>` placeholder lets Tailwind resolve `bg-primary/40` etc.
                primary: 'rgb(var(--primary) / <alpha-value>)',
                'primary-container': 'rgb(var(--primary-container) / <alpha-value>)',
                'primary-fixed': 'rgb(var(--primary-fixed) / <alpha-value>)',
                'primary-fixed-dim': 'rgb(var(--primary-fixed-dim) / <alpha-value>)',
                'on-primary': 'rgb(var(--on-primary) / <alpha-value>)',
                'on-primary-fixed': 'rgb(var(--on-primary-fixed) / <alpha-value>)',
                'on-primary-fixed-variant': 'rgb(var(--on-primary-fixed-variant) / <alpha-value>)',
                surface: 'rgb(var(--surface) / <alpha-value>)',
                'surface-bright': 'rgb(var(--surface-bright) / <alpha-value>)',
                'surface-dim': 'rgb(var(--surface-dim) / <alpha-value>)',
                'surface-container-lowest': 'rgb(var(--surface-container-lowest) / <alpha-value>)',
                'surface-container-low': 'rgb(var(--surface-container-low) / <alpha-value>)',
                'surface-container': 'rgb(var(--surface-container) / <alpha-value>)',
                'surface-container-high': 'rgb(var(--surface-container-high) / <alpha-value>)',
                'surface-container-highest': 'rgb(var(--surface-container-highest) / <alpha-value>)',
                'on-surface': 'rgb(var(--on-surface) / <alpha-value>)',
                'on-surface-variant': 'rgb(var(--on-surface-variant) / <alpha-value>)',
                'outline': 'rgb(var(--outline) / <alpha-value>)',
                'outline-variant': 'rgb(var(--outline-variant) / <alpha-value>)',
            },
            fontFamily: {
                headline: ['Manrope', 'sans-serif'],
                body: ['Inter', 'sans-serif'],
                label: ['Inter', 'sans-serif'],
            },
            boxShadow: {
                'clay': '0 8px 32px rgba(0, 0, 0, 0.3)',
                'clay-sm': '0 4px 16px rgba(0, 0, 0, 0.2)',
                'clay-inset': 'inset 4px 4px 10px rgba(0,0,0,0.6), inset -2px -2px 6px rgba(255,255,255,0.02)',
                'clay-gold': '0 4px 24px rgb(var(--primary) / 0.12), inset 1px 1px 2px rgba(255,255,255,0.04)',
            },
        },
    },
    plugins: [],
}
