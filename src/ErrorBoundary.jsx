import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { err: null };
  }
  static getDerivedStateFromError(error) {
    return { err: error };
  }
  componentDidCatch(error, info) {
    // Optionnel: console / Sentry
    console.error('ErrorBoundary:', error, info);
  }
  render() {
    if (this.state.err) {
      return (
        <div style={{
          padding: 16,
          background: '#1e1e1e',
          color: 'white',
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          overflow: 'auto',
          fontFamily: 'ui-sans-serif, system-ui'
        }}>
          <h1 style={{ fontSize: 18, margin: 0, color: '#ff5f56' }}>
            Une erreur a empêché l’affichage de l’app
          </h1>
          <pre style={{ whiteSpace: 'pre-wrap', marginTop: 12 }}>
            {String(this.state.err && (this.state.err.stack || this.state.err.message || this.state.err))}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
