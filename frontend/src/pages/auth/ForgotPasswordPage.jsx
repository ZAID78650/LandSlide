import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../../api/client';

function ParticleBG() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize(); window.addEventListener('resize', resize);
    const particles = Array.from({ length: 50 }, () => ({
      x: Math.random() * window.innerWidth, y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.2 + 0.3, a: Math.random(),
    }));
    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,229,255,${p.a * 0.3})`; ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try { await forgotPassword(email); setSent(true); } 
    catch { setSent(true); } // show success either way (email privacy)
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#030810', position: 'relative', overflow: 'hidden' }}>
      <ParticleBG />
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 50% 50% at 50% 40%, rgba(0,80,160,0.1) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />

      <div style={{
        position: 'relative', zIndex: 1, width: 400, padding: '44px',
        background: 'rgba(8,16,28,0.9)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0,229,255,0.15)', borderRadius: 20,
        boxShadow: '0 0 60px rgba(0,100,200,0.12)',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>🔐</div>
          <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 800, letterSpacing: '0.12em', color: '#fff' }}>RESET PASSWORD</div>
          <div style={{ fontSize: 10, color: '#4a6a7a', fontFamily: 'monospace', letterSpacing: '0.15em', marginTop: 3 }}>NEXUS-LAND ACCOUNT RECOVERY</div>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>✅</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#22c55e', marginBottom: 8 }}>Recovery Link Sent</div>
            <div style={{ fontSize: 12, color: '#5a7a8a', lineHeight: 1.6 }}>
              If <strong style={{ color: '#fff' }}>{email}</strong> is registered, you will receive a secure reset link shortly.
            </div>
            <Link to="/login" style={{ display: 'inline-block', marginTop: 24, padding: '10px 24px', background: 'linear-gradient(135deg, #1a56db, #00e5ff)', color: '#000', borderRadius: 8, fontSize: 12, fontWeight: 700, fontFamily: 'monospace', textDecoration: 'none' }}>
              ← RETURN TO LOGIN
            </Link>
          </div>
        ) : (
          <>
            <p style={{ fontSize: 12, color: '#5a7a8a', marginBottom: 24, lineHeight: 1.6, textAlign: 'center' }}>
              Enter your registered email and we'll send a secure password reset link.
            </p>
            <form onSubmit={handleSubmit}>
              <label style={{ fontSize: 10, color: '#4a6a7a', fontFamily: 'monospace', letterSpacing: '0.1em', display: 'block', marginBottom: 6 }}>EMAIL ADDRESS</label>
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="operator@agency.gov.in"
                style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.35)', border: '1px solid #1e3a4a', borderRadius: 8, padding: '11px 14px', color: 'white', fontSize: 13, outline: 'none', fontFamily: 'inherit', marginBottom: 20 }}
                onFocus={e => e.target.style.borderColor = '#00e5ff'}
                onBlur={e => e.target.style.borderColor = '#1e3a4a'}
              />
              <button type="submit" disabled={loading} style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.08em', background: loading ? '#1e2a3a' : 'linear-gradient(135deg, #1a56db, #00e5ff)', color: loading ? '#4a6a7a' : '#000', boxShadow: loading ? 'none' : '0 4px 24px rgba(0,229,255,0.2)' }}>
                {loading ? 'SENDING...' : 'SEND RECOVERY LINK →'}
              </button>
            </form>
            <div style={{ textAlign: 'center', marginTop: 18, fontSize: 12, color: '#4a6a7a' }}>
              <Link to="/login" style={{ color: '#00e5ff', textDecoration: 'none' }}>← Back to Login</Link>
              {' · '}
              <Link to="/register" style={{ color: '#00e5ff', textDecoration: 'none' }}>Create Account</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
