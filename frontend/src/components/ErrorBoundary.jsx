import { Component } from 'react'

export default class ErrorBoundary extends Component {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error, info) {
    console.error('Unhandled UI error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6">
          <h2 className="text-2xl mb-3">Something went quiet for a moment.</h2>
          <p className="text-charcoal/70 mb-6">Please refresh the page — we'll be right here.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-full bg-olive text-warmwhite hover:bg-charcoal transition-colors"
          >
            Refresh
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
