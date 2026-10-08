import { Link } from 'react-router-dom'
import { aud, photoUrl } from '../api.js'

export default function VendorCard({ v }) {
  return (
    <Link to={`/vendors/${v.slug}`} className="card">
      <div className="card-photo">
        {v.cover_photo_id
          ? <img src={photoUrl(v.cover_photo_id)} alt={`${v.business_name}, ${v.category} in ${v.destination}`} loading="lazy" />
          : <span className="card-photo-ph" aria-hidden="true">{v.category}</span>}
      </div>
      <div className="card-top">
        <span className="eyebrow">{v.category}</span>
        {v.offers_trial ? <span className="tag">Trial available</span> : null}
      </div>
      <h3>{v.business_name}</h3>
      <p className="muted">{v.destination}</p>
      <p className="clamp">{v.bio}</p>
      <div className="card-foot">
        <span>{v.price_from_aud ? <>From <strong>{aud(v.price_from_aud)}</strong> AUD</> : 'Quote on request'}</span>
        {v.based_in_australia ? <span className="tag ghost">AU-based</span> : null}
      </div>
    </Link>
  )
}
