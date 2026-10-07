import { useEffect, useState } from 'react'
import { api } from '../api.js'

const blank = { business_name: '', contact_name: '', email: '', phone: '', category: '', destination: '', bio: '', price_from_aud: '', offers_trial: false, trial_price_aud: '', based_in_australia: false, instagram: '', website: '' }

export default function Apply() {
  const [meta, setMeta] = useState(null)
  const [f, setF] = useState(blank)
  const [state, setState] = useState({ busy: false, done: false, error: '' })
  useEffect(() => { api.meta().then(setMeta) }, [])
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  async function submit(e) {
    e.preventDefault()
    setState({ busy: true, done: false, error: '' })
    try {
      await api.apply(f)
      setState({ busy: false, done: true, error: '' })
    } catch (err) {
      setState({ busy: false, done: false, error: err.message })
    }
  }

  if (state.done) return <div className="wrap section narrow"><h1>Application received</h1><p className="lead">Thank you. Our team reviews every application and we'll email you with our decision.</p></div>
  return (
    <div className="wrap section narrow">
      <p className="eyebrow">Vendors</p>
      <h1>Apply to be listed</h1>
      <p className="lead">We approve every vendor by hand. Tell us about your business and we'll be in touch. Pricing is shown to couples in AUD.</p>
      <form className="form" onSubmit={submit}>
        <div className="two">
          <label>Business name *<input required value={f.business_name} onChange={set('business_name')} /></label>
          <label>Your name *<input required value={f.contact_name} onChange={set('contact_name')} /></label>
        </div>
        <div className="two">
          <label>Email *<input required type="email" value={f.email} onChange={set('email')} /></label>
          <label>Phone<input value={f.phone} onChange={set('phone')} /></label>
        </div>
        <div className="two">
          <label>Category *
            <select required value={f.category} onChange={set('category')}>
              <option value="">Select…</option>
              {meta?.categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label>Destination you serve *
            <select required value={f.destination} onChange={set('destination')}>
              <option value="">Select…</option>
              {meta?.destinations.map((d) => <option key={d.name} value={d.name}>{d.name}, {d.country}</option>)}
            </select>
          </label>
        </div>
        <label>About your business * <small>(min. 40 characters)</small><textarea required rows="5" value={f.bio} onChange={set('bio')} /></label>
        <label>Packages start from (AUD)<input type="number" min="0" value={f.price_from_aud} onChange={set('price_from_aud')} /></label>
        <label className="check"><input type="checkbox" checked={f.based_in_australia} onChange={set('based_in_australia')} /> I'm based in Australia (trials can be done before the couple travels)</label>
        <label className="check"><input type="checkbox" checked={f.offers_trial} onChange={set('offers_trial')} /> I offer trials</label>
        {f.offers_trial && <label>Trial price (AUD)<input type="number" min="0" value={f.trial_price_aud} onChange={set('trial_price_aud')} /></label>}
        <div className="two">
          <label>Instagram handle<input value={f.instagram} onChange={set('instagram')} placeholder="@yourbusiness" /></label>
          <label>Website<input value={f.website} onChange={set('website')} placeholder="https://" /></label>
        </div>
        {state.error && <p className="error">{state.error}</p>}
        <button className="btn" disabled={state.busy}>{state.busy ? 'Submitting…' : 'Submit application'}</button>
      </form>
    </div>
  )
}
