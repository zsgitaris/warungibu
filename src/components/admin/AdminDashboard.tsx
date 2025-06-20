import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import AdminMenuManagement from "./AdminMenuManagement";
import AdminCategoryManagement from "./AdminCategoryManagement";
import AdminBannerManagement from "./AdminBannerManagement";
import AdminUserManagement from "./AdminUserManagement";
import AdminOrderManagement from "./AdminOrderManagement";
import AdminAnalytics from "./AdminAnalytics";
import { Sparkles, Shield, BarChart3, Settings, Users, Package, Image, ShoppingCart } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface AdminDashboardProps {
  user: User;
  onBack: () => void;
}

const AdminDashboard = ({ user, onBack }: AdminDashboardProps) => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch overview stats with comprehensive user count
  const { data: stats, refetch: refetchStats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      console.log("Fetching comprehensive admin stats...");
      
      // Get all stats in parallel with detailed user analysis
      const [
        { count: totalOrders },
        { count: totalMenuItems },
        { count: pendingOrders },
        { data: allProfiles, error: profilesError },
        { data: authUsers, error: authError }
      ] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('menu_items').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('profiles').select('id, role, created_at, full_name'),
        supabase.from('profiles').select('id', { count: 'exact', head: true })
      ]);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
        throw profilesError;
      }

      if (authError) {
        console.error("Error fetching user count:", authError);
      }

      // Calculate user counts comprehensively
      const totalUsers = allProfiles?.length || 0;
      const adminUsers = allProfiles?.filter(u => u.role === 'admin')?.length || 0;
      const customerUsers = allProfiles?.filter(u => u.role === 'customer')?.length || 0;
      
      console.log("=== COMPREHENSIVE USER ANALYSIS ===");
      console.log("- Total profiles found:", totalUsers);
      console.log("- Admin users:", adminUsers);
      console.log("- Customer users:", customerUsers);
      console.log("- Profile breakdown by role:");
      const roleBreakdown = allProfiles?.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log(roleBreakdown);
      console.log("- All profiles data:", allProfiles);
      console.log("=====================================");

      // Fetch revenue from delivered orders
      const { data: deliveredOrders, error: revenueError } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('status', 'delivered');

      if (revenueError) {
        console.error("Error fetching revenue:", revenueError);
      }

      console.log("Delivered orders for revenue:", deliveredOrders);

      const revenue = deliveredOrders?.reduce((sum, order) => {
        const amount = Number(order.total_amount) || 0;
        console.log("Adding to revenue:", amount);
        return sum + amount;
      }, 0) || 0;

      console.log("Calculated total revenue:", revenue);
      
      const finalStats = {
        totalOrders: totalOrders || 0,
        totalUsers: totalUsers,
        totalMenuItems: totalMenuItems || 0,
        pendingOrders: pendingOrders || 0,
        totalRevenue: revenue,
        adminUsers: adminUsers,
        customerUsers: customerUsers
      };
      
      console.log("Final comprehensive stats:", finalStats);

      return finalStats;
    },
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Admin Background Decorations */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Main gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-100/40 via-transparent to-blue-100/40"></div>
        
        {/* Floating decorative elements */}
        <div className="absolute top-10 left-10 w-80 h-80 bg-gradient-to-br from-blue-200/25 to-indigo-200/25 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 right-10 w-96 h-96 bg-gradient-to-bl from-purple-200/20 to-slate-200/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/3 w-72 h-72 bg-gradient-to-tr from-cyan-200/15 to-blue-200/15 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Geometric shapes */}
        <div className="absolute top-1/4 left-1/4 w-8 h-8 bg-blue-300/20 rotate-45 animate-bounce" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-3/4 right-1/4 w-6 h-6 bg-indigo-300/20 rotate-12 animate-bounce" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute bottom-1/3 left-1/6 w-10 h-10 bg-slate-300/15 rounded-full animate-pulse" style={{ animationDelay: '2.5s' }}></div>
        
        {/* Admin-specific sparkle effects */}
        <div className="absolute top-20 right-1/3 opacity-60">
          <Shield className="w-6 h-6 text-blue-500 animate-pulse" />
        </div>
        <div className="absolute bottom-1/4 left-1/5 opacity-40">
          <BarChart3 className="w-5 h-5 text-indigo-500 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="absolute top-1/3 right-1/6 opacity-50">
          <Settings className="w-4 h-4 text-slate-500 animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-2 sm:px-4 py-4 sm:py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center">
            <Button 
              onClick={onBack} 
              variant="ghost" 
              size="sm"
              className="glass border-0 hover:bg-white/80 text-gray-700 hover:text-gray-900 backdrop-blur-sm rounded-full px-3 sm:px-4 py-2 transition-all duration-300 shadow-soft hover:shadow-medium"
            >
              ← Kembali
            </Button>
            <div className="ml-2 sm:ml-4 flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-medium">
                <Shield className="w-4 sm:w-6 h-4 sm:h-6 text-white" />
              </div>
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
          </div>
          <Button
            onClick={() => refetchStats()}
            variant="outline"
            size="sm"
            className="glass border-0 bg-white/60 hover:bg-white/80 text-gray-700 hover:text-gray-900 shadow-soft hover:shadow-medium transition-all duration-300"
          >
            Refresh Data
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {isMobile ? (
            /* Mobile Tabs - Scrollable Layout */
            <div className="flex flex-col space-y-4">
              <div className="flex flex-nowrap overflow-x-auto whitespace-nowrap px-4 space-x-2 scrollbar-thin scrollbar-thumb-gray-300">
                <TabsList className="flex flex-nowrap glass border-0 bg-white/60 backdrop-blur-sm p-1 rounded-xl h-auto min-w-max">
                  <TabsTrigger 
                    value="overview" 
                    className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-medium rounded-lg transition-all duration-200 flex items-center gap-1 text-xs py-2 px-3 whitespace-nowrap"
                  >
                    <BarChart3 className="w-3 h-3" />
                    Overview
                  </TabsTrigger>
                  <TabsTrigger 
                    value="orders" 
                    className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-medium rounded-lg transition-all duration-200 flex items-center gap-1 text-xs py-2 px-3 whitespace-nowrap"
                  >
                    <ShoppingCart className="w-3 h-3" />
                    Pesanan
                  </TabsTrigger>
                  <TabsTrigger 
                    value="menu" 
                    className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-medium rounded-lg transition-all duration-200 flex items-center gap-1 text-xs py-2 px-3 whitespace-nowrap"
                  >
                    <Package className="w-3 h-3" />
                    Menu
                  </TabsTrigger>
                  <TabsTrigger 
                    value="categories" 
                    className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-medium rounded-lg transition-all duration-200 flex items-center gap-1 text-xs py-2 px-3 whitespace-nowrap"
                  >
                    <Settings className="w-3 h-3" />
                    Kategori
                  </TabsTrigger>
                  <TabsTrigger 
                    value="banners" 
                    className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-medium rounded-lg transition-all duration-200 flex items-center gap-1 text-xs py-2 px-3 whitespace-nowrap"
                  >
                    <Image className="w-3 h-3" />
                    Banner
                  </TabsTrigger>
                  <TabsTrigger 
                    value="users" 
                    className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-medium rounded-lg transition-all duration-200 flex items-center gap-1 text-xs py-2 px-3 whitespace-nowrap"
                  >
                    <Users className="w-3 h-3" />
                    Users
                  </TabsTrigger>
                  <TabsTrigger 
                    value="analytics" 
                    className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-medium rounded-lg transition-all duration-200 flex items-center gap-1 text-xs py-2 px-3 whitespace-nowrap"
                  >
                    <Sparkles className="w-3 h-3" />
                    Analytics
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
          ) : (
            /* Desktop Tabs - Horizontal Layout */
            <TabsList className="grid w-full grid-cols-7 glass border-0 bg-white/60 backdrop-blur-sm p-1 rounded-xl">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-medium rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="orders" 
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-medium rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                Pesanan
              </TabsTrigger>
              <TabsTrigger 
                value="menu" 
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-medium rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                <Package className="w-4 h-4" />
                Menu
              </TabsTrigger>
              <TabsTrigger 
                value="categories" 
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-medium rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                Kategori
              </TabsTrigger>
              <TabsTrigger 
                value="banners" 
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-medium rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                <Image className="w-4 h-4" />
                Banner
              </TabsTrigger>
              <TabsTrigger 
                value="users" 
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-medium rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                <Users className="w-4 h-4" />
                Users
              </TabsTrigger>
              <TabsTrigger 
                value="analytics" 
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-medium rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Analytics
              </TabsTrigger>
            </TabsList>
          )}

          <div className="mt-4 sm:mt-6">
            <TabsContent value="overview">
              <ScrollArea className="h-[calc(100vh-200px)] w-full">
                <div className="pr-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
                    <Card className="glass border-0 shadow-strong backdrop-blur-xl bg-white/80 hover:bg-white/90 transition-all duration-300 card-hover">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-700">Total Pesanan</CardTitle>
                        <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg">
                          <ShoppingCart className="w-4 h-4 text-white" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-gray-900">{stats?.totalOrders || 0}</div>
                      </CardContent>
                    </Card>

                    <Card className="glass border-0 shadow-strong backdrop-blur-xl bg-white/80 hover:bg-white/90 transition-all duration-300 card-hover">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-700">Pesanan Pending</CardTitle>
                        <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg">
                          <ShoppingCart className="w-4 h-4 text-white" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{stats?.pendingOrders || 0}</div>
                      </CardContent>
                    </Card>

                    <Card className="glass border-0 shadow-strong backdrop-blur-xl bg-white/80 hover:bg-white/90 transition-all duration-300 card-hover">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-700">Total Users</CardTitle>
                        <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-lg">
                          <Users className="w-4 h-4 text-white" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-gray-900">{stats?.totalUsers || 0}</div>
                        <p className="text-xs text-gray-500 mt-1">
                          {stats?.adminUsers || 0} admin, {stats?.customerUsers || 0} customer
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="glass border-0 shadow-strong backdrop-blur-xl bg-white/80 hover:bg-white/90 transition-all duration-300 card-hover">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-700">Total Revenue</CardTitle>
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg">
                          <BarChart3 className="w-4 h-4 text-white" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-gray-900">
                          Rp {(stats?.totalRevenue || 0).toLocaleString('id-ID')}
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <Card className="glass border-0 shadow-strong backdrop-blur-xl bg-white/80 hover:bg-white/90 transition-all duration-300">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-900">
                          <Package className="w-5 h-5" />
                          Menu Items
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-3xl font-bold mb-2 text-gray-900">{stats?.totalMenuItems || 0}</div>
                        <p className="text-sm text-gray-600">Total item menu tersedia</p>
                      </CardContent>
                    </Card>

                    <Card className="glass border-0 shadow-strong backdrop-blur-xl bg-white/80 hover:bg-white/90 transition-all duration-300">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-900">
                          <Settings className="w-5 h-5" />
                          Quick Actions
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <Button 
                          className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-medium hover:shadow-strong transition-all duration-300" 
                          onClick={() => setActiveTab("orders")}
                        >
                          Kelola Pesanan
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full glass border-0 bg-white/60 hover:bg-white/80 text-gray-700 hover:text-gray-900 shadow-soft hover:shadow-medium transition-all duration-300" 
                          onClick={() => setActiveTab("menu")}
                        >
                          Kelola Menu
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="orders">
              <div className="glass border-0 shadow-strong backdrop-blur-xl bg-white/80 rounded-xl p-3 sm:p-6">
                <ScrollArea className="h-[calc(100vh-250px)] w-full">
                  <div className="pr-4">
                    <AdminOrderManagement user={user} />
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="menu">
              <div className="glass border-0 shadow-strong backdrop-blur-xl bg-white/80 rounded-xl p-3 sm:p-6">
                <ScrollArea className="h-[calc(100vh-250px)] w-full">
                  <div className="pr-4">
                    <AdminMenuManagement />
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="categories">
              <div className="glass border-0 shadow-strong backdrop-blur-xl bg-white/80 rounded-xl p-3 sm:p-6">
                <ScrollArea className="h-[calc(100vh-250px)] w-full">
                  <div className="pr-4">
                    <AdminCategoryManagement />
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="banners">
              <div className="glass border-0 shadow-strong backdrop-blur-xl bg-white/80 rounded-xl p-3 sm:p-6">
                <ScrollArea className="h-[calc(100vh-250px)] w-full">
                  <div className="pr-4">
                    <AdminBannerManagement user={user} />
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="users">
              <div className="glass border-0 shadow-strong backdrop-blur-xl bg-white/80 rounded-xl p-3 sm:p-6">
                <ScrollArea className="h-[calc(100vh-250px)] w-full">
                  <div className="pr-4">
                    <AdminUserManagement user={user} />
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="analytics">
              <div className="glass border-0 shadow-strong backdrop-blur-xl bg-white/80 rounded-xl p-3 sm:p-6">
                <ScrollArea className="h-[calc(100vh-250px)] w-full">
                  <div className="pr-4">
                    <AdminAnalytics user={user} />
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;