import type { Config } from 'tailwindcss'

const config: Config = {
	content: [
		'./src/pages/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/components/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/components/ui/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/components/ui/*.{js,ts,jsx,tsx,mdx}',
		'./src/components-parser/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/components-markdown/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/app/**/*.{js,ts,jsx,tsx,mdx}',
		'./src/app/*.{js,ts,jsx,tsx,mdx}',
	],
	theme: {
		extend: {
			fontFamily: {
				sans: ['Nunito', 'sans-serif'],
				display: ['Fredoka', 'sans-serif'],
				body: ['Nunito', 'sans-serif'],
			},
			boxShadow: {
				'hard': '4px 4px 0px 0px #1e293b',
				'hard-sm': '2px 2px 0px 0px #1e293b',
				'clay': '8px 8px 16px rgba(165, 177, 198, 0.4), -8px -8px 16px rgba(255, 255, 255, 0.8)',
				'clay-sm': '5px 5px 10px rgba(165, 177, 198, 0.4), -5px -5px 10px rgba(255, 255, 255, 0.8)',
				'clay-md': '10px 10px 20px rgba(165, 177, 198, 0.4), -10px -10px 20px rgba(255, 255, 255, 0.8)',
				'clay-lg': '15px 15px 30px rgba(165, 177, 198, 0.4), -15px -15px 30px rgba(255, 255, 255, 0.8)',
				'clay-inner': 'inset 6px 6px 12px rgba(165, 177, 198, 0.6), inset -6px -6px 12px rgba(255, 255, 255, 0.9)',
				'clay-inner-sm': 'inset 3px 3px 6px rgba(165, 177, 198, 0.6), inset -3px -3px 6px rgba(255, 255, 255, 0.9)',
			},
			minWidth: {
				'250': '250px',
				'300': '300px',
				'1000': '1000px'
			},
			colors: {
				vibrant: {
					blue: '#87CEEB', // Sky Blue
					cyan: '#AEEEEE', // Pale Turquoise
					pink: '#FA8072', // Salmon
					purple: '#B39DDB', // Pastel Purple
					yellow: '#FDFD96', // Pastel Yellow
					green: '#50C878', // Emerald
					orange: '#FFB347',
				},
				brand: {
					cream: '#FFFBF0',
					green: '#38D468', // Primary Green
					dark: '#2C3E50',  // Deep Slate/Navy (Text)
					blue: '#87CEEB',  // Keep as is or update if needed
					peach: '#FDC5D0', // Pink
					indigo: '#4F46E5',
					softBlue: '#E3F5F7', // Surface
					orange: '#FDC5D0',
					salmon: '#38D468', // RE-MAPPED to Primary Green for instant theming
					sky: '#FDC5D0', // RE-MAPPED to Secondary Pink
					emerald: '#38D468',
					white: '#FFFFFF',
					surface: '#E3F5F7' // New surface color
				},
				'primary-cta': '#38D468', // Green
				'secondary-cta': '#FDC5D0', // Pink
				'text-primary': '#2C3E50', // Navy
				'text-dark': '#2C3E50',
				'bg-canvas': '#FFFFFF', // White
				primary: {
					DEFAULT: '#FA8072', // Salmon
					foreground: '#FFFFFF'
				},
				secondary: {
					DEFAULT: '#87CEEB', // Sky Blue
					foreground: '#FFFFFF'
				},
				accent: {
					DEFAULT: '#50C878', // Emerald
					foreground: '#FFFFFF'
				},
				green: '#50C878',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			gridTemplateColumns: {
				listItem: '35px 1fr',
				body: '200px 1fr',
				itemsSentences: '399px 1fr',
				blogSideLeft: '48px 1fr 40px',
				blogSideRight: '48px 1fr 120px',
				blogs: '1fr 200px',
				closeBlogs: '1fr 80px'
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				'clay': '24px',
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out'
			}
		}
	},
	plugins: [
		require('@tailwindcss/typography'),
		require("tailwindcss-animate")
	],
	darkMode: ['class'], // or 'media' for system preference
}
export default config







// --------------------------------------------------------

