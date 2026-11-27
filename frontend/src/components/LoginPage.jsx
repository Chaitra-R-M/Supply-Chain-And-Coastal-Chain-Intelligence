import React, { useState } from 'react';
import { Anchor, Package, Ship, Shield, Eye, EyeOff, LogIn } from 'lucide-react';

const ROLES = [
  {
    id: 'port',
    label: 'Port Authority',
    icon: Anchor,
    color: 'from-deep-space-blue-700 to-deep-space-blue-900',
    ring: 'ring-deep-space-blue-500',
    badge: 'bg-deep-space-blue-500/20 text-deep-space-blue-200',
    description: 'Manage berths, vessel traffic, cargo operations & port intelligence.',
    users: [
      { email: 'admin@mangaloreport.in', password: 'port123', name: 'Cmdr. Ravi Nair' },
      { email: 'ops@kochiseaport.in', password: 'port123', name: 'Supt. Priya Menon' },
    ],
  },
  {
    id: 'shipping',
    label: 'Shipping Company',
    icon: Ship,
    color: 'from-ink-black-700 to-ink-black-900',
    ring: 'ring-ink-black-400',
    badge: 'bg-ink-black-500/20 text-ink-black-200',
    description: 'Manage your fleet, voyages, cargo assignments & vessel tracking.',
    users: [
      { email: 'fleet@indiashipping.in', password: 'ship123', name: 'Capt. Arjun Sharma' },
      { email: 'ops@coastallines.in', password: 'ship123', name: 'Mgr. Deepa Krishnan' },
    ],
  },
  {
    id: 'cargo',
    label: 'Cargo Owner',
    icon: Package,
    color: 'from-eggshell-700 to-eggshell-900',
    ring: 'ring-eggshell-500',
    badge: 'bg-eggshell-500/20 text-eggshell-200',
    description: 'Register cargo, request transport, track shipments & monitor inventory.',
    users: [
      { email: 'logistics@agroindia.in', password: 'cargo123', name: 'Rajesh Gupta' },
      { email: 'supply@spicetraders.in', password: 'cargo123', name: 'Anitha Nambiar' },
    ],
  },
];

