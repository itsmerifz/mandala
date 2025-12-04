import { Elysia } from 'elysia'
import { rosterRoutes } from './modules/roster'
import { syncRoutes } from './modules/sync'
import { trainingRoutes } from './modules/training'
import { examRoutes } from './modules/exam'

export const app = new Elysia({ prefix: '/api' })
  .onError(({ code, error }) => {
    return new Response(JSON.stringify({
      error: code,
      message: error.toString()
    }), { status: 500 })
  })

  // Cek Health
  .get('/health', () => ({ status: 'API Operational', timestamp: new Date() }))
  .use(rosterRoutes)
  .use(syncRoutes)
  .use(trainingRoutes)
  .use(examRoutes)

export type App = typeof app



