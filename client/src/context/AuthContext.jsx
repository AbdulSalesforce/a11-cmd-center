import { useState } from 'react';
import { AuthContext } from './auth-context';

const STORAGE_KEY = 'a11y-cc-user';

// Mock SSO: no real identity provider. "Signing in" just stores a demo user
// in localStorage so the profile/back-office UI can be built and demoed.
const DEMO_USER = {
  name: 'Abdul Salesforce',
  email: 'abdul@salesforce.com',
  role: 'Accessibility Auditor',
};

// Read any existing session from storage (used as lazy initial state).
function loadUser() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser);

  function signIn() {
    // In a real SSO flow this would redirect to the IdP and handle the callback.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEMO_USER));
    setUser(DEMO_USER);
    return DEMO_USER;
  }

  function signOut() {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }

  // `ready` is always true now that state initialises synchronously from storage.
  return (
    <AuthContext.Provider value={{ user, ready: true, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
