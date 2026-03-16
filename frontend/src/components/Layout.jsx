import { Link, Outlet, useLocation } from 'react-router-dom'

export default function Layout() {
  const { pathname } = useLocation()

  const navLinks = [
    { to: '/',        label: 'Home'    },
    { to: '/apply',   label: 'Apply'   },
    { to: '/history', label: 'History' },
  ]

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navbar */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="font-semibold text-gray-900 text-base tracking-tight">
            explainmy<span className="text-brand-600">decision</span>
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

      {/* Footer */}
      <footer className="border-t border-gray-100 py-12 mt-20">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-gray-400">
          <p>© 2026 explainmydecision</p>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-success rounded-full" />
              <span>API Online</span>
            </div>
            <a href="https://github.com/shlokmestry/explainmydecision"
              target="_blank" rel="noopener noreferrer"
              className="hover:text-gray-700 transition-colors flex items-center gap-1">
              GitHub ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}