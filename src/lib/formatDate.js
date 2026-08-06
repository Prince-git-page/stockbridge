export function formatToIST(timestamp, options = {}) {
  if (!timestamp) return '—'
  try {
    // Robust parsing: if timestamp is a string without timezone info, treat as UTC
    let parsed = timestamp
    if (typeof timestamp === 'string' && !/Z|[+-]\d{2}:?\d{2}$/.test(timestamp)) {
      // If it's like '2024-01-02 10:00:00' (no TZ), append 'Z' to parse as UTC
      parsed = timestamp.includes('T') ? `${timestamp}Z` : `${timestamp.replace(' ', 'T')}Z`
    }
    const d = new Date(parsed)
    return d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', ...options })
  } catch (e) {
    return String(timestamp)
  }
}

export default formatToIST
