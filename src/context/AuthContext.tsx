import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  AuthError,
  UserCredential
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { StaffUser } from '../types/restaurant';

interface AuthContextType {
  user: User | null;
  staffProfile: StaffUser | null;
  loading: boolean;
  tenantId: string | null;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<UserCredential>;
  logout: () => Promise<void>;
  error: string | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  staffProfile: null,
  loading: true,
  tenantId: null,
  isAdmin: false,
  login: async () => {},
  loginWithGoogle: async () => {},
  logout: async () => {},
  error: null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [staffProfile, setStaffProfile] = useState<StaffUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(true);
      setError(null);
      
      if (firebaseUser) {
        // Check if user is SaaS Admin (based on email for this demo)
        const isSaaSAdmin = firebaseUser.email?.endsWith('@resto-os.com') || false;
        setIsAdmin(isSaaSAdmin);

        try {
          // Attempt to fetch staff profile from Firestore
          const staffRef = doc(db, 'staff', firebaseUser.uid);
          const staffSnap = await getDoc(staffRef);

          if (staffSnap.exists()) {
            const profile = staffSnap.data() as StaffUser;
            setStaffProfile(profile);
            setTenantId(profile.tenantId);
          } else {
            // Fallback to local storage if Firestore doesn't have it yet
            const savedProfile = localStorage.getItem('staffProfile');
            if (savedProfile) {
              const profile = JSON.parse(savedProfile);
              // Only use if it matches the current user or is a general fallback
              setStaffProfile(profile);
              setTenantId(profile.tenantId);
            }
          }
        } catch (e) {
          console.error('Failed to fetch staff profile', e);
        }
      } else {
        setStaffProfile(null);
        setTenantId(null);
        setIsAdmin(false);
        localStorage.removeItem('staffProfile');
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const authError = err as AuthError;
      setError(authError.message);
      throw err;
    }
  };

  const loginWithGoogle = async (): Promise<UserCredential> => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      return await signInWithPopup(auth, provider);
    } catch (err) {
      const authError = err as AuthError;
      setError(authError.message);
      throw err;
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
    } catch (err) {
      const authError = err as AuthError;
      setError(authError.message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      staffProfile, 
      loading, 
      tenantId, 
      isAdmin,
      login,
      loginWithGoogle,
      logout,
      error
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
