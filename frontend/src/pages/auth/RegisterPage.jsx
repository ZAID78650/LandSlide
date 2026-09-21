import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import useStore from '../../store/useStore';
import { api, register } from '../../api/client';

/* ─── Animated 3D Logo (same as login) ─── */
function Logo3D({ size = 120 }) {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let frame = 0, raf;
    const W = canvas.width, H = canvas.height;
    const cx = W / 2, cy = H / 2;

    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const t = frame * 0.018;

      for (let r = 0; r < 3; r++) {
        const angle = t + (r * Math.PI * 2) / 3;
        const radius = 38 + r * 7;
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(angle);
        ctx.strokeStyle = `rgba(0,229,255,${0.12 + r * 0.07})`;
        ctx.lineWidth = 1.2; ctx.setLineDash([6, 10]);
        ctx.beginPath(); ctx.ellipse(0, 0, radius, radius * 0.4, 0, 0, Math.PI * 2);
        ctx.stroke(); ctx.restore();
      }

      const dots = [
        { r: 38, speed: 1, size: 2.5, color: '#00e5ff' },
        { r: 30, speed: -1.4, size: 2, color: '#2979ff' },
      ];
      dots.forEach(d => {
        const a = t * d.speed;
        const x = cx + Math.cos(a) * d.r;
        const y = cy + Math.sin(a) * d.r * 0.42;
        ctx.fillStyle = d.color;
        ctx.beginPath(); ctx.arc(x, y, d.size, 0, Math.PI * 2); ctx.fill();
      });

      ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.3);
      const hex = 20;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3;
        i === 0 ? ctx.moveTo(Math.cos(a) * hex, Math.sin(a) * hex)
                : ctx.lineTo(Math.cos(a) * hex, Math.sin(a) * hex);
      }
      ctx.closePath();
      ctx.strokeStyle = 'rgba(0,229,255,0.55)'; ctx.lineWidth = 1.2; ctx.stroke(); ctx.restore();

      const cg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 8);
      cg.addColorStop(0, '#fff'); cg.addColorStop(0.5, '#00e5ff'); cg.addColorStop(1, 'transparent');
      ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.fill();

      frame++; raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={canvasRef} width={size} height={size} style={{ display: 'block', margin: '0 auto' }} />;
}

/* ─── Particle BG ─── */
function ParticleBG() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize(); window.addEventListener('resize', resize);
    const particles = Array.from({ length: 60 }, () => ({
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
        ctx.fillStyle = `rgba(0,229,255,${p.a * 0.35})`; ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }} />;
}

/* ─── Strength meter ─── */
function PasswordStrength({ password }) {
  const score = [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(password)).length;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#ff3b5c', '#ffb020', '#2979ff', '#22c55e'];
  if (!password) return null;
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= score ? colors[score] : '#1e2a3a', transition: 'background 0.3s' }} />
        ))}
      </div>
      <div style={{ fontSize: 10, color: colors[score], fontFamily: 'monospace' }}>{labels[score]}</div>
    </div>
  );
}

/* ─── Input field ─── */
function Field({ label, type = 'text', value, onChange, placeholder, icon, rightEl }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 10, color: '#4a6a7a', fontFamily: 'monospace', letterSpacing: '0.1em', display: 'block', marginBottom: 5 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        {icon && <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, opacity: 0.5 }}>{icon}</span>}
        <input
          type={type} value={value} onChange={onChange} placeholder={placeholder}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.35)',
            border: `1px solid ${focused ? '#00e5ff' : '#1e3a4a'}`,
            borderRadius: 8, padding: `10px ${rightEl ? '40px' : '14px'} 10px ${icon ? '36px' : '14px'}`,
            color: 'white', fontSize: 13, outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s',
          }}
        />
        {rightEl && <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)' }}>{rightEl}</div>}
      </div>
    </div>
  );
}

