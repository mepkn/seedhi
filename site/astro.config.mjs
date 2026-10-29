// @ts-check
import starlight from '@astrojs/starlight'
import { defineConfig } from 'astro/config'

export default defineConfig({
  site: 'https://seedhi.pknspace.com',
  integrations: [
    starlight({
      title: 'Seedhi',
      description: 'Build, deploy and monitor a full-stack app, step by step.',
      favicon: '/favicon.svg?v=1',
      logo: { src: './public/favicon.svg' },
      social: [{ icon: 'github', label: 'GitHub', href: 'https://github.com/mepkn/seedhi' }],
      customCss: ['./src/styles/theme.css'],
      routeMiddleware: './src/routeData.ts',
      sidebar: [
        { label: "0 · Start", items: [{ autogenerate: { directory: "start" } }] },
        { label: "1 · Develop", items: [{ autogenerate: { directory: "develop" } }] },
        { label: "2 · Dockerize", items: [{ autogenerate: { directory: "dockerize" } }] },
        { label: "3 · Prepare the VPS", items: [{ autogenerate: { directory: "vps" } }] },
        { label: "4 · First deploy, by hand", items: [{ autogenerate: { directory: "first-deploy" } }] },
        { label: "5 · CI/CD", items: [{ autogenerate: { directory: "cicd" } }] },
        { label: "6 · Monitor", items: [{ autogenerate: { directory: "monitor" } }] },
        { label: "7 · Shipping changes", items: [{ autogenerate: { directory: "shipping-changes" } }] },
        { label: "8 · Teardown", items: [{ autogenerate: { directory: "teardown" } }] },
        { label: "Appendix", items: [{ autogenerate: { directory: "appendix" } }] },
      ],
    }),
  ],
})