export default function LoginPage({ onLogin }) {
  const [selectedRole, setSelectedRole] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const fillDemo = (user) => {
    setEmail(user.email);
    setPassword(user.password);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRole) { setError('Please select your role.'); return; }
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const role = ROLES.find((r) => r.id === selectedRole);
    const match = role.users.find((u) => u.email === email && u.password === password);
    if (!match) {
      setError('Invalid credentials. Use a demo account below, or try the sample credentials.');
      setLoading(false);
      return;
    }
    setLoading(false);
    onLogin({ role: selectedRole, name: match.name, email: match.email });
  };

  return (
    <div className="min-h-screen bg-deep-space-blue-950 text-ink-black-50 flex flex-col">
      {/* Header */}
      <header className="border-b border-deep-space-blue-800 bg-deep-space-blue-900/80 px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-black-500/30 border border-ink-black-400/40">
            <Ship className="h-5 w-5 text-eggshell-300" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-ink-black-50">
              Coastal Chain Intelligence
            </span>
            <p className="text-[11px] text-blue-slate-300">Supply Chain &amp; Maritime Operations Platform</p>
          </div>
          <div className="ml-auto flex items-center gap-1.5 rounded-full border border-eggshell-500/30 bg-eggshell-500/10 px-3 py-1 text-[11px] font-semibold text-eggshell-200">
            <Shield className="h-3 w-3" /> Secure Login
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold tracking-tight text-ink-black-50">
              Welcome back
            </h1>
            <p className="mt-2 text-sm text-blue-slate-300">
              Select your role and sign in to access your personalised dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
            {ROLES.map((role) => {
              const Icon = role.icon;
              const active = selectedRole === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => { setSelectedRole(role.id); setEmail(''); setPassword(''); setError(''); }}
                  className={`group relative overflow-hidden rounded-2xl border-2 p-5 text-left transition-all duration-200 ${
                    active
                      ? `border-transparent bg-gradient-to-br ${role.color} shadow-xl ring-2 ${role.ring}`
                      : 'border-deep-space-blue-700 bg-deep-space-blue-900/60 hover:border-deep-space-blue-600 hover:bg-deep-space-blue-800/60'
                  }`}
                >
                  <div
                    className={`mb-3 flex h-11 w-11 items-center justify-center rounded-xl ${
                      active ? 'bg-white/20' : 'bg-deep-space-blue-800'
                    }`}
                  >
                    <Icon className={`h-6 w-6 ${active ? 'text-white' : 'text-blue-slate-200'}`} />
                  </div>
                  <h3 className={`text-sm font-bold ${active ? 'text-white' : 'text-ink-black-100'}`}>
                    {role.label}
                  </h3>
                  <p className={`mt-1 text-[12px] leading-snug ${active ? 'text-white/80' : 'text-blue-slate-300'}`}>
                    {role.description}
                  </p>
                  {active && (
                    <div className="absolute top-3 right-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${role.badge} bg-white/25 text-white`}>
                        Selected
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Login Form */}
          <div className="mx-auto max-w-md">
            <form
              onSubmit={handleSubmit}
              className="rounded-2xl border border-deep-space-blue-700 bg-deep-space-blue-900/80 p-6 shadow-2xl backdrop-blur"
            >
              <h2 className="mb-5 text-sm font-bold text-ink-black-50">
                {selectedRole ? `Sign in as ${ROLES.find((r) => r.id === selectedRole)?.label}` : 'Sign in to your account'}
              </h2>

              {error && (
                <div className="mb-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <label className="block">
                  <span className="text-xs font-semibold text-blue-slate-300">Email address</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@company.in"
                    className="mt-1.5 w-full rounded-xl border border-deep-space-blue-700 bg-deep-space-blue-950 px-3 py-2 text-sm text-ink-black-50 placeholder:text-blue-slate-500 focus:border-ink-black-400 focus:outline-none focus:ring-1 focus:ring-ink-black-400"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-semibold text-blue-slate-300">Password</span>
                  <div className="relative mt-1.5">
                    <input
                      type={showPw ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full rounded-xl border border-deep-space-blue-700 bg-deep-space-blue-950 px-3 py-2 pr-10 text-sm text-ink-black-50 placeholder:text-blue-slate-500 focus:border-ink-black-400 focus:outline-none focus:ring-1 focus:ring-ink-black-400"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((s) => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-slate-400 hover:text-blue-slate-200"
                      aria-label={showPw ? 'Hide password' : 'Show password'}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-ink-black-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-ink-black-600 disabled:opacity-60"
              >
                {loading ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <LogIn className="h-4 w-4" />
                )}
                {loading ? 'Signing in…' : 'Sign In'}
              </button>

              {/* Demo Accounts */}
              {selectedRole && (
                <div className="mt-5 border-t border-deep-space-blue-700 pt-4">
                  <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-blue-slate-400">
                    Demo accounts
                  </p>
                  <div className="space-y-1.5">
                    {ROLES.find((r) => r.id === selectedRole)?.users.map((u) => (
                      <button
                        key={u.email}
                        type="button"
                        onClick={() => fillDemo(u)}
                        className="flex w-full items-center justify-between rounded-lg border border-deep-space-blue-700 bg-deep-space-blue-800/60 px-3 py-2 text-left text-xs transition hover:bg-deep-space-blue-800"
                      >
                        <span className="font-semibold text-ink-black-100">{u.name}</span>
                        <span className="text-blue-slate-400">{u.email}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </main>

      <footer className="border-t border-deep-space-blue-800 px-6 py-3 text-center text-[11px] text-blue-slate-500">
        © 2026 Coastal Chain Intelligence Platform — All data shown is simulated for demonstration purposes.
      </footer>
    </div>
  );
}