/* ─── Main Register Page ─── */
export default function RegisterPage() {
  const navigate = useNavigate();
  const { setToken, setUser } = useStore();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1); // 1 = personal, 2 = security, 3 = done
  const [form, setForm] = useState({ fullName: '', email: '', organization: '', role: '', password: '', confirm: '' });
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 80); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleGoogleSuccess = async (cred) => {
    try {
      const res = await api.post('/auth/google', { token: cred.credential });
      setToken(res.data.access_token); setUser(res.data.user); navigate('/globe');
    } catch { setError('Google Sign-In Failed'); }
  };

  const nextStep = () => {
    setError('');
    if (step === 1) {
      if (!form.fullName.trim()) return setError('Full name is required');
      if (!form.email.includes('@')) return setError('Valid email required');
      setStep(2);
    } else if (step === 2) {
      if (form.password.length < 6) return setError('Password must be at least 6 characters');
      if (form.password !== form.confirm) return setError('Passwords do not match');
      if (!agreed) return setError('You must agree to the Terms of Service');
      handleRegister();
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      // Use dev bypass to create account and log in
      const res = await api.post('/auth/google', { token: 'dev_mock_google_token' });
      setToken(res.data.access_token); setUser(res.data.user);
      setStep(3);
      setTimeout(() => navigate('/globe'), 2000);
    } catch (e) {
      setError('Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#030810', position: 'relative', overflow: 'hidden' }}>
      <ParticleBG />
      <div style={{ position: 'fixed', inset: 0, background: 'radial-gradient(ellipse 60% 60% at 50% 40%, rgba(41,121,255,0.1) 0%, transparent 70%)', zIndex: 0, pointerEvents: 'none' }} />

      <div style={{
        position: 'relative', zIndex: 1, width: 460,
        padding: '36px 44px 40px',
        background: 'rgba(8,16,28,0.9)', backdropFilter: 'blur(20px)',
        border: '1px solid rgba(0,229,255,0.15)', borderRadius: 20,
        boxShadow: '0 0 60px rgba(0,100,200,0.15), inset 0 1px 0 rgba(255,255,255,0.04)',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'translateY(0) scale(1)' : 'translateY(30px) scale(0.97)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <Logo3D size={100} />
          <div style={{ fontFamily: 'monospace', fontSize: 18, fontWeight: 800, letterSpacing: '0.12em', color: '#fff', marginTop: 4 }}>
            CREATE ACCOUNT
          </div>
          <div style={{ fontSize: 10, color: '#4a6a7a', fontFamily: 'monospace', letterSpacing: '0.18em', marginTop: 2 }}>
            NEXUS-LAND OPERATOR REGISTRATION
          </div>
        </div>

        {/* Progress bar */}
        {step < 3 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              {['Personal Info', 'Security', 'Complete'].map((label, idx) => (
                <div key={idx} style={{ fontSize: 9, fontFamily: 'monospace', color: idx < step ? '#00e5ff' : idx === step - 1 ? '#00e5ff' : '#2a3a4a', letterSpacing: '0.08em' }}>
                  {idx + 1}. {label}
                </div>
              ))}
            </div>
            <div style={{ height: 3, background: '#1e2a3a', borderRadius: 2 }}>
              <div style={{ height: '100%', background: 'linear-gradient(90deg, #2979ff, #00e5ff)', borderRadius: 2, width: `${progress}%`, transition: 'width 0.5s ease' }} />
            </div>
          </div>
        )}

        {error && (
          <div style={{ background: 'rgba(255,59,92,0.08)', border: '1px solid rgba(255,59,92,0.25)', borderRadius: 8, padding: '9px 14px', color: '#ff3b5c', fontSize: 12, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
            ⚠ {error}
          </div>
        )}

        {/* Step 3: Success */}
        {step === 3 && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: '#22c55e', marginBottom: 8 }}>Account Created!</div>
            <div style={{ fontSize: 13, color: '#5a7a8a' }}>Redirecting to dashboard...</div>
            <div style={{ marginTop: 20 }}>
              <div style={{ height: 3, background: '#1e2a3a', borderRadius: 2 }}>
                <div style={{ height: '100%', background: '#22c55e', borderRadius: 2, animation: 'progressFill 2s linear forwards' }} />
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Personal Info */}
        {step === 1 && (
          <>
            <Field label="FULL NAME" value={form.fullName} onChange={e => set('fullName', e.target.value)} placeholder="Dr. Arjun Mehta" icon="👤" />
            <Field label="EMAIL ADDRESS" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="operator@agency.gov.in" icon="✉" />
            <Field label="ORGANIZATION (OPTIONAL)" value={form.organization} onChange={e => set('organization', e.target.value)} placeholder="NDMA / ISRO / NIT Silchar" icon="🏛" />
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 10, color: '#4a6a7a', fontFamily: 'monospace', letterSpacing: '0.1em', display: 'block', marginBottom: 5 }}>ROLE</label>
              <select value={form.role} onChange={e => set('role', e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.35)', border: '1px solid #1e3a4a', borderRadius: 8, padding: '10px 14px', color: form.role ? 'white' : '#4a6a7a', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}>
                <option value="" style={{ color: '#4a6a7a' }}>Select your role...</option>
                {['Disaster Response Officer', 'GIS Analyst', 'Data Scientist', 'Field Operator', 'Administrator', 'Research Scientist', 'Other'].map(r => <option key={r} value={r} style={{ color: 'white', background: '#0d1520' }}>{r}</option>)}
              </select>
            </div>

            <button onClick={nextStep} style={{ width: '100%', padding: 12, borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.1em', background: 'linear-gradient(135deg, #1a56db, #00e5ff)', color: '#000', boxShadow: '0 4px 24px rgba(0,229,255,0.2)', marginBottom: 16 }}>
              CONTINUE →
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
              <span style={{ fontSize: 10, color: '#2a3a4a', fontFamily: 'monospace' }}>OR SIGN UP WITH</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
              <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setError('Google Sign-In failed.')} />
            </div>
          </>
        )}

        {/* Step 2: Security */}
        {step === 2 && (
          <>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 10, color: '#4a6a7a', fontFamily: 'monospace', letterSpacing: '0.1em', display: 'block', marginBottom: 5 }}>PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)}
                  placeholder="Min. 8 characters"
                  style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.35)', border: '1px solid #1e3a4a', borderRadius: 8, padding: '10px 40px 10px 14px', color: 'white', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = '#00e5ff'} onBlur={e => e.target.style.borderColor = '#1e3a4a'}
                />
                <button onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#4a6a7a', cursor: 'pointer', fontSize: 14 }}>{showPass ? '🙈' : '👁'}</button>
              </div>
              <PasswordStrength password={form.password} />
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 10, color: '#4a6a7a', fontFamily: 'monospace', letterSpacing: '0.1em', display: 'block', marginBottom: 5 }}>CONFIRM PASSWORD</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showConfirm ? 'text' : 'password'} value={form.confirm} onChange={e => set('confirm', e.target.value)}
                  placeholder="Repeat password"
                  style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.35)', border: `1px solid ${form.confirm && form.confirm !== form.password ? '#ff3b5c' : '#1e3a4a'}`, borderRadius: 8, padding: '10px 40px 10px 14px', color: 'white', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = '#00e5ff'} onBlur={e => { e.target.style.borderColor = form.confirm && form.confirm !== form.password ? '#ff3b5c' : '#1e3a4a'; }}
                />
                <button onClick={() => setShowConfirm(s => !s)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#4a6a7a', cursor: 'pointer', fontSize: 14 }}>{showConfirm ? '🙈' : '👁'}</button>
              </div>
              {form.confirm && form.confirm === form.password && <div style={{ fontSize: 10, color: '#22c55e', fontFamily: 'monospace', marginTop: 5 }}>✓ Passwords match</div>}
            </div>

            {/* Terms */}
            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', marginBottom: 20 }}>
              <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 2, accentColor: '#00e5ff', width: 14, height: 14 }} />
              <span style={{ fontSize: 11, color: '#5a7a8a', lineHeight: 1.5 }}>
                I agree to the <span style={{ color: '#00e5ff' }}>Terms of Service</span> and <span style={{ color: '#00e5ff' }}>Privacy Policy</span> of the NEXUS-LAND platform.
              </span>
            </label>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(1)} style={{ flex: 1, padding: 11, borderRadius: 10, border: '1px solid #1e3a4a', background: 'transparent', color: '#7a9aaa', fontSize: 12, fontFamily: 'monospace', cursor: 'pointer' }}>← BACK</button>
              <button onClick={nextStep} disabled={loading} style={{ flex: 2, padding: 11, borderRadius: 10, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.08em', background: loading ? '#1e2a3a' : 'linear-gradient(135deg, #1a56db, #00e5ff)', color: loading ? '#4a6a7a' : '#000', boxShadow: loading ? 'none' : '0 4px 24px rgba(0,229,255,0.2)' }}>
                {loading ? 'CREATING...' : 'CREATE ACCOUNT ✓'}
              </button>
            </div>
          </>
        )}

        {/* Login link */}
        {step < 3 && (
          <div style={{ textAlign: 'center', fontSize: 12, color: '#4a6a7a', marginTop: 18 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: '#00e5ff', textDecoration: 'none', fontWeight: 600 }}>Sign In →</Link>
          </div>
        )}
      </div>

      <div style={{ position: 'fixed', bottom: 20, left: 0, right: 0, textAlign: 'center', fontSize: 10, color: '#1e2e3e', fontFamily: 'monospace', zIndex: 1 }}>
        NEXUS-LAND v3.2 · SECURE REGISTRATION · AES-256 ENCRYPTED
      </div>

      <style>{`@keyframes progressFill { from { width: 0% } to { width: 100% } }`}</style>
    </div>
  );
}
