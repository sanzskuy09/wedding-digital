function decode(value) {
  try { return decodeURIComponent(value.replace(/\+/g, ' ')) }
  catch { return value.replace(/\+/g, ' ') }
}
function normalize(value) {
  return Array.from((value || '').trim().replace(/^(['"])([\s\S]*)\1$/, '$2').replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim()).slice(0, 100).join('')
}
export function guestFromSearch(search) {
  const query = search.replace(/^\?/, '')
  const params = new URLSearchParams(query)
  // Support quoted examples such as ?for='Aziz & partner', including raw &.
  const quoted = query.match(/(?:^|&)for=(%27|%22|'|")([\s\S]*?)\1(?=&|$)/i)
  return normalize(quoted ? decode(quoted[2]) : params.get('for')) || normalize(params.get('to')) || ''
}
