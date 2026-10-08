import { Component } from 'react'

// Stops one broken widget (for example the map) from blanking the whole page.
export default class ErrorBoundary extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error) { console.error('Component failed to load:', error) }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div className="map map-failed" style={{ height: this.props.height || 220 }} role="alert">
        <p>{this.props.message || 'This part of the page could not load.'}</p>
        <button className="btn ghost" onClick={() => window.location.reload()}>Reload</button>
      </div>
    )
  }
}
