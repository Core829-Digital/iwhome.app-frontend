import React, { createContext, useContext, useEffect, useState } from 'react';
import { useConvexAuth, useQuery, useMutation } from "convex/react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { api } from "../../../../Backend/convex/_generated/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { isAuthenticated, isLoading: isLoadingConvex } = useConvexAuth();
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser();
  const { signOut, openSignIn } = useClerk();

  // Mapped user object to match previous interface if needed
  const user = clerkUser ? {
    email: clerkUser.primaryEmailAddress?.emailAddress,
    full_name: clerkUser.fullName,
    ...clerkUser
  } : null;

  const isLoadingAuth = isLoadingConvex || !isClerkLoaded;
  // Previously used for checking app settings, now assumed true/loaded
  const isLoadingPublicSettings = false;
  const [authError, setAuthError] = useState(null);

  // Sync user to Convex on load if needed (optional pattern)
  // But usually handled by webhooks or direct usage in mutations

  const logout = () => {
    signOut();
  };

  const navigateToLogin = () => {
    openSignIn();
  };

  // Sync user to Convex
  const storeUser = useMutation(api.users.store);

  useEffect(() => {
    if (isAuthenticated && clerkUser) {
      storeUser().catch(err => console.error("Failed to sync user:", err));
    }
  }, [isAuthenticated, clerkUser, storeUser]);

  // OWASP: Check if user is blocked
  const convexUser = useQuery(
    api.users.getByEmail,
    isAuthenticated && user?.email ? { email: user.email } : "skip"
  );

  useEffect(() => {
    if (convexUser && convexUser.blocked) {
      setAuthError({
        type: 'user_blocked',
        message: convexUser.blocked_reason || "Il tuo account è stato bloccato dall'amministratore."
      });
    } else if (convexUser && !convexUser.blocked && authError?.type === 'user_blocked') {
      setAuthError(null);
    }
  }, [convexUser]);

  const checkAppState = async () => {
    // No-op in new auth flow
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      logout,
      navigateToLogin,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
