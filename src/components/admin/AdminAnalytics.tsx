import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { 
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent 
} from "@/components/ui/chart";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import { Download } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportToPDF, exportToExcel } from "@/utils/exportUtils";

interface AdminAnalyticsProps {
  user: User;
}

const AdminAnalytics = ({ user }: AdminAnalyticsProps) => {
  // Fetch analytics data
  const { data: analytics, isLoading, error } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      try {
        // Revenue by day (last 7 days) - using 'delivered' status instead of 'completed'
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        console.log('Fetching data since:', sevenDaysAgo);

        const [
          { data: dailyRevenue, error: revenueError },
          { data: ordersByStatus, error: statusError },
          { data: popularItems, error: itemsError }
        ] = await Promise.all([
          supabase
            .from('orders')
            .select('created_at, total_amount, status')
            .eq('status', 'delivered')
            .gte('created_at', sevenDaysAgo),
          
          supabase
            .from('orders')
            .select('status'),
          
          supabase
            .from('order_items')
            .select(`
              quantity,
              menu_items!inner (name)
            `)
        ]);

        if (revenueError) throw revenueError;
        if (statusError) throw statusError;
        if (itemsError) throw itemsError;

        console.log('Raw data:', { dailyRevenue, ordersByStatus, popularItems });

        // Process daily revenue
        const revenueByDay = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
          const dayRevenue = (dailyRevenue || []).filter(order => 
            new Date(order.created_at).toDateString() === date.toDateString()
          ).reduce((sum, order) => sum + Number(order.total_amount || 0), 0);

          return {
            date: date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' }),
            revenue: dayRevenue
          };
        });

        // Process orders by status
        const statusCounts = (ordersByStatus || []).reduce((acc, order) => {
          const status = order.status || 'unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        const orderStatusData = Object.entries(statusCounts).map(([status, count]) => ({
          status: status.charAt(0).toUpperCase() + status.slice(1),
          count
        }));

        // Process popular items
        const itemCounts = (popularItems || []).reduce((acc, item) => {
          const name = item.menu_items?.name || 'Unknown';
          acc[name] = (acc[name] || 0) + (item.quantity || 0);
          return acc;
        }, {} as Record<string, number>);

        const popularMenuData = Object.entries(itemCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([name, quantity]) => ({ name, quantity }));

        console.log('Processed data:', { revenueByDay, orderStatusData, popularMenuData });

        return {
          revenueByDay,
          orderStatusData,
          popularMenuData
        };
      } catch (error) {
        console.error('Error fetching analytics:', error);
        throw error;
      }
    },
  });

  const COLORS = ['#f97316', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  const handleExportPDF = () => {
    if (analytics) {
      exportToPDF(analytics);
    }
  };

  const handleExportExcel = () => {
    if (analytics) {
      exportToExcel(analytics);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading analytics...</div>;
  }

  if (error) {
    return <div className="flex justify-center p-8 text-red-600">Error loading analytics: {error.message}</div>;
  }

  const chartConfig = {
    revenue: {
      label: "Revenue",
      color: "#f97316",
    },
    count: {
      label: "Count",
      color: "#3b82f6",
    },
    quantity: {
      label: "Quantity",
      color: "#10b981",
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Analytics & Reports</h2>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Download Report
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={handleExportPDF}>
              Download PDF
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportExcel}>
              Download Excel
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue 7 Hari Terakhir</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.revenueByDay || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => `Rp ${value.toLocaleString('id-ID')}`} />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value) => [`Rp ${Number(value).toLocaleString('id-ID')}`, 'Revenue']}
                  />
                  <Bar dataKey="revenue" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Status Pesanan</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics?.orderStatusData || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ status, count }) => `${status}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {(analytics?.orderStatusData || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Popular Menu Items */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Menu Paling Populer</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.popularMenuData || []} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <ChartTooltip 
                    content={<ChartTooltipContent />}
                    formatter={(value) => [value, 'Terjual']} 
                  />
                  <Bar dataKey="quantity" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Total Revenue 7 Hari</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              Rp {(analytics?.revenueByDay?.reduce((sum, day) => sum + day.revenue, 0) || 0).toLocaleString('id-ID')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rata-rata per Hari</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              Rp {Math.round((analytics?.revenueByDay?.reduce((sum, day) => sum + day.revenue, 0) || 0) / 7).toLocaleString('id-ID')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Menu Terlaris</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-orange-600">
              {analytics?.popularMenuData?.[0]?.name || 'Belum ada data'}
            </div>
            <div className="text-sm text-gray-600">
              {analytics?.popularMenuData?.[0]?.quantity || 0} terjual
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;
