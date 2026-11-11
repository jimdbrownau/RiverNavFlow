import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  onAuthStateChanged, 
  signInWithGoogle, 
  logOutUser, 
  User, 
  testFirestoreConnection 
} from '../services/firebase';

interface FirebaseContextType {
  user: User | null;
  isLoading: boolean;
  isFirestoreConnected: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  error: string | null;
}

const FirebaseContext = createContext<FirebaseContextType>({
  user: null,
  isLoading: true,
  isFirestoreConnected: false,
  signIn: async () => {},
  signOut: async () => {},
  error: null,
});

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirestoreConnected, setIsFirestoreConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial connection test
    testFirestoreConnection().then(connected => {
      setIsFirestoreConnected(connected);
    });

    // Listen to Firebase Auth state
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    }, (authErr) => {
      console.error('Firebase Auth state error:', authErr);
      setError(authErr.message);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignIn = async () => {
    try {
      setError(null);
      await signInWithGoogle();
    } catch (err: any) {
      setError(err?.message || 'Google sign in failed');
      throw err;
    }
  };

  const handleSignOut = async () => {
    try {
      setError(null);
      await logOutUser();
    } catch (err: any) {
      setError(err?.message || 'Sign out failed');
      throw err;
    }
  };

  return (
    <FirebaseContext.Provider
      value={{
        user,
        isLoading,
        isFirestoreConnected,
        signIn: handleSignIn,
        signOut: handleSignOut,
        error,
      }}
    >
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => useContext(FirebaseContext);
