import { NavLink, Outlet, useLocation } from 'react-router-dom';
import '../styles/header.css';

export default function Layout() {
  const location = useLocation();
  const showSidebar = location.pathname.startsWith('/audits') ||
                      location.pathname.startsWith('/projects') ||
                      location.pathname.startsWith('/auditors') ||
                      location.pathname.startsWith('/standards');

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
        borderBottom: '1px solid #c9c9c9'
      }}>
        <div style={{
          padding: '0 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px'
        }}>
          {/* Logo and Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <NavLink to="/" style={{ display: 'block', textDecoration: 'none', lineHeight: 1 }}>
              <img
                src="/images/salesforce-logo.svg"
                alt="Salesforce"
                style={{ height: '36px', minHeight: '36px', maxHeight: '36px', width: 'auto', display: 'block', lineHeight: 1, fontSize: 0 }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<span style="color: #032d60; font-size: 1.25rem; font-weight: 700;">Salesforce</span>';
                }}
              />
            </NavLink>

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
                    className={({ isActive }) => isActive ? 'sf-nav-link active' : 'sf-nav-link'}
                  >
                    Audits
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/standards"
                    className={({ isActive }) => isActive ? 'sf-nav-link active' : 'sf-nav-link'}
                  >
                    Standards
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/tools"
                    className={({ isActive }) => isActive ? 'sf-nav-link active' : 'sf-nav-link'}
                  >
                    Tools
                  </NavLink>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </header>

      <div className="slds-grid" style={{ marginTop: '64px' }}>
        {/* SLDS Navigation - Only show on audit-related and standards pages */}
        {showSidebar && (
          <nav className="slds-nav-vertical slds-p-around_medium" aria-label={location.pathname.startsWith('/standards') ? 'Standards navigation' : 'Audit navigation'} style={{ width: '250px', background: '#ffffff', borderRight: '1px solid #dddbda', minHeight: 'calc(100vh - 64px)' }}>
            {location.pathname.startsWith('/standards') ? (
              <div className="slds-nav-vertical__section">
                <h2 className="slds-nav-vertical__title slds-text-title_caps">Filter by</h2>
                <div id="standards-filters-mount"></div>
              </div>
            ) : (
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
                      end
                      className={({ isActive }) =>
                        isActive ? "slds-nav-vertical__action slds-is-active" : "slds-nav-vertical__action"
                      }
                    >
                      Active Projects
                    </NavLink>
                  </li>
                  <li className="slds-nav-vertical__item">
                    <NavLink
                      to="/projects/archived"
                      className={({ isActive }) =>
                        isActive ? "slds-nav-vertical__action slds-is-active" : "slds-nav-vertical__action"
                      }
                    >
                      Archived Projects
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
            )}
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
