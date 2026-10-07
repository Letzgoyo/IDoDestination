import { useCallback, useEffect, useState } from 'react'
import { api, aud } from '../api.js'

const KEY = 'ido_admin_token'
const load = () => { try { return sessionStorage.getItem(KEY) || '' } catch { return '' } }

export default function Admin() {
  const [token, setToken] = useState(load)
  const [password, setPassword] = useState('')
  const [vendors, setVendors] = useState([])
  const [bookings, setBookings] = useState([])
  const [filter, setFilter] = useState('pending')
  const [error, setError] = useState('')

  const logout = useCallback(() => { try { sessionStorage.removeItem(KEY) } catch { /* ignore */ } setToken('') }, [])
  const refresh = useCallback(() => api.adminVendors(token).then(setVendors).catch((e) => { if (e.status === 401) logout(); else setError(e.message) }), [token, logout])
  useEffect(() => { if (token) { refresh(); api.adminBookings(token).then(setBookings).catch(() => {}) } }, [token, refresh])

  async function login(e) {
    e.preventDefault()
    setError('')
    try {
      const { token } = await api.login(password)
      try { sessionStorage.setItem(KEY, token) } catch { /* ignore */ }
      setToken(token)
      setPassword('')
    } catch (err) { setError(err.message) }
  }

  async function decide(v, status) {
    const notes = status === 'rejected' ? window.prompt('Optional note to include in the rejection email:') ?? '' : ''
    await api.setStatus(token, v.id, status, notes).catch((e) => setError(e.message))
    refresh()
  }

  if (!token) return (
    <div className="wrap section narrow">
      <h1>Admin</h1>
      <form className="form" onSubmit={login}>
        <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus /></label>
        {error && <p className="error">{error}</p>}
        <button className="btn">Sign in</button>
      </form>
    </div>
  )

  const shown = filter === 'bookings' ? [] : vendors.filter((v) => v.status === filter)
  return (
    <div className="wrap section">
      <div className="row between"><h1>Vendor applications</h1><button className="btn ghost" onClick={logout}>Sign out</button></div>
      <div className="tabs">
        <button className={filter === 'bookings' ? 'on' : ''} onClick={() => setFilter('bookings')}>bookings ({bookings.length})</button>
        {['pending', 'approved', 'rejected'].map((s) => (
          <button key={s} className={filter === s ? 'on' : ''} onClick={() => setFilter(s)}>{s} ({vendors.filter((v) => v.status === s).length})</button>
        ))}
      </div>
      {error && <p className="error">{error}</p>}
      {filter === 'bookings' && (bookings.length === 0 ? <p className="muted">No bookings yet.</p> : (
        <table className="table"><thead><tr><th>Date</th><th>Couple</th><th>Vendor</th><th>Service</th><th>AUD</th><th>Fee</th><th>Status</th></tr></thead>
          <tbody>{bookings.map((x) => <tr key={x.id}><td>{x.created_at}</td><td>{x.couple_name}<br /><span className="muted">{x.couple_email}</span></td><td>{x.business_name}</td><td>{x.service_name}</td><td>{aud(x.amount_aud)}</td><td>{aud(x.fee_aud)}</td><td>{x.status}</td></tr>)}</tbody></table>
      ))}
      {filter !== 'bookings' && shown.length === 0 && <p className="muted">Nothing here.</p>}
      {shown.map((v) => (
        <article key={v.id} className="panel admin-item">
          <div className="row between">
            <div><span className="eyebrow">{v.category} · {v.destination}, {v.country}</span><h3>{v.business_name}</h3></div>
            <span className="muted">{v.created_at}</span>
          </div>
          <p className="pre">{v.bio}</p>
          <p className="muted">
            {v.contact_name} · <a href={`mailto:${v.email}`}>{v.email}</a>{v.phone && ` · ${v.phone}`}<br />
            AU-based: {v.based_in_australia ? 'yes' : 'no'}<br />
            {v.instagram && <>IG {v.instagram} · </>}{v.website && <a href={v.website} target="_blank" rel="noreferrer noopener">{v.website}</a>}
          </p>
          <ul className="plain">{v.services.map((x) => <li key={x.id}>{x.name} ({x.type}) · {aud(x.price_aud)}{x.instant ? ' · pay online' : ' · request'}</li>)}</ul>
          <div className="row">
            {v.status !== 'approved' && <button className="btn" onClick={() => decide(v, 'approved')}>Approve</button>}
            {v.status !== 'rejected' && <button className="btn ghost" onClick={() => decide(v, 'rejected')}>Reject</button>}
            {v.status !== 'pending' && <button className="btn ghost" onClick={() => decide(v, 'pending')}>Move to pending</button>}
          </div>
        </article>
      ))}
    </div>
  )
}
