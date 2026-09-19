import React, { useEffect, useState, useRef } from 'react';

const SESSION_ID = 'nexus-session-' + Date.now();

const INITIAL_MSG = {
  id: 0, role: 'assistant',
  content: "👋 Hi! I'm **LANDSense AI Copilot**, your intelligent disaster monitoring assistant.\n\nI can help you with:\n\n- 🌋 **Landslide Intelligence** — active incidents, risk scores, sensor data\n- 🌍 **Terrain Analysis** — elevation, slope, DEM data\n- 📡 **Sensor Network** — live IoT readings, anomalies\n- 🛰 **Satellite Analysis** — change detection, ground movement\n- 🧠 **AI Predictions** — model outputs, confidence, explainability\n- 🚨 **Emergency Response** — protocols, evacuation, resource dispatch\n\nWhat would you like to investigate?",
  timestamp: new Date().toISOString(),
};

function MarkdownText({ content }) {
  if (!content) return null;
  const lines = content.split('\n');
  const elements = [];
  let i = 0;

  const isTableSeparator = (l) => /^\|?[\s:|-]+\|/.test(l);
  const isTableRow = (l) => l.trim().startsWith('|') && l.trim().endsWith('|');

  while (i < lines.length) {
    const line = lines[i];

    // ── Tables ──
    if (isTableRow(line)) {
      const tableLines = [];
      while (i < lines.length && (isTableRow(lines[i]) || isTableSeparator(lines[i]))) {
        tableLines.push(lines[i]);
        i++;
      }
      const headerCells = tableLines[0].split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
      const bodyRows = tableLines.slice(2).filter(l => !isTableSeparator(l));
      elements.push(
        <div key={`t${i}`} style={{ overflowX: 'auto', margin: '10px 0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, fontFamily: 'inherit' }}>
            <thead>
              <tr>
                {headerCells.map((cell, ci) => (
                  <th key={ci} style={{
                    padding: '7px 12px', textAlign: 'left',
                    background: 'rgba(0,229,255,0.08)',
                    borderBottom: '1px solid rgba(0,229,255,0.3)',
                    color: '#00e5ff', fontWeight: 700, fontSize: 11,
                    letterSpacing: '0.05em', whiteSpace: 'nowrap',
                  }}>{renderInline(cell.trim())}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bodyRows.map((row, ri) => {
                const cells = row.split('|').filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
                return (
                  <tr key={ri} style={{ background: ri % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent' }}>
                    {cells.map((cell, ci) => (
                      <td key={ci} style={{
                        padding: '6px 12px',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        color: ci === 0 ? '#e2e8f0' : '#94a3b8',
                        verticalAlign: 'top',
                      }}>{renderInline(cell.trim())}</td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // ── Headings ──
    if (line.startsWith('#### ')) {
      elements.push(<div key={i} style={{ fontWeight: 700, fontSize: 12, color: '#7dd3fc', marginTop: 8, marginBottom: 2 }}>{renderInline(line.slice(5))}</div>);
    } else if (line.startsWith('### ')) {
      elements.push(<div key={i} style={{ fontWeight: 700, fontSize: 13, color: '#00e5ff', marginTop: 10, marginBottom: 3 }}>{renderInline(line.slice(4))}</div>);
    } else if (line.startsWith('## ')) {
      elements.push(<div key={i} style={{ fontWeight: 700, fontSize: 14, color: '#00e5ff', marginTop: 12, marginBottom: 4, borderBottom: '1px solid rgba(0,229,255,0.2)', paddingBottom: 4 }}>{renderInline(line.slice(3))}</div>);
    } else if (line.startsWith('# ')) {
      elements.push(<div key={i} style={{ fontWeight: 800, fontSize: 16, color: '#00e5ff', marginTop: 14, marginBottom: 6, borderBottom: '1px solid rgba(0,229,255,0.3)', paddingBottom: 5 }}>{renderInline(line.slice(2))}</div>);

    // ── Bullets ──
    } else if (line.match(/^(\s{2,4})?[-*•]\s/)) {
      const indent = line.match(/^(\s+)/)?.[1]?.length || 0;
      const text = line.replace(/^\s*[-*•]\s/, '');
      elements.push(
        <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 3, marginLeft: indent > 0 ? 20 : 0 }}>
          <span style={{ color: indent > 0 ? '#4a7a8a' : '#00e5ff', flexShrink: 0, fontSize: indent > 0 ? 10 : 13, marginTop: 2 }}>
            {indent > 0 ? '◦' : '•'}
          </span>
          <span style={{ color: '#cbd5e1', lineHeight: 1.6 }}>{renderInline(text)}</span>
        </div>
      );

    // ── Numbered list ──
    } else if (/^\d+\.\s/.test(line)) {
      const match = line.match(/^(\d+)\.\s(.*)/);
      elements.push(
        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
          <span style={{ color: '#00e5ff', flexShrink: 0, fontWeight: 700, minWidth: 20, fontFamily: 'monospace', fontSize: 12 }}>{match[1]}.</span>
          <span style={{ color: '#cbd5e1', lineHeight: 1.6 }}>{renderInline(match[2])}</span>
        </div>
      );

    // ── Code block ──
    } else if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) { codeLines.push(lines[i]); i++; }
      elements.push(
        <div key={i} style={{ margin: '8px 0' }}>
          {lang && <div style={{ fontSize: 9, fontFamily: 'monospace', color: '#4a7a8a', background: 'rgba(0,0,0,0.4)', padding: '3px 12px', borderRadius: '6px 6px 0 0', borderTop: '1px solid #1e3a4a', borderLeft: '1px solid #1e3a4a', borderRight: '1px solid #1e3a4a' }}>{lang.toUpperCase()}</div>}
          <pre style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #1e3a4a', borderRadius: lang ? '0 0 6px 6px' : 6, padding: '10px 14px', overflowX: 'auto', margin: 0, fontSize: 12, fontFamily: 'monospace', color: '#7dd3fc', lineHeight: 1.5 }}>
            <code>{codeLines.join('\n')}</code>
          </pre>
        </div>
      );

    // ── Horizontal rule ──
    } else if (/^(━+|---+|\*\*\*+|___+)$/.test(line.trim())) {
      elements.push(<div key={i} style={{ borderTop: '1px solid #1e3a4a', margin: '12px 0' }} />);

    // ── Blockquote ──
    } else if (line.startsWith('> ')) {
      elements.push(
        <div key={i} style={{ borderLeft: '3px solid rgba(0,229,255,0.4)', paddingLeft: 12, margin: '6px 0', color: '#94a3b8', fontStyle: 'italic', fontSize: 12 }}>
          {renderInline(line.slice(2))}
        </div>
      );

    // ── Empty line ──
    } else if (line.trim() === '') {
      if (elements.length > 0) elements.push(<div key={i} style={{ height: 6 }} />);

    // ── Normal paragraph ──
    } else {
      elements.push(<div key={i} style={{ marginBottom: 3, lineHeight: 1.7, color: '#cbd5e1' }}>{renderInline(line)}</div>);
    }
    i++;
  }
  return <div>{elements}</div>;
}

function renderInline(text) {
  if (!text) return text;
  // Split on bold, inline code, italic, strikethrough
  const parts = text.split(/(\*\*.*?\*\*|`[^`]+`|\*[^*]+\*|~~.*?~~)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={i} style={{ color: '#e2e8f0', fontWeight: 700 }}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={i} style={{ background: 'rgba(0,229,255,0.1)', color: '#7dd3fc', padding: '1px 6px', borderRadius: 3, fontFamily: 'monospace', fontSize: 11 }}>{part.slice(1, -1)}</code>;
    if (part.startsWith('~~') && part.endsWith('~~')) return <s key={i} style={{ color: '#64748b' }}>{part.slice(2, -2)}</s>;
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) return <em key={i} style={{ color: '#94a3b8' }}>{part.slice(1, -1)}</em>;
    return part;
  });
}


const SUGGESTION_GROUPS = [
  {
    label: '🌋 DISASTER',
    items: [
      'What is the current landslide risk in Sikkim?',
      'Show active incidents in Manipur',
      'What are the latest sensor readings?',
      'Analyze the GLOF threat in Arunachal Pradesh',
    ]
  },
  {
    label: '🧠 AI/ML',
    items: [
      'Explain the Landslide4Sense model pipeline',
      'How does ResU-Net segmentation work?',
      'What confidence level do the predictions have?',
      'Show me the model performance metrics',
    ]
  },
  {
    label: '📡 MONITORING',
    items: [
      'Which sensors are currently offline?',
      'Show rainfall trends for the last 24 hours',
      'What is the soil moisture in Meghalaya?',
      'Display active IoT alerts',
    ]
  }
];

const AGENT_PIPELINE = [
  { name: 'Weather Agent', icon: '🌧', status: 'active', latency: '12ms' },
  { name: 'Sensor Agent', icon: '📡', status: 'active', latency: '8ms' },
  { name: 'Satellite Agent', icon: '🛰', status: 'active', latency: '45ms' },
  { name: 'Risk Agent', icon: '⚡', status: 'active', latency: '23ms' },
  { name: 'Response Agent', icon: '🚨', status: 'standby', latency: '—' },
  { name: 'Alert Agent', icon: '🔔', status: 'standby', latency: '—' },
];

export default function AICopilotPage() {
  const [messages, setMessages] = useState([INITIAL_MSG]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeGroup, setActiveGroup] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (bottomRef.current) bottomRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
  const GROQ_MODEL = 'qwen/qwen3.8-27b';

  const SYSTEM_PROMPT = `You are LANDSense AI Copilot — an expert disaster intelligence assistant embedded inside a real-time multi-hazard monitoring platform called LandSlide Intelligence System.

You specialize in:
- 🌋 Volcanic eruptions, lava flows, ashfall risk analysis
- 🌊 Floods, rainfall-induced landslides, GLOF (Glacial Lake Outburst Floods)
- 🌀 Cyclones, storm surge, tropical storm tracking
- ⚡ Earthquakes, seismic swarms, tectonic plate activity
- 🏔 Landslides, soil saturation, slope stability analysis
- 📡 IoT sensor networks, real-time anomaly detection
- 🛰 Satellite imagery analysis, change detection, DEM data
- 🧠 AI/ML model explanations (ResU-Net, Landslide4Sense, risk scoring)
- 🚨 Emergency response protocols, evacuation planning, resource dispatch

Always respond with:
1. Clear, actionable intelligence
2. Specific numbers, percentages, and risk scores where applicable
3. Precautionary recommendations when relevant
4. Markdown formatting with headers, bullets, and bold text
5. Scientific but accessible language

If asked about a specific location, provide location-specific risk context. Be direct and concise.`;

  // Build conversation history for multi-turn context
  const buildGroqMessages = (history, newUserMsg) => {
    const groqHistory = history
      .filter(m => m.role === 'user' || m.role === 'assistant')
      .slice(-10)
      .map(m => ({
        role: m.role,
        // Strip any leftover <think> blocks from prior assistant messages in history
        content: m.content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim(),
      }));
    // Prepend /think to activate Qwen3's native chain-of-thought reasoning mode
    groqHistory.push({ role: 'user', content: `/think\n\n${newUserMsg}` });
    return groqHistory;
  };

  const send = async (text) => {
    const msg = text || input;
    if (!msg.trim() || loading) return;
    const userMsg = { id: Date.now(), role: 'user', content: msg, timestamp: new Date().toISOString() };
    setMessages(p => [...p, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const groqMessages = buildGroqMessages(messages, msg);
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            { role: 'system', content: SYSTEM_PROMPT },
            ...groqMessages,
          ],
          temperature: 0.6,
          max_tokens: 16000,
          stream: false,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error?.message || `Groq API error ${res.status}`);
      }
      const data = await res.json();
      const choice = data.choices?.[0]?.message;
      // Strip Qwen3's internal <think>...</think> reasoning block — only show the final answer
      const raw = choice?.content || 'No response received.';
      const aiContent = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      setMessages(p => [...p, {
        id: Date.now(),
        role: 'assistant',
        content: aiContent,
        timestamp: new Date().toISOString(),
      }]);
    } catch (err) {
      setMessages(p => [...p, {
        id: Date.now(), role: 'assistant',
        content: `⚠️ **AI Error**\n\n${err.message || 'Connection to Groq AI failed. Please try again.'}`,
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };


  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
      {/* Main Chat */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{
          padding: '14px 24px', borderBottom: '1px solid var(--border-subtle)',
          background: 'var(--bg-panel)', display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0,
        }}>
          <div style={{
            width: 40, height: 40, background: 'linear-gradient(135deg, #1a56db, #00e5ff)',
            borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, boxShadow: '0 0 20px rgba(0,229,255,0.35)',
          }}>✦</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>LANDSense AI Copilot</div>
            <div style={{ fontSize: 10, color: 'var(--cyan)', fontFamily: 'monospace', letterSpacing: '0.08em' }}>
              GROQ · QWEN3-27B · THINKING MODE · ACTIVE
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, background: '#22c55e', borderRadius: '50%', boxShadow: '0 0 8px #22c55e' }} />
              <span style={{ fontSize: 11, color: '#22c55e', fontFamily: 'monospace' }}>ONLINE</span>
            </div>
            <div style={{
              padding: '4px 10px', borderRadius: 4,
              background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.15)',
              fontSize: 9, fontFamily: 'monospace', color: 'var(--cyan)',
            }}>
              {messages.length - 1} MESSAGES
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{
              display: 'flex', flexDirection: 'column',
              alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', gap: 4,
              animation: 'fadeInUp 0.3s ease-out',
            }}>
              {msg.role === 'assistant' && (
                <div style={{
                  fontSize: 9, color: 'var(--cyan)', fontFamily: 'monospace',
                  marginLeft: 4, letterSpacing: '0.08em',
                }}>LANDSense AI</div>
              )}
              <div style={{
                maxWidth: '75%',
                padding: '12px 16px',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg, #1a56db, #0e3fa0)'
                  : 'rgba(15, 23, 35, 0.9)',
                border: msg.role === 'user' ? 'none' : '1px solid #1e2a3a',
                color: '#e2e8f0', fontSize: 13, lineHeight: 1.6,
                boxShadow: msg.role === 'assistant' ? '0 2px 12px rgba(0,0,0,0.3)' : 'none',
              }}>
                {msg.role === 'assistant' ? <MarkdownText content={msg.content} /> : msg.content}
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: 9, color: 'var(--text-muted)', margin: '0 4px' }}>
                {new Date(msg.timestamp).toUTCString().slice(17, 25)} UTC
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
              <div style={{ fontSize: 9, color: 'var(--cyan)', fontFamily: 'monospace', marginLeft: 4 }}>LANDSense AI</div>
              <div style={{
                padding: '14px 18px', borderRadius: '4px 16px 16px 16px',
                background: 'rgba(15, 23, 35, 0.9)', border: '1px solid #1e2a3a',
                display: 'flex', gap: 5, alignItems: 'center',
              }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: 'var(--cyan)',
                    animation: `pulse-cyan 1.2s ${i * 0.22}s infinite`,
                  }} />
                ))}
                <span style={{ fontSize: 11, color: '#4a6a7a', marginLeft: 4, fontFamily: 'monospace' }}>
                  Analyzing data sources...
                </span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{
          padding: '14px 24px', borderTop: '1px solid var(--border-subtle)',
          background: 'var(--bg-panel)', display: 'flex', gap: 10, alignItems: 'center',
        }}>
          <input
            ref={inputRef}
            placeholder="Ask about disasters, terrain, sensors, AI predictions..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            style={{
              flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid #1e2a3a',
              borderRadius: 10, padding: '10px 16px', color: 'white', fontSize: 13,
              outline: 'none', fontFamily: 'inherit',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(0,229,255,0.3)'}
            onBlur={e => e.target.style.borderColor = '#1e2a3a'}
          />
          <button
            onClick={() => send()}
            disabled={loading || !input.trim()}
            style={{
              background: loading || !input.trim() ? '#1e2a3a' : 'linear-gradient(135deg, #1a56db, #00e5ff)',
              color: loading || !input.trim() ? '#4a6a7a' : '#000',
              border: 'none', borderRadius: 10, padding: '10px 20px',
              fontSize: 13, fontWeight: 700,
              cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
            }}
          >Send ↑</button>
        </div>
      </div>

      {/* Right Sidebar */}
      <div style={{
        width: 280, background: 'var(--bg-panel)', borderLeft: '1px solid var(--border-subtle)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Suggestion Tabs */}
        <div style={{ padding: '12px 12px 0' }}>
          <div style={{ fontSize: 9, color: '#4a6a7a', fontFamily: 'monospace', fontWeight: 600, marginBottom: 8, letterSpacing: '0.08em' }}>SUGGESTED QUERIES</div>
          <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
            {SUGGESTION_GROUPS.map((g, idx) => (
              <button key={idx} onClick={() => setActiveGroup(idx)} style={{
                fontSize: 9, padding: '3px 8px', borderRadius: 4, border: 'none', cursor: 'pointer',
                fontFamily: 'monospace',
                background: activeGroup === idx ? 'var(--cyan)' : '#1e2a3a',
                color: activeGroup === idx ? '#000' : '#5a7a8a',
                transition: 'all 0.15s',
              }}>{g.label}</button>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {SUGGESTION_GROUPS[activeGroup].items.map(s => (
              <button key={s} onClick={() => send(s)} style={{
                textAlign: 'left', background: 'rgba(0,229,255,0.04)',
                border: '1px solid #1e2a3a', borderRadius: 6, padding: '7px 10px',
                color: '#8a9aaa', fontSize: 11, cursor: 'pointer', lineHeight: 1.4,
                fontFamily: 'inherit', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.target.style.borderColor = '#00e5ff'; e.target.style.color = '#00e5ff'; }}
              onMouseLeave={e => { e.target.style.borderColor = '#1e2a3a'; e.target.style.color = '#8a9aaa'; }}
              >{s}</button>
            ))}
          </div>
        </div>

        {/* Agent Pipeline */}
        <div style={{ padding: '14px 12px', borderTop: '1px solid var(--border-subtle)', marginTop: 12 }}>
          <div style={{ fontSize: 9, color: '#4a6a7a', fontFamily: 'monospace', fontWeight: 600, marginBottom: 8, letterSpacing: '0.08em' }}>
            AGENT PIPELINE
          </div>
          {AGENT_PIPELINE.map(({ name, icon, status, latency }, idx) => (
            <div key={name} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0',
              borderBottom: idx < AGENT_PIPELINE.length - 1 ? '1px solid #0d1520' : 'none',
              position: 'relative',
            }}>
              {/* Pipeline connector */}
              {idx < AGENT_PIPELINE.length - 1 && (
                <div style={{
                  position: 'absolute', left: 14, top: 22,
                  width: 1, height: 10,
                  background: status === 'active' ? 'rgba(0,229,255,0.2)' : 'rgba(255,255,255,0.04)',
                }} />
              )}
              <span style={{ fontSize: 12 }}>{icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, color: status === 'active' ? '#ccc' : '#5a6a7a' }}>{name}</div>
                <div style={{ fontSize: 8, fontFamily: 'monospace', color: '#3a4a5a' }}>{latency}</div>
              </div>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: status === 'active' ? '#22c55e' : '#3a4a5a',
                boxShadow: status === 'active' ? '0 0 6px #22c55e' : 'none',
              }} />
            </div>
          ))}
        </div>

        {/* Capabilities */}
        <div style={{ padding: '14px 12px', borderTop: '1px solid var(--border-subtle)', marginTop: 'auto' }}>
          <div style={{ fontSize: 9, color: '#4a6a7a', fontFamily: 'monospace', fontWeight: 600, marginBottom: 8, letterSpacing: '0.08em' }}>CAPABILITIES</div>
          {[
            '🌋 Landslide Intelligence',
            '📡 Real-Time Sensor Data',
            '🛰 Satellite Analysis',
            '🧠 AI Risk Assessment',
            '🚨 Emergency Response',
          ].map(cap => (
            <div key={cap} style={{ fontSize: 10, color: '#5a6a7a', padding: '3px 0' }}>{cap}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
