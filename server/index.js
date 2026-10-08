import assets from './assets.js'
import { validateRsvp, insertSql, rsvpValues } from './validation.js'
function json(data, status = 200) { return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } }) }
export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname !== '/api/rsvp') {
      if (env.ASSETS) return env.ASSETS.fetch(request)
      if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405 })
      const asset = assets[url.pathname === '/' ? '/index.html' : url.pathname]
      if (!asset) return new Response('Not found', { status: 404 })
      const bytes = Uint8Array.from(atob(asset.body), c => c.charCodeAt(0))
      return new Response(request.method === 'HEAD' ? null : bytes, { headers: { 'Content-Type': asset.type, 'Cache-Control': asset.type.includes('html') ? 'no-cache' : 'public, max-age=86400', 'X-Content-Type-Options': 'nosniff' } })
    }
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
    if (request.headers.get('Origin') !== url.origin) return json({ error: 'Origin not allowed' }, 403)
    if (!request.headers.get('Content-Type')?.includes('application/json')) return json({ error: 'JSON required' }, 415)
    let data
    try { const raw = await request.text(); if (raw.length > 8192) return json({ error: 'Request too large' }, 413); data = validateRsvp(JSON.parse(raw)) } catch { return json({ error: 'Konfirmasi tidak valid.' }, 400) }
    try { if (!env.DB) throw new Error('Database unavailable'); await env.DB.prepare(insertSql).bind(...rsvpValues(data)).run(); return json({ saved: true, id: data.id }, 201) }
    catch (error) { console.error('RSVP storage failed', error.message); return json({ error: 'Konfirmasi belum tersimpan. Silakan coba lagi.' }, 503) }
  }
}
