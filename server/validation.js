export function validateRsvp(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('Data tidak valid.')
  if (body.website) throw new Error('Data tidak valid.')
  if (typeof body.id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.id)) throw new Error('Identitas konfirmasi tidak valid.')
  if (typeof body.name !== 'string' || !body.name.trim() || body.name.length > 100) throw new Error('Nama harus diisi (maksimal 100 karakter).')
  if (!['yes', 'no'].includes(body.attendance)) throw new Error('Pilih status kehadiran.')
  if (!Number.isInteger(body.guests) || body.guests < 1 || body.guests > 5) throw new Error('Jumlah tamu harus 1–5 orang.')
  if (typeof body.message !== 'string' || body.message.length > 1000) throw new Error('Ucapan maksimal 1000 karakter.')
  return { id: body.id, name: body.name.trim(), attendance: body.attendance, guests: body.attendance === 'no' ? 0 : body.guests, message: body.message.trim() }
}
export const insertSql = 'INSERT INTO rsvps (id, name, attendance, guests, message, created_at) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO NOTHING'
export function rsvpValues(data) { return [data.id, data.name, data.attendance, data.guests, data.message, new Date().toISOString()] }
