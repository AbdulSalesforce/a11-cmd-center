import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/auth-context';

export default function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [signingIn, setSigningIn] = useState(false);

  // Where to send the user after a successful sign-in
  const from = location.state?.from?.pathname || '/audits';

  function handleSso() {
    setSigningIn(true);
    // Mock SSO: pretend to hand off to the IdP, then land back signed in.
    signIn();
    navigate(from, { replace: true });
  }

  return (
    <div
      className="slds-scope"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #032d60 0%, #1B5F9E 60%, #2E70B8 100%)',
        padding: '2rem',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '0.5rem',
          boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
          padding: '2.5rem',
          width: '100%',
          maxWidth: '400px',
          textAlign: 'center',
        }}
      >
        <img
          src="/images/salesforce-logo.svg"
          alt="Salesforce"
          style={{ height: '40px', width: 'auto', marginBottom: '1.5rem' }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#032d60', margin: '0 0 0.5rem' }}>
          A11y Command Center
        </h1>
        <p style={{ fontSize: '0.875rem', color: '#54698d', margin: '0 0 2rem' }}>
          Sign in to access accessibility audit projects.
        </p>

        <button
          type="button"
          className="slds-button slds-button_brand slds-button_stretch"
          onClick={handleSso}
          disabled={signingIn}
          style={{ padding: '0.75rem', fontSize: '1rem' }}
        >
          {signingIn ? 'Signing in…' : 'Sign in with SSO'}
        </button>

        <p style={{ fontSize: '0.75rem', color: '#8a94a6', margin: '1.5rem 0 0' }}>
          Single sign-on via your Salesforce identity provider.
        </p>
      </div>
    </div>
  );
}
