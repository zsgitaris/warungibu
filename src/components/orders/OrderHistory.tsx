import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { usePagination } from "@/hooks/usePagination";
import PaginationControls from "@/components/common/PaginationControls";
import SearchBar from "@/components/search/SearchBar";

interface OrderHistoryProps {
  user: User;
}

interface Order {
  id: string;
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
  user_id: string;
  order_items: Array<{
    id: string;
    quantity: number;
    subtotal: number;
    menu_items: {
      name: string;
      price: number;
    } | null;
  }>;
}

const OrderHistory = ({ user }: OrderHistoryProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const { data: orders = [] } = useQuery({
    queryKey: ['orders', user.id],
    queryFn: async (): Promise<Order[]> => {
      console.log("Fetching orders for user:", user.id);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            menu_items (
              name,
              price
            )
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error("Error fetching orders:", error);
        throw error;
      }
      
      console.log("Fetched orders:", data);
      
      // Log orders with missing items for debugging
      const ordersWithoutItems = data?.filter(order => 
        !order.order_items || order.order_items.length === 0
      );
      
      if (ordersWithoutItems && ordersWithoutItems.length > 0) {
        console.warn("Orders without items found:", ordersWithoutItems.map(o => ({
          id: o.id,
          order_number: o.order_number,
          created_at: o.created_at
        })));
      }
      
      return data as Order[];
    },
  });

  // Filter orders based on search query and status
  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchQuery === "" || 
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.delivery_address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.order_items.some((item: any) => 
        item.menu_items?.name?.toLowerCase().includes(searchQuery.toLowerCase())
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Menunggu';
      case 'confirmed': return 'Dikonfirmasi';
      case 'preparing': return 'Diproses';
      case 'ready': return 'Siap Diambil';
      case 'delivered': return 'Pesanan Telah Diterima';
      case 'cancelled': return 'Dibatalkan';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    goToPage(1); // Reset to first page when searching
  };

  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    goToPage(1); // Reset to first page when filtering
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Belum ada riwayat pesanan</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-6">Riwayat Pesanan</h2>
      
      {/* Search and Filter Section */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <SearchBar 
            onSearch={handleSearch}
            placeholder="Cari nomor pesanan, alamat, atau nama menu..."
          />
        </div>
        
        <div className="flex flex-nowrap overflow-x-auto whitespace-nowrap space-x-2 scrollbar-thin scrollbar-thumb-gray-300">
          {['all', 'pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'].map((status) => (
            <Button
              key={status}
              variant={selectedStatus === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStatusChange(status)}
              className="text-xs min-w-max"
            >
              {status === 'all' ? 'Semua' : getStatusLabel(status)}
            </Button>
          ))}
        </div>
      </div>

      {/* Results Info */}
      {searchQuery && (
        <div className="text-sm text-gray-600 mb-4">
          Menampilkan {totalItems} hasil untuk "{searchQuery}"
          {selectedStatus !== 'all' && ` dengan status ${getStatusLabel(selectedStatus)}`}
        </div>
      )}
      
      {paginatedOrders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">
            {searchQuery || selectedStatus !== 'all' 
              ? 'Tidak ada pesanan yang sesuai dengan pencarian atau filter'
              : 'Belum ada riwayat pesanan'
            }
          </p>
        </div>
      ) : (
        <>
          {paginatedOrders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{order.order_number}</CardTitle>
                    <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {getStatusLabel(order.status)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Order Items Section */}
                <div className="space-y-2 mb-4">
                  {order.order_items && order.order_items.length > 0 ? (
                    order.order_items.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>
                          {item.menu_items?.name || 'Item tidak tersedia'} x {item.quantity}
                        </span>
                        <span>{formatPrice(item.subtotal)}</span>
                      </div>
                    ))
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-yellow-700 text-sm">
                        ⚠️ Rincian item pesanan tidak tersedia. 
                        Silakan hubungi customer service untuk informasi lebih lanjut.
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="border-t pt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span className="text-orange-600">{formatPrice(order.total_amount)}</span>
                  </div>
                </div>
                
                <div className="mt-2 text-sm text-gray-600">
                  <p><strong>Alamat:</strong> {order.delivery_address}</p>
                  {order.notes && <p><strong>Catatan:</strong> {order.notes}</p>}
                </div>

                {/* Cancellation Reason */}
                {order.cancellation_reason && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-medium text-red-800 mb-1">Alasan Pembatalan:</h4>
                    <p className="text-red-700 text-sm">{order.cancellation_reason}</p>
                  </div>
                )}

                {order.status === 'delivered' && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 font-medium text-sm">
                      ✅ Pesanan telah diterima dengan baik. Terima kasih telah memesan!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            onPageChange={goToPage}
            canGoNext={canGoNext}
            canGoPrev={canGoPrev}
            itemsPerPage={10}
          />
        </>
      )}
    </div>
  );
};

export default OrderHistory;