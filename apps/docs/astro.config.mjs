import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import react from '@astrojs/react'
import tailwind from '@astrojs/tailwind'

export default defineConfig({
  site: 'https://ksefnik.pl',
  integrations: [
    starlight({
      title: 'ksefnik',
      logo: {
        src: './src/assets/ksefnik-logo.png',
        alt: 'ksefnik',
        replacesTitle: true,
      },
      defaultLocale: 'root',
      locales: {
        root: { label: 'Polski', lang: 'pl' },
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/CodeFormers-it/ksefnik' },
      ],
      components: {
        SiteTitle: './src/components/overrides/SiteTitle.astro',
      },
      customCss: ['./src/styles/custom.css'],
      sidebar: [
        { label: 'Wprowadzenie', autogenerate: { directory: 'wprowadzenie' } },
        { label: 'Przewodniki', autogenerate: { directory: 'przewodniki' } },
        { label: 'Silnik uzgadniania', autogenerate: { directory: 'silnik-uzgadniania' } },
        { label: 'Parsery bankowe', autogenerate: { directory: 'parsery-bankowe' } },
        { label: 'Walidacja', autogenerate: { directory: 'walidacja' } },
        { label: 'Adapter KSeF', autogenerate: { directory: 'adapter-ksef' } },
        { label: 'Symulator', autogenerate: { directory: 'symulator' } },
        { label: 'CLI', autogenerate: { directory: 'cli' } },
        { label: 'Serwer MCP', autogenerate: { directory: 'mcp' } },
        { label: 'Referencja API', autogenerate: { directory: 'referencja' } },
        { label: 'Zaawansowane', autogenerate: { directory: 'zaawansowane' } },
        { label: 'Integracje', autogenerate: { directory: 'integracje' } },
      ],
    }),
    react(),
    tailwind({ applyBaseStyles: false }),
  ],
})
