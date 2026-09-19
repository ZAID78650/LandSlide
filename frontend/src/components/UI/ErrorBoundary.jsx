import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('NEXUS-LAND ErrorBoundary caught an exception:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      return (
        <div style={{
          padding: '32px 24px',
          margin: '20px auto',
          maxWidth: '680px',
          background: 'rgba(26, 28, 38, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 59, 92, 0.35)',
          borderRadius: '12px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 24px rgba(255, 59, 92, 0.1)',
          color: 'var(--text-primary)',
          textAlign: 'center',
          fontFamily: 'var(--font-body)',
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <div style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'rgba(255, 59, 92, 0.15)',
            border: '1px solid var(--red)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: 24,
            boxShadow: '0 0 16px rgba(255, 59, 92, 0.3)'
          }}>
            ⚠️
          </div>

          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--red)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 700,
            marginBottom: 6
          }}>
            SYSTEM SUBSYSTEM RECOVERY
          </div>

          <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: '#fff' }}>
            {this.props.title || 'Component Unrest Detected'}
          </h3>

          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
            {this.props.description || 'A module error was caught by the fault-isolation boundary. Core telemetry and background monitoring remain operational.'}
          </p>

          {this.state.error && (
            <div style={{
              background: 'rgba(10, 12, 16, 0.8)',
              border: '1px solid var(--border-default)',
              borderRadius: 6,
              padding: '10px 14px',
              textAlign: 'left',
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--red)',
              overflowX: 'auto',
              marginBottom: 24,
              maxHeight: 120
            }}>
              {this.state.error.toString()}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={this.handleReset}
              className="btn btn-primary"
              style={{ padding: '8px 20px', fontSize: 12, borderRadius: 6 }}
            >
              🔄 Retry Module
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-secondary"
              style={{ padding: '8px 20px', fontSize: 12, borderRadius: 6 }}
            >
              ⚡ Full System Reload
            </button>
            <a
              href="/dashboard"
              className="btn btn-ghost"
              style={{ padding: '8px 16px', fontSize: 12, textDecoration: 'none' }}
            >
              ← Command Center
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
