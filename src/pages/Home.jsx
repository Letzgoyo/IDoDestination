import { Link } from 'react-router-dom'

const points = [
  ['Book and pay in AUD', 'Services, deposits and trials priced and paid in Australian dollars. No euros, pounds or baht, and no exchange-rate surprises.'],
  ['Trials before you fly', 'Hair and makeup trials at home in Australia, so you know exactly what you are getting before the big day.'],
  ['Every vendor approved', 'Vendors apply and are individually reviewed by our team before they appear on the map.'],
]

export default function Home() {
  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow">For Australians marrying overseas</p>
          <h1>Say <em>I do</em> anywhere.<br />Pay in dollars you recognise.</h1>
          <p className="lead">A curated marketplace of approved wedding vendors across the world's most loved destinations. Browse, request or book, and pay in AUD, with trials before you travel.</p>
          <div className="row">
            <Link className="btn" to="/vendors">Explore the map</Link>
            <Link className="btn ghost" to="/apply">Apply as a vendor</Link>
          </div>
        </div>
      </section>
      <section className="section wrap">
        <div className="grid3">
          {points.map(([t, d]) => (
            <div key={t} className="point"><h3>{t}</h3><p>{d}</p></div>
          ))}
        </div>
      </section>
      <section className="band">
        <div className="wrap">
          <h2>Are you a wedding professional?</h2>
          <p className="lead">Reach Australian couples planning destination weddings. Applications are reviewed by hand to keep the standard high.</p>
          <Link className="btn gold" to="/apply">Apply to be listed</Link>
        </div>
      </section>
    </>
  )
}
