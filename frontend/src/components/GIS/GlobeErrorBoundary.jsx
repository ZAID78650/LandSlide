import React from 'react';

export default class GlobeErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      use2DFallback: false
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('GlobeErrorBoundary caught 3D Globe error:', error, errorInfo);
    this.setState({ errorInfo });
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, use2DFallback: false });
  };

  handleSwitchTo2D = () => {
    this.setState({ use2DFallback: true });
    if (this.props.onSwitchTo2D) {
      this.props.onSwitchTo2D();
    }
  };

  render() {
    if (this.state.hasError || this.state.use2DFallback) {
      if (this.props.fallback2D) {
        return (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <div style={{
              position: 'absolute',
              top: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              background: 'rgba(8, 14, 26, 0.95)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(0, 229, 255, 0.4)',
              borderRadius: 20,
              padding: '6px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              boxShadow: '0 4px 20px rgba(0,0,0,0.6), 0 0 14px rgba(0,229,255,0.2)',
              color: '#f8fafc',
              fontSize: 11,
              fontFamily: 'var(--font-mono, monospace)'
            }}>
              <span style={{ color: 'var(--cyan, #00e5ff)', fontWeight: 700 }}>🌐 2D TACTICAL MAP ACTIVE</span>
              <button
                onClick={this.handleRetry}
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.2), rgba(41, 121, 255, 0.2))',
                  border: '1px solid #00e5ff',
                  color: '#00e5ff',
                  padding: '3px 12px',
                  borderRadius: 12,
                  cursor: 'pointer',
                  fontSize: 10,
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
              >
                ⟳ Launch 3D Globe
              </button>
            </div>
            {this.props.fallback2D}
          </div>
        );
      }

      return (
        <div style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          minHeight: 400,
          background: 'radial-gradient(ellipse at center, #0f172a 0%, #020617 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#e2e8f0',
          padding: 24,
          boxSizing: 'border-box',
          textAlign: 'center'
        }}>
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 16,
            padding: '32px 40px',
            maxWidth: 560,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6)'
          }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28
            }}>
              ⚠️
            </div>

            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.05em', color: '#f8fafc' }}>
              3D WebGL Visualization Disrupted
            </div>

            <div style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
              The 3D WebGL rendering engine encountered a GPU context disruption.
              The application remains stable and no data was lost.
            </div>

            {this.state.error && (
              <div style={{
                fontFamily: 'monospace',
                fontSize: 11,
                color: '#f87171',
                background: 'rgba(0,0,0,0.5)',
                padding: '8px 14px',
                borderRadius: 8,
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
              <button
                onClick={this.handleRetry}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#2563eb',
                  border: 'none',
                  color: '#fff',
                  padding: '9px 18px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 13,
                  transition: 'background 0.2s'
                }}
              >
                ⟳ Retry 3D Globe
              </button>

              {this.props.fallback2D && (
                <button
                  onClick={this.handleSwitchTo2D}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid #475569',
                    color: '#e2e8f0',
                    padding: '9px 18px',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 13,
                    transition: 'border-color 0.2s'
                  }}
                >
                  🗺️ Switch to 2D Map
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
