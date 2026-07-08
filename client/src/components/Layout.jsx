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

      {/* Salesforce-style Header */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        backgroundColor: '#ffffff',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        borderBottom: '1px solid #e5e5e5'
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '60px'
        }}>
          {/* Logo Section */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <NavLink to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
              {/* Placeholder for Salesforce logo - replace with actual logo */}
              <div style={{
                width: '140px',
                height: '32px',
                backgroundColor: '#0176d3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontSize: '0.875rem',
                fontWeight: '700',
                borderRadius: '4px'
              }}>
                SALESFORCE LOGO
              </div>
            </NavLink>
          </div>

          {/* Navigation Links */}
          <nav role="navigation" aria-label="Main">
            <ul style={{
              display: 'flex',
              listStyle: 'none',
              margin: 0,
              padding: 0,
              gap: '2rem',
              alignItems: 'center'
            }}>
              <li>
                <NavLink
                  to="/audits"
                  style={({ isActive }) => ({
                    color: isActive ? '#0176d3' : '#181818',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: '400',
                    padding: '0.5rem 0',
                    borderBottom: isActive ? '2px solid #0176d3' : 'none',
                    transition: 'color 0.2s ease'
                  })}
                >
                  Audits
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/standards"
                  style={({ isActive }) => ({
                    color: isActive ? '#0176d3' : '#181818',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: '400',
                    padding: '0.5rem 0',
                    borderBottom: isActive ? '2px solid #0176d3' : 'none',
                    transition: 'color 0.2s ease'
                  })}
                >
                  Standards
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/tools"
                  style={({ isActive }) => ({
                    color: isActive ? '#0176d3' : '#181818',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: '400',
                    padding: '0.5rem 0',
                    borderBottom: isActive ? '2px solid #0176d3' : 'none',
                    transition: 'color 0.2s ease'
                  })}
                >
                  Tools
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <div className="slds-grid" style={{ marginTop: '60px' }}>
        {/* SLDS Navigation - Only show on audit-related pages */}
        {showSidebar && (
          <nav className="slds-nav-vertical slds-p-around_medium" aria-label="Audit navigation" style={{ width: '250px', background: '#ffffff', borderRight: '1px solid #dddbda', minHeight: 'calc(100vh - 60px)' }}>
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
