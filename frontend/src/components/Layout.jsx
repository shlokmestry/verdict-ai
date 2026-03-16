import { Link, Outlet, useLocation } from 'react-router-dom'

export default function Layout() {
  const { pathname } = useLocation()

  const navLinks = [
    { to: '/',        label: 'Home'    },
    { to: '/apply',   label: 'Apply'   },
    { to: '/history', label: 'History' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center shadow-sm group-hover:bg-brand-700 transition-colors">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 10L5 6L8 8L12 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="3" r="1.2" fill="white"/>
              </svg>
            </div>
            <span className="font-semibold text-slate-800 tracking-tight text-sm">
              explainmy<span className="text-brand-600">decision</span>
            </span>
          </Link>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {navLinks.map(({ to, label }) => {
              const active = pathname === to
              return (
                <Link key={to} to={to}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
                    ${active
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}>
                  {label}
                </Link>
              )
            })}
            <Link to="/apply"
              className="ml-3 bg-brand-600 text-white text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-brand-700 transition-colors shadow-sm">
              Apply now
            </Link>
          </nav>
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-100 bg-white mt-auto">
        <div className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            © 2026 explainmydecision · Built with ML, FastAPI &amp; React
          </span>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
              API online
            </span>
            <a href="https://github.com/shlokmestry/explainmydecision"
              target="_blank" rel="noopener noreferrer"
              className="hover:text-slate-700 transition-colors">
              GitHub ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}