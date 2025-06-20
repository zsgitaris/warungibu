import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePagination } from "@/hooks/usePagination";
import PaginationControls from "@/components/common/PaginationControls";
import SearchBar from "@/components/search/SearchBar";
import CancellationModal from "./CancellationModal";

interface AdminOrderManagementProps {
  user: User;
}

// Define the extended order type with user profile
interface OrderWithProfile {
  id: string;
  user_id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  total_amount: number;
  status: string;
  notes: string | null;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  order_items: Array<{
    quantity: number;
    unit_price: number;
    subtotal: number;
    menu_items: {
      name: string;
    } | null;
  }>;
  user_profile?: {
    id: string;
    full_name: string;
  } | null;
}

const AdminOrderManagement = ({ user }: AdminOrderManagementProps) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState("");
  const [cancellationModal, setCancellationModal] = useState<{
    isOpen: boolean;
    orderId: string;
    orderNumber: string;
  }>({
    isOpen: false,
    orderId: "",
    orderNumber: ""
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async (): Promise<OrderWithProfile[]> => {
      // Get orders with order_items first
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            unit_price,
            subtotal,
            menu_items (name)
          )
        `)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        throw ordersError;
      }

      // Get unique user IDs from orders
      const userIds = [...new Set(ordersData?.map(order => order.user_id) || [])];
      
      if (userIds.length === 0) {
        return ordersData as OrderWithProfile[];
      }

      // Fetch profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Combine orders with profile data
      const ordersWithProfiles: OrderWithProfile[] = ordersData?.map(order => ({
        ...order,
        user_profile: profilesData?.find(profile => profile.id === order.user_id) || null
      })) || [];

      return ordersWithProfiles;
    },
  });

  // Filter orders based on search query and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchQuery === "" || 
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customer_phone.includes(searchQuery) ||
      order.delivery_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.user_profile?.full_name && order.user_profile.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      order.order_items.some(item => 
        item.menu_items?.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    
    const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Pagination
  const {
    currentItems: paginatedOrders,
    currentPage,
    totalPages,
    totalItems,
    goToPage,
    canGoNext,
    canGoPrev,
  } = usePagination({ data: filteredOrders, itemsPerPage: 10 });

  const updateOrderStatusMutation = useMutation({
    mutationFn: async ({ orderId, newStatus, cancellationReason }: { 
      orderId: string; 
      newStatus: string; 
      cancellationReason?: string;
    }) => {
      console.log('Updating order status:', { orderId, newStatus, cancellationReason });
      
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      // Add cancellation reason if provided
      if (cancellationReason) {
        updateData.cancellation_reason = cancellationReason;
      }
      
      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select();
      
      if (error) {
        console.error('Error updating order status:', error);
        throw error;
      }

      console.log('Successfully updated order status:', data);
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] }); // Invalidate customer orders too
      
      const statusMessage = variables.cancellationReason 
        ? `Pesanan berhasil dibatalkan: ${variables.cancellationReason}`
        : `Status pesanan berhasil diperbarui menjadi ${getStatusLabel(variables.newStatus)}`;
        
      toast({
        title: "Berhasil",
        description: statusMessage,
      });
    },
    onError: (error: any) => {
      console.error('Order status update failed:', error);
      
      let errorMessage = "Gagal memperbarui status pesanan";
      
      if (error?.message?.includes('orders_status_check')) {
        errorMessage = "Status pesanan tidak valid. Status yang diizinkan hanya: pending, confirmed, ready, delivered, cancelled";
      } else if (error?.message?.includes('not found')) {
        errorMessage = "Pesanan tidak ditemukan";
      } else if (error?.message?.includes('permission')) {
        errorMessage = "Anda tidak memiliki izin untuk memperbarui pesanan ini";
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'Pending', variant: 'secondary' as const },
      confirmed: { label: 'Dikonfirmasi', variant: 'default' as const },
      ready: { label: 'Siap', variant: 'default' as const },
      delivered: { label: 'Terkirim', variant: 'default' as const },
      cancelled: { label: 'Dibatalkan', variant: 'destructive' as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'confirmed': return 'Dikonfirmasi';
      case 'ready': return 'Siap';
      case 'delivered': return 'Terkirim';
      case 'cancelled': return 'Dibatalkan';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const handleStatusUpdate = (orderId: string, newStatus: string) => {
    console.log('Handling status update:', { orderId, newStatus });
    updateOrderStatusMutation.mutate({ orderId, newStatus });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    goToPage(1); // Reset to first page when searching
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    goToPage(1); // Reset to first page when filtering
  };

  const handleCancelOrder = (orderId: string, orderNumber: string) => {
    setCancellationModal({
      isOpen: true,
      orderId,
      orderNumber
    });
  };

  const handleCancelConfirm = (reason: string) => {
    updateOrderStatusMutation.mutate({ 
      orderId: cancellationModal.orderId, 
      newStatus: 'cancelled',
      cancellationReason: reason
    });
    setCancellationModal({ isOpen: false, orderId: "", orderNumber: "" });
  };

  const handleCancelModalClose = () => {
    setCancellationModal({ isOpen: false, orderId: "", orderNumber: "" });
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Kelola Pesanan</h2>
      </div>

      {/* Search and Filter Section */}
      <div className="flex flex-col gap-4">
        <SearchBar 
          onSearch={handleSearch}
          placeholder="Cari nomor pesanan, nama customer, telepon, alamat, atau menu..."
        />
        
        <div className="flex flex-nowrap overflow-x-auto whitespace-nowrap px-4 space-x-2 scrollbar-thin scrollbar-thumb-gray-300">
          {['all', 'pending', 'confirmed', 'ready', 'delivered', 'cancelled'].map((status) => (
            <Button
              key={status}
              variant={selectedStatus === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusChange(status)}
              className="min-w-max"
            >
              {status === 'all' ? 'Semua' : getStatusLabel(status)}
            </Button>
          ))}
        </div>
      </div>

      {/* Results Info */}
      {searchQuery && (
        <div className="text-sm text-gray-600">
          Menampilkan {totalItems} hasil untuk "{searchQuery}"
          {selectedStatus !== 'all' && ` dengan status ${getStatusLabel(selectedStatus)}`}
        </div>
      )}

      <div className="grid gap-4">
        {paginatedOrders?.map((order) => (
          <Card key={order.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{order.order_number}</CardTitle>
                  <p className="text-sm text-gray-600">
                    {order.user_profile?.full_name || order.customer_name} - {order.customer_phone}
                  </p>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <div className="text-right">
                  {getStatusBadge(order.status)}
                  <p className="text-lg font-bold mt-1">
                    Rp {Number(order.total_amount).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium mb-2">Items:</h4>
                  <div className="space-y-1">
                    {order.order_items?.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{item.menu_items?.name} x{item.quantity}</span>
                        <span>Rp {Number(item.subtotal).toLocaleString('id-ID')}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-1">Alamat Pengiriman:</h4>
                  <p className="text-sm text-gray-600">{order.delivery_address}</p>
                </div>

                {order.notes && (
                  <div>
                    <h4 className="font-medium mb-1">Catatan:</h4>
                    <p className="text-sm text-gray-600">{order.notes}</p>
                  </div>
                )}

                {order.cancellation_reason && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <h4 className="font-medium mb-1 text-red-800">Alasan Pembatalan:</h4>
                    <p className="text-sm text-red-700">{order.cancellation_reason}</p>
                  </div>
                )}

                <div className="flex flex-nowrap overflow-x-auto whitespace-nowrap pt-3 border-t space-x-2 scrollbar-thin scrollbar-thumb-gray-300">
                  {order.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(order.id, 'confirmed')}
                        disabled={updateOrderStatusMutation.isPending}
                      >
                        Konfirmasi
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleCancelOrder(order.id, order.order_number)}
                        disabled={updateOrderStatusMutation.isPending}
                      >
                        Batalkan
                      </Button>
                    </>
                  )}
                  {order.status === 'confirmed' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate(order.id, 'ready')}
                      disabled={updateOrderStatusMutation.isPending}
                    >
                      Siap
                    </Button>
                  )}
                  {order.status === 'ready' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusUpdate(order.id, 'delivered')}
                      disabled={updateOrderStatusMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      Selesai
                    </Button>
                  )}
                  {order.status === 'delivered' && (
                    <div className="text-sm text-green-600 font-medium">
                      ✅ Pesanan telah diselesaikan dan diterima pelanggan
                    </div>
                  )}
                  {order.status === 'cancelled' && (
                    <div className="text-sm text-red-600 font-medium">
                      ❌ Pesanan telah dibatalkan
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {paginatedOrders?.length === 0 && totalItems > 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">Tidak ada data pada halaman ini</p>
            </CardContent>
          </Card>
        )}

        {totalItems === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">
                {searchQuery || selectedStatus !== 'all' 
                  ? 'Tidak ada pesanan yang sesuai dengan pencarian atau filter'
                  : 'Tidak ada pesanan ditemukan'
                }
              </p>
            </CardContent>
          </Card>
        )}

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

      <CancellationModal
        isOpen={cancellationModal.isOpen}
        onClose={handleCancelModalClose}
        onConfirm={handleCancelConfirm}
        orderNumber={cancellationModal.orderNumber}
        isLoading={updateOrderStatusMutation.isPending}
      />
    </div>
  );
};

export default AdminOrderManagement;