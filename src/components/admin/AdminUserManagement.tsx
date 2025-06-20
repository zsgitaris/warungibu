import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { usePagination } from "@/hooks/usePagination";
import PaginationControls from "@/components/common/PaginationControls";
import { Users, Shield, UserCheck, UserX, Calendar, Phone, Mail, MoreVertical } from "lucide-react";

interface AdminUserManagementProps {
  user: User;
}

const AdminUserManagement = ({ user }: AdminUserManagementProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch users with improved query
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      console.log("Fetching all users for admin management...");
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone_number, role, created_at')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching users:", error);
        throw error;
      }
      
      console.log("Fetched users data:", data);
      console.log("Total users count:", data?.length);
      console.log("Admin count:", data?.filter(u => u.role === 'admin').length);
      console.log("Customer count:", data?.filter(u => u.role === 'customer').length);
      console.log("Users by role breakdown:", data?.reduce((acc, user) => {
        acc[user.role] = (acc[user.role] || 0) + 1;
        return acc;
      }, {} as Record<string, number>));
      
      return data || [];
    },
    staleTime: 30000, // Cache for 30 seconds
    refetchOnWindowFocus: true,
  });

  // Calculate statistics with better error handling
  const totalUsers = users?.length || 0;
  const adminUsers = users?.filter(u => u.role === 'admin').length || 0;
  const customerUsers = users?.filter(u => u.role === 'customer').length || 0;

  console.log("Calculated stats:", { totalUsers, adminUsers, customerUsers });

  // Pagination
  const {
    currentItems: paginatedUsers,
    currentPage,
    totalPages,
    totalItems,
    goToPage,
    canGoNext,
    canGoPrev,
  } = usePagination({ data: users, itemsPerPage: 10 });

  // Update user role
  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      console.log("Updating user role:", { userId, newRole });
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) {
        console.error("Error updating user role:", error);
        throw error;
      }
      console.log("User role updated successfully");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] }); // Also refresh admin stats
      toast({
        title: "Berhasil",
        description: "Role user berhasil diperbarui",
      });
    },
    onError: (error) => {
      console.error("Update user role mutation error:", error);
      toast({
        title: "Error",
        description: "Gagal memperbarui role user",
        variant: "destructive",
      });
    },
  });

  const getRoleBadge = (role: string) => {
    const roleConfig = {
      admin: { 
        label: 'Admin', 
        variant: 'destructive' as const,
        icon: Shield,
        className: 'bg-red-500/10 text-red-700 border-red-200 hover:bg-red-500/20'
      },
      customer: { 
        label: 'Customer', 
        variant: 'secondary' as const,
        icon: UserCheck,
        className: 'bg-blue-500/10 text-blue-700 border-blue-200 hover:bg-blue-500/20'
      }
    };

    const config = roleConfig[role as keyof typeof roleConfig] || roleConfig.customer;
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className={`${config.className} flex items-center gap-1.5 px-3 py-1.5 font-medium transition-all duration-200`}>
        <IconComponent className="w-3.5 h-3.5" />
        {config.label}
      </Badge>
    );
  };

  const handleRoleUpdate = (userId: string, newRole: string) => {
    if (userId === user.id && newRole !== 'admin') {
      toast({
        title: "Error",
        description: "Anda tidak dapat mengubah role diri sendiri",
        variant: "destructive",
      });
      return;
    }
    updateUserRoleMutation.mutate({ userId, newRole });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-25 to-red-50">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-100/40 via-transparent to-red-100/40"></div>
          <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-br from-orange-200/30 to-amber-200/30 rounded-full blur-3xl animate-pulse"></div>
        </div>
        <div className="relative z-10 flex justify-center items-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Memuat data pengguna...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-medium">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Kelola Users</h2>
            <p className="text-gray-600 mt-1">Kelola pengguna dan hak akses sistem</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass border-0 shadow-soft backdrop-blur-xl bg-white/80 hover:bg-white/90 transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Total Users</p>
                <div className="text-3xl font-bold text-gray-900">
                  {totalUsers}
                </div>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors duration-200">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-0 shadow-soft backdrop-blur-xl bg-white/80 hover:bg-white/90 transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Admin</p>
                <div className="text-3xl font-bold text-red-600">
                  {adminUsers}
                </div>
              </div>
              <div className="p-3 bg-red-500/10 rounded-xl group-hover:bg-red-500/20 transition-colors duration-200">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-0 shadow-soft backdrop-blur-xl bg-white/80 hover:bg-white/90 transition-all duration-300 group">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Customer</p>
                <div className="text-3xl font-bold text-blue-600">
                  {customerUsers}
                </div>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition-colors duration-200">
                <UserCheck className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="glass border-0 shadow-strong backdrop-blur-xl bg-white/80 hover:bg-white/90 transition-all duration-300">
        <CardHeader className="border-b border-gray-100/50">
          <CardTitle className="flex items-center gap-3 text-gray-900">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg">
              <Users className="w-5 h-5 text-white" />
            </div>
            Daftar Users
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-gray-100/50 bg-gray-50/50">
                  <TableHead className="font-semibold text-gray-700 py-4">
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4" />
                      Nama
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Telepon
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">Role</TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Bergabung
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold text-gray-700">
                    <div className="flex items-center gap-2">
                      <MoreVertical className="w-4 h-4" />
                      Aksi
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedUsers?.map((userProfile, index) => (
                  <TableRow 
                    key={userProfile.id} 
                    className="border-b border-gray-100/30 hover:bg-gray-50/50 transition-colors duration-200"
                  >
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                          {userProfile.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {userProfile.full_name || 'Unnamed User'}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {userProfile.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {userProfile.id === user.id ? user.email : 'Email tersembunyi'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {userProfile.phone_number || '-'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getRoleBadge(userProfile.role)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {new Date(userProfile.created_at).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Select
                        value={userProfile.role}
                        onValueChange={(value) => handleRoleUpdate(userProfile.id, value)}
                        disabled={updateUserRoleMutation.isPending}
                      >
                        <SelectTrigger className="w-36 h-9 border-gray-200 focus:border-orange-300 focus:ring-orange-200 transition-colors duration-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-white/95 backdrop-blur-sm border-gray-200">
                          <SelectItem value="customer" className="cursor-pointer hover:bg-blue-50">
                            <div className="flex items-center gap-2">
                              <UserCheck className="w-4 h-4 text-blue-600" />
                              Customer
                            </div>
                          </SelectItem>
                          <SelectItem value="admin" className="cursor-pointer hover:bg-red-50">
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-red-600" />
                              Admin
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {paginatedUsers?.length === 0 && totalItems > 0 && (
              <div className="text-center py-12">
                <UserX className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Tidak ada data pada halaman ini</p>
              </div>
            )}

            {totalItems === 0 && (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">Tidak ada user ditemukan</p>
              </div>
            )}

            <div className="p-6 border-t border-gray-100/50">
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                onPageChange={goToPage}
                canGoNext={canGoNext}
                canGoPrev={canGoPrev}
                itemsPerPage={10}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUserManagement;
