
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import HomePage from "@/components/HomePage";
import AuthPage from "@/components/auth/AuthPage";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    console.log("Setting up auth state listener...");
    
    let mounted = true;
    let isInitialized = false;
    
    // Clear any existing auth errors
    setAuthError(null);

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session?.user?.email);
        
        if (!mounted) return;
        
        // Only process events after initial session is loaded
        if (!isInitialized && event !== 'INITIAL_SESSION') {
          return;
        }
        
        // Clear auth errors on successful auth events
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setAuthError(null);
          setShowAuth(false); // Hide auth page when successfully logged in
        }
        
        // Handle sign out - completely clear all state
        if (event === 'SIGNED_OUT') {
          console.log("User signed out, clearing all state");
          setSession(null);
          setUser(null);
          setAuthError(null);
          setShowAuth(false); // Go back to public view
          setLoading(false);
          return;
        }
        
        // Update state with session data
        if (session) {
          console.log("Setting session and user:", session.user?.email);
          setSession(session);
          setUser(session.user);
        } else {
          console.log("No session, clearing user state");
          setSession(null);
          setUser(null);
        }
        
        setLoading(false);
      }
    );

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log("Getting initial session...");
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting initial session:", error);
          // Don't show error message for session not found
          if (error.message !== 'Session not found') {
            setAuthError("Gagal memuat sesi. Silakan login kembali.");
          }
          setSession(null);
          setUser(null);
        } else {
          console.log("Initial session loaded:", session?.user?.email);
          
          if (session) {
            // Verify the session is not expired
            const now = new Date().getTime() / 1000;
            const expiresAt = session.expires_at || 0;
            
            if (expiresAt < now) {
              console.log("Session expired, signing out");
              try {
                await supabase.auth.signOut();
              } catch (signOutError) {
                console.error("Error during signout:", signOutError);
              }
              setSession(null);
              setUser(null);
            } else {
              setSession(session);
              setUser(session.user);
            }
          } else {
            setSession(null);
            setUser(null);
          }
        }
      } catch (error) {
        console.error("Unexpected error getting session:", error);
        // Don't show error for common session issues
        setSession(null);
        setUser(null);
      } finally {
        if (mounted) {
          isInitialized = true;
          setLoading(false);
        }
      }
    };

    getInitialSession();

    return () => {
      mounted = false;
      console.log("Cleaning up auth listener");
      subscription.unsubscribe();
    };
  }, []);

  const handleShowAuth = () => {
    setShowAuth(true);
  };

  const handleHideAuth = () => {
    setShowAuth(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat aplikasi...</p>
        </div>
      </div>
    );
  }

  // Show auth error if present
  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline mt-1">{authError}</span>
          </div>
          <button
            onClick={() => {
              setAuthError(null);
              window.location.reload();
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded mr-2"
          >
            Muat Ulang
          </button>
          <button
            onClick={() => {
              setAuthError(null);
              setSession(null);
              setUser(null);
              // Clear storage without triggering errors
              try {
                localStorage.clear();
                sessionStorage.clear();
              } catch (e) {
                console.error('Error clearing storage:', e);
              }
            }}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded"
          >
            Login Ulang
          </button>
        </div>
      </div>
    );
  }

  // Show auth page if explicitly requested
  if (showAuth) {
    return <AuthPage onBack={handleHideAuth} />;
  }

  // Always show HomePage, whether user is logged in or not
  return <HomePage user={user} session={session} onShowAuth={handleShowAuth} />;
};

export default Index;
