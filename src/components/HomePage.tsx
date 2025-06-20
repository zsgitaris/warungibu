import { useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/layout/Header";
import Hero from "@/components/home/Hero";
import Banner from "@/components/home/Banner";
import Categories from "@/components/home/Categories";
import PopularItems from "@/components/home/PopularItems";
import MenuPage from "@/components/menu/MenuPage";
import CheckoutPage from "@/components/checkout/CheckoutPage";
import ProfilePage from "@/components/profile/ProfilePage";
import AdminDashboard from "@/components/admin/AdminDashboard";
import AboutSection from "@/components/home/AboutSection";
import ContactSection from "@/components/home/ContactSection";
import { useToast } from "@/hooks/use-toast";
import { Sparkles } from "lucide-react";
import { createWelcomeNotifications } from "@/utils/notificationUtils";

interface HomePageProps {
  user: User | null;
  session: Session | null;
  onShowAuth: () => void;
}

const HomePage = ({ user, session, onShowAuth }: HomePageProps) => {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [hasCreatedWelcomeNotifications, setHasCreatedWelcomeNotifications] = useState(false);
  const { toast } = useToast();

  // Fetch user profile with stable query key and proper caching (only if user exists)
  const { data: profile, isLoading: profileLoading, error: profileError } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      console.log("Fetching profile for user:", user.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error("Profile fetch error:", error);
        throw error;
      }
      
      console.log("Profile fetched:", data);
      return data;
    },
    retry: 1,
    retryDelay: 1000,
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!user?.id,
  });

  // Create welcome notifications for new users
  useEffect(() => {
    const createWelcomeNotificationsIfNeeded = async () => {
      if (!user?.id || !profile?.role || hasCreatedWelcomeNotifications) return;

      try {
        // Check if user already has notifications
        const { data: existingNotifications } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        // Only create welcome notifications if user has no notifications yet
        if (!existingNotifications || existingNotifications.length === 0) {
          await createWelcomeNotifications(user.id, profile.role);
          setHasCreatedWelcomeNotifications(true);
          console.log('Welcome notifications created for user:', user.id);
        }
      } catch (error) {
        console.error('Error creating welcome notifications:', error);
      }
    };

    createWelcomeNotificationsIfNeeded();
  }, [user?.id, profile?.role, hasCreatedWelcomeNotifications]);

  // Fetch categories with session validation
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: false,
  });

  // Fetch popular menu items - Fixed query
  const { data: popularItems, refetch: refetchPopularItems } = useQuery({
    queryKey: ['popular-items'],
    queryFn: async () => {
      console.log("Fetching popular menu items...");
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          id,
          name,
          description,
          price,
          image_url,
          is_popular,
          is_available,
          category_id,
          categories (
            name
          )
        `)
        .eq('is_popular', true)
        .eq('is_available', true)
        .order('name');
      
      if (error) {
        console.error("Error fetching popular items:", error);
        throw error;
      }
      
      console.log("Popular items fetched successfully:", data?.length, "items");
      console.log("Popular items data:", data);
      return data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes - reduced for testing
    retry: 1,
    refetchOnWindowFocus: true, // Refetch when window gains focus
  });

  const handleSignOut = async () => {
    try {
      console.log("Starting sign out process...");
      
      // Clear state immediately
      setCurrentPage('home');
      
      // Clear storage
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (error) {
        console.error('Error clearing storage:', error);
      }
      
      // Sign out from Supabase
      try {
        const { error } = await supabase.auth.signOut({ scope: 'local' });
        if (error && error.message !== 'Session not found') {
          console.error("Sign out error:", error);
        }
      } catch (error) {
        console.error("Exception during sign out:", error);
      }

      console.log("Sign out successful");
      
      // Show success message
      toast({
        title: "Berhasil",
        description: "Berhasil keluar dari aplikasi",
      });
      
      // Force page reload for complete cleanup
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
      
    } catch (error) {
      console.error("Sign out error:", error);
      
      // Force cleanup and reload even on error
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (e) {
        console.error('Error in emergency cleanup:', e);
      }
      
      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    }
  };

  const handleNavLinkClick = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  const handleNavigate = (page: string, query?: string) => {
    // Check if user is logged in for protected pages
    if (!user && ['checkout', 'profile', 'admin'].includes(page)) {
      toast({
        title: "Login Diperlukan",
        description: "Silakan login terlebih dahulu untuk mengakses fitur ini",
        variant: "destructive",
      });
      onShowAuth();
      return;
    }

    // Check role access for admin pages
    if (page === 'admin' && profile?.role !== 'admin') {
      toast({
        title: "Akses Ditolak",
        description: "Anda tidak memiliki akses ke halaman admin",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Navigating to:", page, "with search query:", query);
    setCurrentPage(page);
    setSelectedCategoryId(null);
    
    if (query !== undefined) {
      setSearchQuery(query);
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    console.log("Category selected:", categoryId);
    setSelectedCategoryId(categoryId);
    setSearchQuery("");
    setCurrentPage('menu');
  };

  const handleCheckoutSuccess = () => {
    setCurrentPage('home');
    toast({
      title: "Pesanan Berhasil",
      description: "Terima kasih! Pesanan Anda sedang diproses.",
    });
  };

  // Handler untuk navigasi ke menu dari PopularItems
  const handleNavigateToMenu = () => {
    console.log("Navigating to menu from PopularItems");
    setCurrentPage('menu');
    setSelectedCategoryId(null);
    setSearchQuery("");
  };

  // Log popular items data for debugging (outside JSX)
  console.log("Rendering PopularItems with data:", popularItems);

  // Show loading state while profile is being fetched (only if user exists)
  if (user && profileLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-orange-100 via-amber-50 to-red-100">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-200/30 via-transparent to-red-200/30"></div>
          <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-br from-orange-300/20 to-amber-300/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 right-10 w-96 h-96 bg-gradient-to-bl from-red-300/15 to-pink-300/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600">Memuat profil pengguna...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if profile failed to load (only if user exists)
  if (user && profileError) {
    const errorMessage = profileError.message || "Gagal memuat profil pengguna";
    
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-red-100 via-pink-50 to-red-100">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-200/30 via-transparent to-pink-200/30"></div>
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline mt-1">{errorMessage}</span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded"
            >
              Muat Ulang
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === 'admin' && profile?.role === 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-25 to-red-50">
        <Header 
          user={user} 
          profile={profile} 
          onSignOut={handleSignOut}
          onNavigate={handleNavigate}
          onNavLinkClick={handleNavLinkClick}
          onShowAuth={onShowAuth}
        />
        <AdminDashboard user={user!} onBack={() => setCurrentPage('home')} />
      </div>
    );
  }

  if (currentPage === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-amber-50 to-red-100">
        <Header 
          user={user} 
          profile={profile} 
          onSignOut={handleSignOut}
          onNavigate={handleNavigate}
          onNavLinkClick={handleNavLinkClick}
          onShowAuth={onShowAuth}
        />
        <MenuPage 
          user={user} 
          onBack={() => {
            setCurrentPage('home');
            setSearchQuery("");
          }}
          selectedCategoryId={selectedCategoryId}
          initialSearchQuery={searchQuery}
          onShowAuth={onShowAuth}
        />
      </div>
    );
  }

  if (currentPage === 'checkout') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-amber-50 to-red-100">
        <Header 
          user={user} 
          profile={profile} 
          onSignOut={handleSignOut}
          onNavigate={handleNavigate}
          onNavLinkClick={handleNavLinkClick}
          onShowAuth={onShowAuth}
        />
        <CheckoutPage 
          user={user!} 
          onBack={() => setCurrentPage('home')}
          onSuccess={handleCheckoutSuccess}
        />
      </div>
    );
  }

  if (currentPage === 'profile') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-25 to-red-50">
        <Header 
          user={user} 
          profile={profile} 
          onSignOut={handleSignOut}
          onNavigate={handleNavigate}
          onNavLinkClick={handleNavLinkClick}
          onShowAuth={onShowAuth}
        />
        <ProfilePage user={user!} onBack={() => setCurrentPage('home')} />
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-orange-100 via-amber-50 to-red-100">
      {/* Enhanced Main Homepage Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-200/20 via-transparent to-red-200/20"></div>
        
        {/* Floating decorative elements */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-br from-orange-300/15 to-amber-300/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 right-20 w-80 h-80 bg-gradient-to-bl from-red-300/10 to-pink-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-40 left-1/4 w-48 h-48 bg-gradient-to-tr from-yellow-300/20 to-orange-300/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Sparkle effects */}
        <div className="absolute top-32 right-1/4 opacity-40">
          <Sparkles className="w-8 h-8 text-orange-400 animate-pulse" />
        </div>
        <div className="absolute bottom-1/3 left-1/5 opacity-30">
          <Sparkles className="w-6 h-6 text-amber-400 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="absolute top-1/2 right-1/8 opacity-35">
          <Sparkles className="w-5 h-5 text-red-400 animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Header 
          user={user} 
          profile={profile} 
          onSignOut={handleSignOut}
          onNavigate={handleNavigate}
          onNavLinkClick={handleNavLinkClick}
          onShowAuth={onShowAuth}
        />
        
        {/* Add padding top to account for fixed header */}
        <div className="pt-16 sm:pt-20">
          <main>
            <Hero 
              onNavigate={handleNavigate} 
              onNavLinkClick={handleNavLinkClick}
            />
            
            <Banner />
            
            {categories && categories.length > 0 && (
              <Categories 
                categories={categories} 
                onCategoryClick={handleCategoryClick}
              />
            )}
            
            {/* Enhanced PopularItems section with navigation handler */}
            {popularItems && popularItems.length > 0 ? (
              <PopularItems 
                items={popularItems} 
                user={user} 
                onShowAuth={onShowAuth}
                onNavigateToMenu={handleNavigateToMenu}
              />
            ) : (
              <div className="py-8 text-center">
                <p className="text-gray-600">
                  {popularItems === undefined ? "Memuat menu favorit..." : "Belum ada menu favorit tersedia"}
                </p>
                {user && (
                  <button 
                    onClick={() => refetchPopularItems()}
                    className="mt-2 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                  >
                    Muat Ulang Menu Favorit
                  </button>
                )}
              </div>
            )}
            
            <AboutSection />
            
            <ContactSection />
          </main>
        </div>
        
        <footer className="bg-gray-800 text-white py-8 mt-16">
          <div className="container mx-auto px-4 text-center">
            <h3 className="text-xl font-bold mb-2">Warung IbuMus</h3>
            <p className="text-gray-400">Makanan Rumahan Terenak di Kota</p>
            <div className="mt-4 text-sm text-gray-500">
              © 2025 Warung IbuMus. All rights reserved.
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default HomePage;