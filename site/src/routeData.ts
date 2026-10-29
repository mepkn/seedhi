import { defineRouteMiddleware } from '@astrojs/starlight/route-data'

// Starlight titles pages "<page> | Seedhi"; the home page would read
// "Seedhi | Seedhi", so give it the app name alone.
export const onRequest = defineRouteMiddleware((context) => {
  if (context.url.pathname !== '/') return
  const title = context.locals.starlightRoute.head.find((entry) => entry.tag === 'title')
  if (title) title.content = 'Seedhi'
})
