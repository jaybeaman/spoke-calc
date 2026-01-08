import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'

export default function Layout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <div className="min-h-screen bg-scenic-50 dark:bg-scenic-900">
      {/* Header */}
      <header className="bg-white border-b border-scenic-200 dark:bg-scenic-800 dark:border-scenic-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center space-x-3">
              <img src="/logo.png" alt="Scenic Routes" className="h-10 w-10" />
              <div>
                <h1 className="text-lg font-bold text-scenic-900 dark:text-scenic-100">Spoke Calculator</h1>
                <p className="text-xs text-scenic-500 dark:text-scenic-400">Scenic Routes Community Bicycle Center</p>
              </div>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              <NavLink
                to="/"
                end
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-scenic-900 text-white dark:bg-scenic-100 dark:text-scenic-900'
                      : 'text-scenic-600 hover:bg-scenic-100 dark:text-scenic-300 dark:hover:bg-scenic-700'
                  }`
                }
              >
                Calculator
              </NavLink>
              <NavLink
                to="/rims"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-scenic-900 text-white dark:bg-scenic-100 dark:text-scenic-900'
                      : 'text-scenic-600 hover:bg-scenic-100 dark:text-scenic-300 dark:hover:bg-scenic-700'
                  }`
                }
              >
                Rims
              </NavLink>
              <NavLink
                to="/hubs"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-scenic-900 text-white dark:bg-scenic-100 dark:text-scenic-900'
                      : 'text-scenic-600 hover:bg-scenic-100 dark:text-scenic-300 dark:hover:bg-scenic-700'
                  }`
                }
              >
                Hubs
              </NavLink>
              <NavLink
                to="/builds"
                className={({ isActive }) =>
                  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-scenic-900 text-white dark:bg-scenic-100 dark:text-scenic-900'
                      : 'text-scenic-600 hover:bg-scenic-100 dark:text-scenic-300 dark:hover:bg-scenic-700'
                  }`
                }
              >
                Builds
              </NavLink>
              {user?.is_admin && (
                <NavLink
                  to="/users"
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-scenic-900 text-white dark:bg-scenic-100 dark:text-scenic-900'
                        : 'text-scenic-600 hover:bg-scenic-100 dark:text-scenic-300 dark:hover:bg-scenic-700'
                    }`
                  }
                >
                  Users
                </NavLink>
              )}
            </nav>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-scenic-600 dark:text-scenic-300">{user?.name}</span>
              <button
                onClick={toggleTheme}
                className="p-2 text-scenic-500 hover:text-scenic-700 dark:text-scenic-400 dark:hover:text-scenic-200"
                title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {theme === 'dark' ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>
              <NavLink
                to="/help"
                className="text-sm text-scenic-500 hover:text-scenic-700 dark:text-scenic-400 dark:hover:text-scenic-200"
              >
                Help
              </NavLink>
              <button
                onClick={logout}
                className="text-sm text-scenic-500 hover:text-scenic-700 dark:text-scenic-400 dark:hover:text-scenic-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className="md:hidden bg-white border-b border-scenic-200 dark:bg-scenic-800 dark:border-scenic-700 px-4 py-2 flex space-x-2 overflow-x-auto">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            `px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
              isActive ? 'bg-scenic-900 text-white dark:bg-scenic-100 dark:text-scenic-900' : 'text-scenic-600 dark:text-scenic-300'
            }`
          }
        >
          Calculator
        </NavLink>
        <NavLink
          to="/rims"
          className={({ isActive }) =>
            `px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
              isActive ? 'bg-scenic-900 text-white dark:bg-scenic-100 dark:text-scenic-900' : 'text-scenic-600 dark:text-scenic-300'
            }`
          }
        >
          Rims
        </NavLink>
        <NavLink
          to="/hubs"
          className={({ isActive }) =>
            `px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
              isActive ? 'bg-scenic-900 text-white dark:bg-scenic-100 dark:text-scenic-900' : 'text-scenic-600 dark:text-scenic-300'
            }`
          }
        >
          Hubs
        </NavLink>
        <NavLink
          to="/builds"
          className={({ isActive }) =>
            `px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
              isActive ? 'bg-scenic-900 text-white dark:bg-scenic-100 dark:text-scenic-900' : 'text-scenic-600 dark:text-scenic-300'
            }`
          }
        >
          Builds
        </NavLink>
        {user?.is_admin && (
          <NavLink
            to="/users"
            className={({ isActive }) =>
              `px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap ${
                isActive ? 'bg-scenic-900 text-white dark:bg-scenic-100 dark:text-scenic-900' : 'text-scenic-600 dark:text-scenic-300'
              }`
            }
          >
            Users
          </NavLink>
        )}
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  )
}
