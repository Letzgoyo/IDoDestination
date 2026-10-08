import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { usePageMeta } from '../usePageMeta.js'

function ArchPhoto() {
  return (
    <div className="arch-photo">
      <img src="/images/hero.webp" alt="A bride in a white gown looking out over Lake Como from a jetty" width="952" height="688" fetchpriority="high" />
    </div>
  )
}

function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el || !('IntersectionObserver' in window)) { el?.classList.add('in'); return }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('in'); io.disconnect() } }, { threshold: 0.15 })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return <div ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>{children}</div>
}

const DESTS = [
  ['Bali', 'Indonesia', 'g-bali', '/images/bali.webp', '50% 62%'], ['Santorini', 'Greece', 'g-santorini', '/images/santorini.webp', '50% 40%'], ['Tuscany', 'Italy', 'g-tuscany', '/images/tuscany.webp', '30% 50%'],
  ['Fiji', 'Fiji', 'g-fiji', '/images/fiji.webp', '50% 60%'], ['Phuket', 'Thailand', 'g-phuket', '/images/phuket.webp', '50% 50%'], ['Provence', 'France', 'g-provence', '/images/provence.webp', '50% 60%'],
  ['Maldives', 'Maldives', 'g-maldives', '/images/maldives.webp', '50% 55%'], ['Lake Como', 'Italy', 'g-como', '/images/lake-como.webp', '50% 100%'],
]
const CATS = ['Hair & Makeup', 'Photography', 'Videography', 'Venue', 'Planner & Coordinator', 'Florist', 'Celebrant', 'Catering', 'Music & DJ']

export default function Home() {
  usePageMeta('', 'Hand-picked wedding vendors for Australians marrying overseas, with prices in AUD and trials before you fly.')
  return (
    <>
      <section className="hero2">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <p className="eyebrow">For Australians marrying overseas</p>
            <h1>Find the vendors for your <em>destination wedding</em>.</h1>
            <p className="lead">Hand-picked makeup artists, photographers, venues and more across the world's favourite wedding destinations, with prices in AUD and trials before you fly.</p>
            <div className="row">
              <Link className="btn" to="/vendors">Find vendors</Link>
              <a className="btn ghost" href="#destinations">Browse destinations</a>
            </div>
            <ul className="proof">
              <li><strong>Every vendor</strong> checked by us</li>
              <li><strong>Every price</strong> in AUD</li>
              <li><strong>Trials</strong> before you travel</li>
            </ul>
          </div>
          <div className="hero-art"><ArchPhoto /></div>
        </div>
      </section>

      <section className="section wrap">
        <Reveal>
          <p className="eyebrow">Why couples love it</p>
          <h2 className="display">No more <em>exchange-rate</em> surprises.</h2>
        </Reveal>
        <div className="compare">
          <Reveal className="cmp cmp-bad">
            <h3>Booking overseas on your own</h3>
            <ul>
              <li>Quotes in euros, baht, pounds or US dollars</li>
              <li>Exchange rate moves between deposit and final payment</li>
              <li>Card and conversion fees you don't see coming</li>
              <li>No trial, so you meet your makeup artist on the day itself</li>
            </ul>
          </Reveal>
          <Reveal className="cmp cmp-good" delay={120}>
            <h3>Booking with I Do Destination</h3>
            <ul>
              <li>Every price shown and charged in AUD</li>
              <li>The price you book is the price you pay</li>
              <li>Pay securely online, with refunds in AUD too</li>
              <li>Hair and makeup trials with Australian-based artists before you fly</li>
            </ul>
          </Reveal>
        </div>
      </section>

      <section id="destinations" className="section wrap">
        <Reveal><p className="eyebrow">Destinations</p><h2 className="display">Where are you saying <em>I do</em>?</h2></Reveal>
        <div className="dest-grid">
          {DESTS.map(([name, country, g, photo, pos], i) => (
            <Reveal key={name} delay={i * 60} className="dest-wrap">
              <Link to={`/vendors?destination=${encodeURIComponent(name)}`} className={`dest ${g}${photo ? ' has-photo' : ''}`} style={photo ? { '--photo': `url(${photo})`, '--pos': pos } : undefined}>
                <span className="dest-country">{country}</span>
                <span className="dest-name">{name}</span>
                <span className="dest-go">View vendors →</span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="how" className="how">
        <div className="wrap">
          <Reveal><p className="eyebrow">How it works</p><h2 className="display">From first look to <em>booked</em>, simply.</h2></Reveal>
          <ol className="steps">
            {[
              ['Find', 'Browse approved vendors on the map by destination and category.'],
              ['Book or request', 'Book and pay in AUD straight away, or send a request and the vendor confirms.'],
              ['Try before you fly', 'Do your hair and makeup trial at home with an Australian-based artist.'],
              ['Say I do', 'Your team is locked in and paid in dollars, with a clear cancellation policy.'],
            ].map(([t, d], i) => (
              <Reveal key={t} delay={i * 90}><li><span className="num">{String(i + 1).padStart(2, '0')}</span><h3>{t}</h3><p>{d}</p></li></Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section className="section wrap">
        <Reveal><p className="eyebrow">Browse by service</p><h2 className="display">Everyone you need for <em>the big day</em>.</h2></Reveal>
        <Reveal className="chips" delay={100}>
          {CATS.map((c) => <Link key={c} to={`/vendors?category=${encodeURIComponent(c)}`} className="chip">{c}</Link>)}
        </Reveal>
      </section>

      <section className="band2">
        <div className="wrap band2-in">
          <Reveal>
            <p className="eyebrow">Ready when you are</p>
            <h2 className="display">Start finding your <em>wedding team</em>.</h2>
            <p className="lead">Explore approved vendors on the map, compare prices in AUD, and book with confidence.</p>
            <Link className="btn" to="/vendors">Find vendors</Link>
          </Reveal>
        </div>
      </section>
    </>
  )
}
