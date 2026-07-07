import { NavLink, Outlet, useLocation } from 'react-router-dom';

export default function Layout() {
  const location = useLocation();
  const showSidebar = location.pathname.startsWith('/audits') ||
                      location.pathname.startsWith('/projects') ||
                      location.pathname.startsWith('/auditors');

  return (
    <div className="slds-scope">
      <a href="#main-content" className="slds-assistive-text slds-assistive-text_focus">
        Skip to main content
      </a>

      {/* SLDS Global Header */}
      <header className="slds-global-header_container" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000, backgroundColor: '#032d60' }}>
        <div className="slds-global-header slds-grid slds-grid_align-spread" style={{ padding: '0 1rem' }}>
          <div className="slds-global-header__item" style={{ display: 'flex', alignItems: 'center', paddingLeft: '0.5rem' }}>
            <NavLink to="/" style={{ textDecoration: 'none' }}>
              <span style={{ color: '#0176d3', fontSize: '1.5rem', fontWeight: '700' }}>
                A11y Command Center
              </span>
            </NavLink>
          </div>
          <div className="slds-global-header__item" style={{ display: 'flex', alignItems: 'center' }}>
            <ul className="slds-global-header__navigation" style={{ display: 'flex', listStyle: 'none', margin: 0, padding: 0, gap: '0.5rem' }}>
              <li>
                <NavLink
                  to="/audits"
                  style={({ isActive }) => ({
                    color: '#ffffff',
                    padding: '0.75rem 1rem',
                    textDecoration: 'none',
                    display: 'block',
                    borderBottom: isActive ? '3px solid #0176d3' : '3px solid transparent',
                    fontWeight: isActive ? '700' : '400'
                  })}
                >
                  Audits
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/standards"
                  style={({ isActive }) => ({
                    color: '#ffffff',
                    padding: '0.75rem 1rem',
                    textDecoration: 'none',
                    display: 'block',
                    borderBottom: isActive ? '3px solid #0176d3' : '3px solid transparent',
                    fontWeight: isActive ? '700' : '400'
                  })}
                >
                  Salesforce A11Y Standards
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/tools"
                  style={({ isActive }) => ({
                    color: '#ffffff',
                    padding: '0.75rem 1rem',
                    textDecoration: 'none',
                    display: 'block',
                    borderBottom: isActive ? '3px solid #0176d3' : '3px solid transparent',
                    fontWeight: isActive ? '700' : '400'
                  })}
                >
                  Tools
                </NavLink>
              </li>
            </ul>
          </div>
        </div>
      </header>

      <div className="slds-grid" style={{ marginTop: '64px' }}>
        {/* SLDS Navigation - Only show on audit-related pages */}
        {showSidebar && (
          <nav className="slds-nav-vertical slds-p-around_medium" aria-label="Audit navigation" style={{ width: '250px', background: '#ffffff', borderRight: '1px solid #dddbda', minHeight: 'calc(100vh - 64px)' }}>
            <div className="slds-nav-vertical__section">
              <h2 className="slds-nav-vertical__title slds-text-title_caps">Audits Menu</h2>
              <ul>
                <li className="slds-nav-vertical__item">
                  <NavLink
                    to="/audits"
                    end
                    className={({ isActive }) =>
                      isActive ? "slds-nav-vertical__action slds-is-active" : "slds-nav-vertical__action"
                    }
                  >
                    Dashboard
                  </NavLink>
                </li>
                <li className="slds-nav-vertical__item">
                  <NavLink
                    to="/projects"
                    className={({ isActive }) =>
                      isActive ? "slds-nav-vertical__action slds-is-active" : "slds-nav-vertical__action"
                    }
                  >
                    All Projects
                  </NavLink>
                </li>
                <li className="slds-nav-vertical__item">
                  <NavLink
                    to="/projects/new"
                    className={({ isActive }) =>
                      isActive ? "slds-nav-vertical__action slds-is-active" : "slds-nav-vertical__action"
                    }
                  >
                    New Project
                  </NavLink>
                </li>
              </ul>
            </div>
          </nav>
        )}

        {/* Main Content */}
        <main id="main-content" className="slds-col slds-p-around_large" tabIndex="-1" style={{ flex: '1', background: '#f3f3f3' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
