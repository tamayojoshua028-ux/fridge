import React from 'react'

import { Button } from '@/components/ui'

interface ErrorBoundaryState {
  hasError: boolean
  message: string
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    message: '',
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      message: error.message,
    }
  }

  componentDidCatch(error: Error) {
    console.error(error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
          <div style={{ maxWidth: 440, textAlign: 'center', background: 'var(--surface)', padding: 28, borderRadius: 24, boxShadow: 'var(--shadow-lg)' }}>
            <div style={{ fontSize: 42, marginBottom: 10 }}>⚠️</div>
            <h1 style={{ marginBottom: 10 }}>Something unexpected happened</h1>
            <p style={{ color: 'var(--text2)', marginBottom: 18 }}>{this.state.message || 'Please refresh the app and try again.'}</p>
            <Button onClick={() => window.location.reload()}>Reload App</Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
