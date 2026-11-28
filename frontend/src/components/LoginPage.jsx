import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

const ROLES = [
  {
    id: 'port',
    label: 'Port Authority',
    users: [
      { email: 'admin@mangaloreport.in', password: 'port123', name: 'Cmdr. Ravi Nair' },
      { email: 'ops@kochiseaport.in',    password: 'port123', name: 'Supt. Priya Menon' },
    ],
  },
  {
    id: 'shipping',
    label: 'Shipping Company',
    users: [
      { email: 'fleet@indiashipping.in', password: 'ship123', name: 'Capt. Arjun Sharma' },
      { email: 'ops@coastallines.in',    password: 'ship123', name: 'Mgr. Deepa Krishnan' },
    ],
  },
  {
    id: 'cargo',
    label: 'Cargo Owner',
    users: [
      { email: 'logistics@agroindia.in', password: 'cargo123', name: 'Rajesh Gupta' },
      { email: 'supply@spicetraders.in', password: 'cargo123', name: 'Anitha Nambiar' },
    ],
  },
];

export default function LoginPage({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState('port');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const fillDemo = (u) => { setEmail(u.email); setPassword(u.password); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    const role  = ROLES.find((r) => r.id === selectedRole);
    const match = role.users.find((u) => u.email === email && u.password === password);
    if (!match) { setError('Invalid credentials. Use a demo account below.'); setLoading(false); return; }
    setLoading(false);
    onLogin({ role: selectedRole, name: match.name, email: match.email });
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#f5f0e8' }}>

      {/* ── Left panel: hero image ─────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0a2a2a 0%, #0d3d3d 60%, #1a5555 100%)',
        }}
      >
        {/* Ship photo — uses a freely-embeddable Unsplash image */}
        <img
          src="https://images.unsplash.com/photo-1605745341112-85968b19335b?w=1400&auto=format&fit=crop&q=85"
          alt="Aerial view of container cargo ship"
          className="absolute inset-0 h-full w-full object-cover object-center opacity-75"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />

        {/* Gradient overlay at bottom for text legibility */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to top, rgba(10,42,42,0.92) 0%, rgba(10,42,42,0.45) 50%, transparent 100%)',
          }}
        />

        {/* Hero text */}
        <div className="absolute bottom-10 left-10 right-10 text-white">
          <h2 className="text-3xl font-extrabold leading-tight mb-2">
            From Kandla to Kolkata,<br />smooth sailing.
          </h2>
          <p className="text-sm text-white/70">
            7,500 km of coastline and every shipment in one calm view.
          </p>
        </div>
      </div>

      {/* ── Right panel: sign-in form ──────────────────────────────── */}
      <div
        className="flex flex-1 items-center justify-center px-8 py-12"
        style={{ background: '#f5f0e8' }}
      >
        <div className="w-full max-w-md">

          {/* Title */}
          <h1 className="text-3xl font-extrabold leading-tight mb-1" style={{ color: '#1a6b6b' }}>
            Coastal Chain Intelligence
          </h1>
          <p className="text-sm mb-8" style={{ color: '#777' }}>Sign in to your workspace</p>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Role chips */}
            <div>
              <p className="text-sm font-medium mb-2" style={{ color: '#444' }}>I am a</p>
              <div className="flex gap-3">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => { setSelectedRole(r.id); setEmail(''); setPassword(''); setError(''); }}
                    className="flex-1 rounded-2xl border-2 px-3 py-3 text-sm font-semibold text-center leading-snug transition-all"
                    style={
                      selectedRole === r.id
                        ? { borderColor: '#4dbfbf', background: '#c8eeee', color: '#1a6b6b' }
                        : { borderColor: '#ddd', background: 'white', color: '#555' }
                    }
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#444' }}>
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="yourname@company.in"
                className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition"
                style={{ borderColor: '#ddd', background: 'white', color: '#333' }}
                onFocus={(e) => (e.target.style.borderColor = '#4dbfbf')}
                onBlur={(e) => (e.target.style.borderColor = '#ddd')}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#444' }}>
                Password
              </label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full rounded-2xl border px-4 py-3 pr-11 text-sm outline-none transition"
                  style={{ borderColor: '#ddd', background: 'white', color: '#333' }}
                  onFocus={(e) => (e.target.style.borderColor = '#4dbfbf')}
                  onBlur={(e) => (e.target.style.borderColor = '#ddd')}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2"
                  style={{ color: '#aaa' }}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {error}
              </p>
            )}

            {/* Sign in */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl py-3.5 text-sm font-bold text-white transition disabled:opacity-60"
              style={{ background: loading ? '#c47a16' : '#e8891a' }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>

          </form>

          {/* Demo accounts */}
          <div className="mt-7">
            <p
              className="text-[11px] font-semibold uppercase tracking-wider mb-2"
              style={{ color: '#aaa' }}
            >
              Demo accounts
            </p>
            <div className="space-y-1.5">
              {ROLES.find((r) => r.id === selectedRole)?.users.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => fillDemo(u)}
                  className="flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-xs transition"
                  style={{ borderColor: '#ddd', background: 'white' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#4dbfbf';
                    e.currentTarget.style.background  = '#f0fafa';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#ddd';
                    e.currentTarget.style.background  = 'white';
                  }}
                >
                  <span className="font-semibold" style={{ color: '#333' }}>{u.name}</span>
                  <span style={{ color: '#999' }}>{u.email}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
