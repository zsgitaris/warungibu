
import { useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeInput, secureStorage } from '@/utils/security';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export const useSecureAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    // Enhanced auth state change handler with security checks
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Secure auth state changed:', event);
        
        if (!mounted) return;

        // Handle sign out event immediately
        if (event === 'SIGNED_OUT') {
          console.log('Processing sign out event');
          // Clear all local storage securely
          try {
            secureStorage.removeItem('user_preferences');
            secureStorage.removeItem('cart_items');
            localStorage.clear();
            sessionStorage.clear();
          } catch (error) {
            console.error('Error clearing storage:', error);
          }
          
          setAuthState({
            user: null,
            session: null,
            loading: false,
            error: null,
          });
          return;
        }

        // Validate session integrity for other events
        if (session) {
          const now = new Date().getTime() / 1000;
          const expiresAt = session.expires_at || 0;
          
          // Check if session is expired or invalid
          if (expiresAt < now) {
            console.log('Session expired, cleaning up');
            try {
              await supabase.auth.signOut();
            } catch (error) {
              console.error('Error during cleanup signout:', error);
            }
            setAuthState({
              user: null,
              session: null,
              loading: false,
              error: null,
            });
            return;
          }

          // Validate user object exists and has required fields
          if (!session.user || !session.user.id) {
            console.log('Invalid user data in session');
            try {
              await supabase.auth.signOut();
            } catch (error) {
              console.error('Error during cleanup signout:', error);
            }
            setAuthState({
              user: null,
              session: null,
              loading: false,
              error: null,
            });
            return;
          }
        }

        setAuthState({
          user: session?.user ?? null,
          session: session,
          loading: false,
          error: null,
        });
      }
    );

    // Get initial session with enhanced security checks
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting initial session:', error);
          setAuthState({
            user: null,
            session: null,
            loading: false,
            error: null, // Don't show error for initial session issues
          });
          return;
        }

        if (session) {
          // Additional session validation
          const now = new Date().getTime() / 1000;
          const expiresAt = session.expires_at || 0;
          
          if (expiresAt < now || !session.user?.id) {
            console.log('Invalid or expired session found');
            try {
              await supabase.auth.signOut();
            } catch (error) {
              console.error('Error during cleanup signout:', error);
            }
            setAuthState({
              user: null,
              session: null,
              loading: false,
              error: null,
            });
            return;
          }
        }

        if (mounted) {
          setAuthState({
            user: session?.user ?? null,
            session: session,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('Unexpected error in getInitialSession:', error);
        if (mounted) {
          setAuthState({
            user: null,
            session: null,
            loading: false,
            error: null, // Don't show error for session issues
          });
        }
      }
    };

    getInitialSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Secure sign out function with better error handling
  const secureSignOut = async () => {
    try {
      console.log('Starting secure sign out...');
      
      // Clear local state immediately
      setAuthState(prev => ({
        ...prev,
        loading: true,
        error: null,
      }));

      // Clear all storage first
      try {
        secureStorage.removeItem('user_preferences');
        secureStorage.removeItem('cart_items');
        localStorage.clear();
        sessionStorage.clear();
      } catch (error) {
        console.error('Error clearing storage during signout:', error);
      }

      // Sign out from Supabase with error handling
      try {
        const { error } = await supabase.auth.signOut({
          scope: 'local'
        });
        
        if (error && error.message !== 'Session not found') {
          console.error('Supabase sign out error:', error);
        }
      } catch (error) {
        console.error('Exception during Supabase signout:', error);
      }

      console.log('Secure sign out completed');
      
      // Set final state
      setAuthState({
        user: null,
        session: null,
        loading: false,
        error: null,
      });

      // Force page reload for complete cleanup (delayed to allow state update)
      setTimeout(() => {
        window.location.href = '/';
      }, 100);

    } catch (error) {
      console.error('Error during secure sign out:', error);
      
      // Force cleanup even on error
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.error('Error in emergency cleanup:', e);
      }
      
      // Set error-free state and force reload
      setAuthState({
        user: null,
        session: null,
        loading: false,
        error: null,
      });
      
      setTimeout(() => {
        window.location.href = '/';
      }, 100);
    }
  };

  return {
    ...authState,
    secureSignOut,
  };
};
