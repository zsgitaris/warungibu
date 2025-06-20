import { Button } from "@/components/ui/button";
import { User, LogOut, User as UserIcon, Settings, Shield, Bell, Search } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import CartButton from "@/components/cart/CartButton";
import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";

interface Profile {
  id: string;
  full_name: string;
  phone_number?: string;
  role: string;
}

interface HeaderProps {
  user: any;
  profile?: Profile;
  onSignOut: () => void;
  onNavigate: (page: string) => void;
  onNavLinkClick?: (sectionId: string) => void;
  onShowAuth: () => void;
}

const Header = ({ user, profile, onSignOut, onNavigate, onNavLinkClick, onShowAuth }: HeaderProps) => {
  const isMobile = useIsMobile();
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  
  // Use the new notifications hook
  const {
    notifications,
    unreadCount,
    isLoading: notificationsLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications(user);

  const handleNotificationClick = (notification: any) => {
    // Mark as read if not already read
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    if (notification.target_page) {
      onNavigate(notification.target_page);
      
      // If it's targeting the profile page with orders tab, set focus to orders tab after navigation
      if (notification.target_page === 'profile' && notification.target_tab === 'orders') {
        setTimeout(() => {
          const ordersTab = document.querySelector('[data-value="orders"]') as HTMLElement;
          if (ordersTab) {
            ordersTab.click();
          }
        }, 100);
      }
    }
    
    setIsNotificationOpen(false);
  };

  const handleViewAllNotifications = () => {
    // Mark all notifications as read when "View All" is clicked
    markAllAsRead();
    
    if (profile?.role === 'admin') {
      onNavigate('admin');
    } else {
      onNavigate('profile');
      setTimeout(() => {
        const ordersTab = document.querySelector('[data-value="orders"]') as HTMLElement;
        if (ordersTab) {
          ordersTab.click();
        }
      }, 100);
    }
    setIsNotificationOpen(false);
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const formatNotificationTime = (createdAt: string) => {
    try {
      return formatDistanceToNow(new Date(createdAt), { 
        addSuffix: true,
        locale: id 
      });
    } catch (error) {
      // Fallback to a simple format if date-fns fails
      const date = new Date(createdAt);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      
      if (diffMins < 60) {
        return `${diffMins} menit yang lalu`;
      } else if (diffMins < 1440) {
        return `${Math.floor(diffMins / 60)} jam yang lalu`;
      } else {
        return `${Math.floor(diffMins / 1440)} hari yang lalu`;
      }
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="badge-modern bg-gradient-to-r from-red-500 to-red-600 text-white shadow-soft">
            <Shield className="w-3 h-3" />
            Administrator
          </span>
        );
      case 'customer':
        return (
          <span className="badge-modern bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-soft">
            <UserIcon className="w-3 h-3" />
            Customer
          </span>
        );
      default:
        return (
          <span className="badge-category">
            {role}
          </span>
        );
    }
  };

  const handleHomeClick = () => {
    onNavigate('home');
  };

  const handleMenuClick = () => {
    onNavigate('menu');
  };

  const handleAboutClick = () => {
    if (onNavLinkClick) {
      onNavLinkClick('about');
    }
  };

  const handleContactClick = () => {
    if (onNavLinkClick) {
      onNavLinkClick('contact');
    }
  };

  const isAdmin = profile?.role === 'admin';

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-orange-100/20 shadow-lg">
      <div className="container-modern py-2 sm:py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
            <div 
              className="flex items-center gap-2 sm:gap-3 cursor-pointer group hover-lift"
              onClick={handleHomeClick}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-soft group-hover:shadow-medium transition-all duration-300 hover-scale-sm">
                <span className="text-white font-bold text-lg sm:text-xl">W</span>
              </div>
              <h1 className="text-base sm:text-2xl font-bold bg-gradient-to-r from-orange-700 via-red-600 to-orange-800 bg-clip-text text-transparent transition-all duration-300"
                style={{
                  textShadow: '3px 3px 6px rgba(0,0,0,0.4), 1px 1px 0px rgba(255,255,255,0.4)',
                  WebkitTextStroke: '0.5px rgba(0,0,0,0.1)'
                }}
              >
                Warung IbuMus
              </h1>
            </div>
          </div>
          
          <nav className="hidden lg:flex items-center space-x-2">
            <Button 
              variant="ghost"
              onClick={handleHomeClick}
              className="btn-ghost px-4 py-2 rounded-xl hover:bg-orange-50 hover:text-orange-600"
            >
              Beranda
            </Button>
            <Button 
              variant="ghost"
              onClick={handleMenuClick}
              className="btn-ghost px-4 py-2 rounded-xl hover:bg-orange-50 hover:text-orange-600"
            >
              Menu
            </Button>
            {user && isAdmin && (
              <Button 
                variant="ghost"
                onClick={() => onNavigate('admin')}
                className="btn-ghost px-4 py-2 rounded-xl hover:bg-orange-50 hover:text-orange-600 flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Admin
              </Button>
            )}
            {!user && (
              <>
                <Button 
                  variant="ghost"
                  onClick={handleAboutClick}
                  className="btn-ghost px-4 py-2 rounded-xl hover:bg-orange-50 hover:text-orange-600"
                >
                  Tentang
                </Button>
                <Button 
                  variant="ghost"
                  onClick={handleContactClick}
                  className="btn-ghost px-4 py-2 rounded-xl hover:bg-orange-50 hover:text-orange-600"
                >
                  Kontak
                </Button>
              </>
            )}
          </nav>
          
          <div className="flex items-center space-x-1 sm:space-x-3 flex-shrink-0">
            {user && !isMobile && (
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-orange-600 hover:bg-orange-50 p-2 rounded-xl transition-all duration-200 hover-lift"
              >
                <Search className="w-5 h-5" />
              </Button>
            )}

            {user && (
              <Popover open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="relative text-gray-500 hover:text-orange-600 hover:bg-orange-50 p-1.5 sm:p-2 rounded-xl transition-all duration-200 hover-lift"
                  >
                    <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full flex items-center justify-center font-medium shadow-soft animate-pulse-soft">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-0 bg-white/90 backdrop-blur-sm border-0 shadow-strong animate-scale-in rounded-xl">
                  <div className="p-4 border-b border-gray-100/50">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">Notifikasi</h3>
                      {unreadCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleMarkAllAsRead}
                          className="text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 px-2 py-1 h-auto rounded-lg"
                        >
                          Tandai semua dibaca
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {notificationsLoading ? (
                      <div className="p-6 text-center text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-2"></div>
                        <p>Memuat notifikasi...</p>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="p-6 text-center text-gray-500">
                        <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Tidak ada notifikasi</p>
                      </div>
                    ) : (
                      <div className="py-2">
                        {notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`px-4 py-3 hover:bg-orange-50/50 cursor-pointer transition-all duration-200 border-l-4 hover-lift ${
                              notification.is_read 
                                ? 'border-l-transparent' 
                                : 'border-l-orange-500 bg-orange-50/30'
                            }`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4 className={`text-sm font-medium ${
                                    notification.is_read ? 'text-gray-700' : 'text-gray-900'
                                  }`}>
                                    {notification.title}
                                  </h4>
                                  {!notification.is_read && (
                                    <div className="w-2 h-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-full animate-pulse-soft"></div>
                                  )}
                                </div>
                                <p className={`text-xs mt-1 ${
                                  notification.is_read ? 'text-gray-500' : 'text-gray-600'
                                }`}>
                                  {notification.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {formatNotificationTime(notification.created_at)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {notifications.length > 0 && (
                    <div className="p-3 border-t border-gray-100/50">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-50 text-sm rounded-lg"
                        onClick={handleViewAllNotifications}
                      >
                        Lihat semua notifikasi
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            )}

            {/* Only show CartButton for non-admin users */}
            {user && !isAdmin && (
              <CartButton 
                user={user} 
                onCheckout={() => onNavigate('checkout')}
              />
            )}
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="flex items-center space-x-2 sm:space-x-3 hover:bg-orange-50 transition-all duration-200 px-2 sm:px-3 py-2 rounded-xl shadow-soft hover:shadow-medium hover-lift"
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-soft">
                      <UserIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                    <div className="hidden sm:flex flex-col items-start">
                      <span className="text-sm font-medium text-gray-900">
                        {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                      </span>
                      {profile?.role && (
                        <span className="text-xs text-gray-500 capitalize">
                          {profile.role}
                        </span>
                      )}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 bg-white/90 backdrop-blur-sm border-0 shadow-strong rounded-2xl p-2 animate-scale-in">
                  <div className="px-4 py-3 border-b border-gray-100/50">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-soft">
                        <UserIcon className="w-7 h-7 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{profile?.full_name || 'User'}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                        <div className="mt-2">
                          {profile?.role && getRoleBadge(profile.role)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="py-2">
                    <DropdownMenuItem 
                      className="flex items-center space-x-3 cursor-pointer rounded-xl px-3 py-2 hover:bg-orange-50 transition-colors duration-200 focus:bg-orange-50"
                      onClick={() => onNavigate('profile')}
                    >
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">Profil Saya</span>
                    </DropdownMenuItem>
                    
                    {isAdmin && (
                      <>
                        <DropdownMenuSeparator className="my-2" />
                        <DropdownMenuItem 
                          className="flex items-center space-x-3 cursor-pointer rounded-xl px-3 py-2 hover:bg-orange-50 transition-colors duration-200 focus:bg-orange-50"
                          onClick={() => onNavigate('admin')}
                        >
                          <Settings className="w-4 h-4 text-gray-500" />
                          <span className="font-medium">Admin Dashboard</span>
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <DropdownMenuSeparator className="my-2" />
                    <DropdownMenuItem 
                      className="flex items-center space-x-3 text-red-600 cursor-pointer rounded-xl px-3 py-2 hover:bg-red-50 transition-colors duration-200 focus:bg-red-50"
                      onClick={onSignOut}
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="font-medium">Keluar</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={onShowAuth}
                className="btn-primary shadow-medium rounded-lg sm:rounded-xl px-3 sm:px-6 py-2 font-medium hover-lift text-sm sm:text-base"
                size="sm"
              >
                {isMobile ? "Masuk" : "Masuk / Daftar"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
