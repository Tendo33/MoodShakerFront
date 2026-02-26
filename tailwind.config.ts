import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
	content: ["./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "*.{js,ts,jsx,tsx,mdx}"],
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px",
			},
		},
		extend: {
			colors: {
				border: "hsl(var(--border))",
				input: "hsl(var(--input))",
				ring: "hsl(var(--ring))",
				background: "hsl(var(--background))",
				foreground: "hsl(var(--foreground))",
				primary: {
					DEFAULT: "hsl(var(--primary))",
					foreground: "hsl(var(--primary-foreground))",
				},
				secondary: {
					DEFAULT: "hsl(var(--secondary))",
					foreground: "hsl(var(--secondary-foreground))",
				},
				destructive: {
					DEFAULT: "hsl(var(--destructive))",
					foreground: "hsl(var(--destructive-foreground))",
				},
				muted: {
					DEFAULT: "hsl(var(--muted))",
					foreground: "hsl(var(--muted-foreground))",
				},
				accent: {
					DEFAULT: "hsl(var(--accent))",
					foreground: "hsl(var(--accent-foreground))",
				},
				popover: {
					DEFAULT: "hsl(var(--popover))",
					foreground: "hsl(var(--popover-foreground))",
				},
				card: {
					DEFAULT: "hsl(var(--card))",
					foreground: "hsl(var(--card-foreground))",
				},
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
			keyframes: {
				fadeIn: {
					"0%": { opacity: "0" },
					"100%": { opacity: "1" },
				},
				fadeOut: {
					"0%": { opacity: "1" },
					"100%": { opacity: "0" },
				},
				float: {
					"0%, 100%": { transform: "translateY(0)" },
					"50%": { transform: "translateY(-12px)" },
				},
				gentleFloat: {
					"0%, 100%": { transform: "translateY(0)" },
					"50%": { transform: "translateY(-6px)" },
				},
				pulse: {
					"0%, 100%": { transform: "scale(1)", opacity: "1" },
					"50%": { transform: "scale(1.05)", opacity: "0.8" },
				},
				shimmer: {
					"0%": { transform: "translateX(-100%)" },
					"100%": { transform: "translateX(100%)" },
				},
				slideUp: {
					"0%": { transform: "translateY(40px)", opacity: "0", filter: "blur(8px)" },
					"100%": { transform: "translateY(0)", opacity: "1", filter: "blur(0)" },
				},
				scaleIn: {
					"0%": { transform: "scale(0.85)", opacity: "0" },
					"100%": { transform: "scale(1)", opacity: "1" },
				},
			},
			animation: {
				fadeIn: "fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards",
				fadeOut: "fadeOut 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards",
				float: "float 7s cubic-bezier(0.45, 0, 0.55, 1) infinite",
				gentleFloat: "gentleFloat 5s cubic-bezier(0.45, 0, 0.55, 1) infinite",
				pulse: "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
				shimmer: "shimmer 2.5s cubic-bezier(0.4, 0, 0.2, 1) infinite",
				slideUp: "slideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
				scaleIn: "scaleIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards",
			},
		},
	},
	plugins: [tailwindcssAnimate],
};

export default config;
