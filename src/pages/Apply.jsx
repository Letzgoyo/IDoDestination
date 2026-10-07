import { useEffect, useState } from 'react'
import { api } from '../api.js'

const blank = { business_name: '', contact_name: '', email: '', phone: '', category: '', destination: '', bio: '', services: [{ name: '', description: '', type: 'package', price_aud: '', instant: false }], based_in_australia: false, instagram: '', website: '' }

export default function Apply() {
  const [meta, setMeta] = useState(null)
  const [f, setF] = useState(blank)
  const [state, setState] = useState({ busy: false, done: false, error: '' })
  useEffect(() => { api.meta().then(setMeta) }, [])
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  const setSvc = (i, k) => (e) => setF({ ...f, services: f.services.map((x, j) => (j === i ? { ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value } : x)) })
  const addSvc = () => setF({ ...f, services: [...f.services, { name: '', description: '', type: 'package', price_aud: '', instant: false }] })
  const delSvc = (i) => setF({ ...f, services: f.services.filter((_, j) => j !== i) })

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
        <label className="check"><input type="checkbox" checked={f.based_in_australia} onChange={set('based_in_australia')} /> I'm based in Australia (trials can be done before the couple travels)</label>
        <h2 className="h-sm">Services &amp; pricing <small className="muted">AUD</small></h2>
        {f.services.map((x, i) => (
          <fieldset key={i} className="svc-field">
            <div className="two">
              <label>Service name *<input required value={x.name} onChange={setSvc(i, 'name')} placeholder="e.g. Bridal trial, Wedding day package" /></label>
              <label>Price (AUD) *<input required type="number" min="1" value={x.price_aud} onChange={setSvc(i, 'price_aud')} /></label>
            </div>
            <div className="two">
              <label>Type
                <select value={x.type} onChange={setSvc(i, 'type')}>
                  <option value="trial">Trial</option><option value="package">Package</option><option value="deposit">Deposit</option>
                </select>
              </label>
              <label>Description<input value={x.description} onChange={setSvc(i, 'description')} /></label>
            </div>
            <label className="check"><input type="checkbox" checked={x.instant} onChange={setSvc(i, 'instant')} /> Couples can pay online immediately once you've connected payouts (otherwise they send a request and you confirm)</label>
            {f.services.length > 1 && <button type="button" className="link" onClick={() => delSvc(i)}>Remove service</button>}
          </fieldset>
        ))}
        {f.services.length < 8 && <button type="button" className="btn ghost" onClick={addSvc}>+ Add another service</button>}
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
