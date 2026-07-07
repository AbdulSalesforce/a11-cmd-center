import { NavLink, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="slds-scope">
      <a href="#main-content" className="slds-assistive-text slds-assistive-text_focus">
        Skip to main content
      </a>

      {/* SLDS Global Header */}
      <header className="slds-global-header_container">
        <div className="slds-global-header slds-grid slds-grid_align-spread">
          <div className="slds-global-header__item">
            <div className="slds-global-header__logo">
              <span className="slds-text-heading_large" style={{ color: '#fff', fontWeight: '600' }}>
                A11y Audit Tool
              </span>
            </div>
          </div>
          <div className="slds-global-header__item" style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#fff' }}>
            <span className="slds-text-body_small">WCAG 2.2 Level A & AA</span>
          </div>
        </div>
      </header>

      <div className="slds-grid">
        {/* SLDS Navigation */}
        <nav className="slds-nav-vertical slds-p-around_medium" aria-label="Main navigation" style={{ width: '250px', background: '#ffffff', borderRight: '1px solid #dddbda', minHeight: 'calc(100vh - 48px)' }}>
          <div className="slds-nav-vertical__section">
            <h2 className="slds-nav-vertical__title slds-text-title_caps">Menu</h2>
            <ul>
              <li className="slds-nav-vertical__item">
                <NavLink
                  to="/"
                  end
                  className={({ isActive }) =>
                    isActive ? "slds-nav-vertical__action slds-is-active" : "slds-nav-vertical__action"
                  }
                >
                  Projects
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

        {/* Main Content */}
        <main id="main-content" className="slds-col slds-p-around_large" tabIndex="-1" style={{ flex: '1', background: '#f3f3f3' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
