import { NavLink, Outlet, useParams } from 'react-router-dom';
import '../styles/layout.css';

export default function Layout() {
  return (
    <div className="app-layout">
      <a href="#main-content" className="skip-link">Skip to main content</a>

      <nav className="sidebar" aria-label="Main navigation">
        <div className="sidebar-brand">
          <h1>A11y Audit Tool</h1>
          <p>WCAG 2.2 Audit Manager</p>
        </div>
        <div className="sidebar-nav">
          <ul>
            <li>
              <NavLink to="/" end>
                Projects
              </NavLink>
            </li>
            <li>
              <NavLink to="/projects/new">
                New Project
              </NavLink>
            </li>
          </ul>
        </div>
      </nav>

      <main id="main-content" tabIndex="-1">
        <Outlet />
      </main>
    </div>
  );
}
