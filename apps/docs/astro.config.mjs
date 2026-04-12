import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import react from '@astrojs/react'
import tailwind from '@astrojs/tailwind'

export default defineConfig({
  site: 'https://ksefnik.pl',
  integrations: [
    starlight({
      title: 'ksefnik — SDK do uzgadniania faktur KSeF',
      description: 'Open-source TypeScript SDK do automatycznego uzgadniania faktur KSeF z wyciągami bankowymi. 6-etapowy pipeline, 5 formatów bankowych, 20 reguł walidacji. Wspierany przez CodeFormers.it',
      logo: {
        src: './src/assets/ksefnik-logo.png',
        alt: 'ksefnik',
        replacesTitle: true,
      },
      head: [
        // OG
        { tag: 'meta', attrs: { property: 'og:type', content: 'website' } },
        { tag: 'meta', attrs: { property: 'og:site_name', content: 'ksefnik' } },
        { tag: 'meta', attrs: { property: 'og:title', content: 'ksefnik — SDK do uzgadniania faktur KSeF z przelewami bankowymi' } },
        { tag: 'meta', attrs: { property: 'og:description', content: 'Open-source TypeScript SDK. 6-etapowy pipeline dopasowania, 5 formatów bankowych (MT940, mBank, ING, PKO, Santander), 20 reguł walidacji, serwer MCP dla AI. Wspierany przez CodeFormers.it' } },
        { tag: 'meta', attrs: { property: 'og:image', content: 'https://ksefnik.pl/og-image.jpg' } },
        { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' } },
        { tag: 'meta', attrs: { property: 'og:image:height', content: '630' } },
        { tag: 'meta', attrs: { property: 'og:locale', content: 'pl_PL' } },
        { tag: 'meta', attrs: { property: 'og:url', content: 'https://ksefnik.pl' } },
        // Twitter
        { tag: 'meta', attrs: { name: 'twitter:card', content: 'summary_large_image' } },
        { tag: 'meta', attrs: { name: 'twitter:title', content: 'ksefnik — SDK do uzgadniania faktur KSeF' } },
        { tag: 'meta', attrs: { name: 'twitter:description', content: 'Open-source TypeScript SDK. 6-etapowy pipeline, 5 formatów bankowych, 20 reguł walidacji, MCP dla AI. Wspierany przez CodeFormers.it' } },
        { tag: 'meta', attrs: { name: 'twitter:image', content: 'https://ksefnik.pl/og-image.jpg' } },
        // Extra
        { tag: 'meta', attrs: { name: 'author', content: 'CodeFormers.it' } },
        { tag: 'meta', attrs: { name: 'keywords', content: 'KSeF, faktury, uzgadnianie, reconciliation, bank, MT940, mBank, ING, PKO, Santander, TypeScript, SDK, MCP, walidacja, NIP, CodeFormers' } },
        { tag: 'link', attrs: { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' } },
      ],
      defaultLocale: 'root',
      locales: {
        root: { label: 'Polski', lang: 'pl' },
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/CodeFormers-it/ksefnik' },
      ],
      components: {
        SiteTitle: './src/components/overrides/SiteTitle.astro',
        SocialIcons: './src/components/overrides/SocialIcons.astro',
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
        { label: 'Klient HTTP', autogenerate: { directory: 'http' } },
        { label: 'Referencja API', autogenerate: { directory: 'referencja' } },
        { label: 'Zaawansowane', autogenerate: { directory: 'zaawansowane' } },
      ],
    }),
    react(),
    tailwind({ applyBaseStyles: false }),
  ],
})
