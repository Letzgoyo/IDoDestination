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
  cancel: (t) => request(`/bookings/${t}/cancel`, { method: 'POST' }),
  policy: () => request('/policy'),
  adminRefund: (token, id, amount) => request(`/admin/bookings/${id}/refund`, { method: 'POST', body: amount == null ? {} : { amount_aud: amount }, token }),
  login: (password) => request('/admin/login', { method: 'POST', body: { password } }),
  adminVendors: (token) => request('/admin/vendors', { token }),
  setStatus: (token, id, status, notes) => request(`/admin/vendors/${id}/status`, { method: 'POST', body: { status, notes }, token }),
}

// Shrink a photo in the browser before upload (max 1600px wide, JPEG) so phones' multi-MB images are fine.
export async function prepareImage(file, maxW = 1600) {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' })
  const scale = Math.min(1, maxW / bmp.width)
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(bmp.width * scale)
  canvas.height = Math.round(bmp.height * scale)
  canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height)
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not read that image'))), 'image/jpeg', 0.86))
}

export async function uploadPhoto(token, blob) {
  const res = await fetch(`/api/uploads/${token}`, { method: 'POST', headers: { 'Content-Type': blob.type || 'image/jpeg' }, body: blob })
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Photo upload failed')
}

export const photoUrl = (id) => `/api/photos/${id}`

export const aud = (n) => (n == null ? null : `A$${n.toLocaleString('en-AU')}`)
