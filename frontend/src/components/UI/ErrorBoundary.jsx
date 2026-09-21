import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, isReloading: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('NEXUS-LAND ErrorBoundary caught an exception:', error, errorInfo);
    this.setState({ errorInfo });

    const msg = error?.message || (typeof error === 'string' ? error : error?.toString() || '');
    const isChunkError =
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Loading chunk') ||
      error?.name === 'ChunkLoadError';

    if (isChunkError) {
      const lastReload = sessionStorage.getItem('nexus_last_chunk_reload');
      const now = Date.now();
      if (!lastReload || now - parseInt(lastReload, 10) > 6000) {
        sessionStorage.setItem('nexus_last_chunk_reload', now.toString());
        this.setState({ isReloading: true });
        console.warn('[NEXUS-LAND] ErrorBoundary auto-reloading to load fresh application chunks...');
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    }
  }

  handleReset = () => {
    const msg = this.state.error?.message || (typeof this.state.error === 'string' ? this.state.error : this.state.error?.toString() || '');
    if (
      msg.includes('Failed to fetch dynamically imported module') ||
      msg.includes('Loading chunk') ||
      this.state.error?.name === 'ChunkLoadError'
    ) {
      window.location.reload();
      return;
    }
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

      const msg = this.state.error?.message || (typeof this.state.error === 'string' ? this.state.error : this.state.error?.toString() || '');
      const isChunkError =
        msg.includes('Failed to fetch dynamically imported module') ||
        msg.includes('Loading chunk') ||
        this.state.error?.name === 'ChunkLoadError';

      if (isChunkError || this.state.isReloading) {
        return (
          <div style={{
            padding: '36px 28px',
            margin: '40px auto',
            maxWidth: '640px',
            background: 'rgba(9, 13, 22, 0.96)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 229, 255, 0.35)',
            borderRadius: '14px',
            boxShadow: '0 16px 50px rgba(0, 0, 0, 0.8), 0 0 30px rgba(0, 229, 255, 0.15)',
            color: '#f3f4f6',
            textAlign: 'center',
            fontFamily: "var(--font-body, 'Inter', sans-serif)",
            animation: 'fadeIn 0.25s ease-out'
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(0, 229, 255, 0.12)',
              border: '1px solid #00e5ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              fontSize: 26,
              boxShadow: '0 0 20px rgba(0, 229, 255, 0.3)'
            }}>
              🔄
            </div>

            <div style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              color: '#00e5ff',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              fontWeight: 800,
              marginBottom: 6
            }}>
              APPLICATION ASSET SYNCHRONIZATION
            </div>

            <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10, color: '#ffffff' }}>
              Updating Platform Version
            </h3>

            <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 24, lineHeight: 1.6 }}>
              A new build release was compiled on the host. Synchronizing updated modules and refreshing your view across all tabs...
            </p>

            <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button
                onClick={() => window.location.reload()}
                style={{
                  background: 'linear-gradient(135deg, #00e5ff 0%, #0284c7 100%)',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 24px',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#000',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(0, 229, 255, 0.35)'
                }}
              >
                ⚡ Synchronize &amp; Refresh Now
              </button>
            </div>
          </div>
        );
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
              href="/globe"
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
