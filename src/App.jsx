import { Link, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Home from './pages/Home.jsx'
import Vendors from './pages/Vendors.jsx'
import VendorDetail from './pages/VendorDetail.jsx'
import Apply from './pages/Apply.jsx'
import Admin from './pages/Admin.jsx'
import Booking from './pages/Booking.jsx'
import VendorAction from './pages/VendorAction.jsx'
import VendorPayouts from './pages/VendorPayouts.jsx'

function ScrollTop() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return null
}

export default function App() {
  return (
    <>
      <ScrollTop />
      <header className="nav">
        <Link to="/" className="logo">I Do <em>Destination</em></Link>
        <nav>
          <NavLink to="/vendors">Find vendors</NavLink>
          <NavLink to="/apply">List your business</NavLink>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/vendors/:slug" element={<VendorDetail />} />
          <Route path="/apply" element={<Apply />} />
          <Route path="/booking/:token" element={<Booking />} />
          <Route path="/vendor-action/:vtoken" element={<VendorAction />} />
          <Route path="/vendor/:mtoken" element={<VendorPayouts />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<div className="wrap section"><h1>Page not found</h1><Link className="btn" to="/">Back home</Link></div>} />
        </Routes>
      </main>
      <footer className="footer">
        <span className="logo">I Do <em>Destination</em></span>
        <p>Every vendor is reviewed by our team. All pricing and trials in Australian dollars.</p>
      </footer>
    </>
  )
}
