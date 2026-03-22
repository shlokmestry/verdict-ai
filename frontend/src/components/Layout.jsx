import { Link, Outlet, useLocation } from 'react-router-dom'

export default function Layout() {
  const { pathname } = useLocation()

  const navLinks = [
    { to: '/',        label: 'Home'    },
    { to: '/apply',   label: 'Apply'   },
    { to: '/history', label: 'History' },
    { to: '/about',   label: 'About'   },
  ]

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="font-semibold text-gray-900 text-base tracking-tight">
            <span className="text-brand-600">Verdict</span>
          </Link>
          <nav className="flex items-center gap-1">
            {navLinks.map(({ to, label }) => {
              const active = pathname === to
              return (
                <Link key={to} to={to}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors
                    ${active ? 'text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}>
                  {label}
                </Link>
              )
            })}
            <Link to="/apply"
              className="ml-2 bg-gray-900 text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-gray-800 transition-colors">
              Apply now
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-gray-100 py-8 mt-20">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm bg-gray-900">
          <p>© 2026 Verdict</p>
          <p className="text-xs bg-gray-900">
            built with caffeine, gradient boosting, and a concerning number of git commits.
          </p>
        </div>
      </footer>
    </div>
  )
}