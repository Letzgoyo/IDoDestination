async function request(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(data.error || 'Something went wrong'), { status: res.status })
  return data
}

export const api = {
  meta: () => request('/meta'),
  vendors: () => request('/vendors'),
  vendor: (slug) => request(`/vendors/${slug}`),
  apply: (body) => request('/apply', { method: 'POST', body }),
  enquire: (slug, body) => request(`/vendors/${slug}/enquire`, { method: 'POST', body }),
  book: (body) => request('/bookings', { method: 'POST', body }),
  booking: (token) => request(`/bookings/${token}`),
  pay: (token) => request(`/bookings/${token}/pay`, { method: 'POST' }),
  vendorAction: (vt) => request(`/vendor-actions/${vt}`),
  respond: (vt, action) => request(`/vendor-actions/${vt}`, { method: 'POST', body: { action } }),
  adminBookings: (token) => request('/admin/bookings', { token }),
  manage: (t) => request(`/manage/${t}`),
  onboard: (t, country) => request(`/manage/${t}/onboard`, { method: 'POST', body: { country } }),
  login: (password) => request('/admin/login', { method: 'POST', body: { password } }),
  adminVendors: (token) => request('/admin/vendors', { token }),
  setStatus: (token, id, status, notes) => request(`/admin/vendors/${id}/status`, { method: 'POST', body: { status, notes }, token }),
}

export const aud = (n) => (n == null ? null : `A$${n.toLocaleString('en-AU')}`)
