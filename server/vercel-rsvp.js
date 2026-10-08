import { validateRsvp } from './validation.js'

export function createRsvpHandler({ env = process.env, fetchImpl = fetch } = {}) {
  return async function rsvp(req, res) {
    res.setHeader('Cache-Control', 'no-store')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    const reply = (status, body) => res.status(status).json(body)
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      return reply(405, { error: 'Method not allowed' })
    }
    const protocol = req.headers['x-forwarded-proto'] || 'https'
    if (req.headers.origin !== `${protocol}://${req.headers.host}`) return reply(403, { error: 'Origin not allowed' })
    if (!req.headers['content-type']?.includes('application/json')) return reply(415, { error: 'JSON required' })
    let data
    try {
      const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
      if (!raw || Buffer.byteLength(raw) > 8192) return reply(413, { error: 'Request too large' })
      data = validateRsvp(JSON.parse(raw))
    } catch { return reply(400, { error: 'Konfirmasi tidak valid.' }) }
    if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) return reply(503, { error: 'Konfirmasi belum tersimpan. Silakan coba lagi.' })
    try {
      const response = await fetchImpl(new URL('/rest/v1/rsvps', env.SUPABASE_URL), {
        method: 'POST',
        headers: {
          apikey: env.SUPABASE_PUBLISHABLE_KEY,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal'
        },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(10000)
      })
      if (!response.ok) {
        // UUID primary key memastikan retry tidak menambah baris. Hindari upsert,
        // karena ON CONFLICT(id) memerlukan izin SELECT yang tidak diberikan.
        const error = await response.json().catch(() => ({}))
        if (response.status !== 409 || error.code !== '23505') throw new Error(`Database status ${response.status}`)
      }
      return reply(201, { saved: true, id: data.id })
    } catch {
      return reply(503, { error: 'Konfirmasi belum tersimpan. Silakan coba lagi.' })
    }
  }
}
