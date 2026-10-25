import { handle } from '../../server/handler.js'

export const onRequest = async ({ request, env }) => (await handle(request, env)) ?? new Response('Not found', { status: 404 })
