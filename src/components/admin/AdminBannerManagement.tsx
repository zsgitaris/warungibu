import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Pencil, Trash2, Plus, Image as ImageIcon } from "lucide-react";
import { usePagination } from "@/hooks/usePagination";
import PaginationControls from "@/components/common/PaginationControls";
import ImageUpload from "./ImageUpload";

interface AdminBannerManagementProps {
  user: User;
}

interface BannerFormData {
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  is_active: boolean;
  start_date: string;
  end_date: string;
}

const AdminBannerManagement = ({ user }: AdminBannerManagementProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [formData, setFormData] = useState<BannerFormData>({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    is_active: true,
    start_date: '',
    end_date: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch banners
  const { data: banners, isLoading } = useQuery({
    queryKey: ['admin-banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Pagination
  const {
    currentItems: paginatedBanners,
    currentPage,
    totalPages,
    totalItems,
    goToPage,
    canGoNext,
    canGoPrev,
  } = usePagination({ data: banners || [], itemsPerPage: 10 });

  // Create/Update banner
  const saveBannerMutation = useMutation({
    mutationFn: async (data: BannerFormData) => {
      console.log('Saving banner with data:', data);
      
      const bannerData = {
        title: data.title,
        description: data.description || null,
        image_url: data.image_url || null,
        link_url: data.link_url || null,
        is_active: data.is_active,
        start_date: data.start_date ? new Date(data.start_date).toISOString() : null,
        end_date: data.end_date ? new Date(data.end_date).toISOString() : null
      };

      if (editingBanner) {
        const { error } = await supabase
          .from('banners')
          .update(bannerData)
          .eq('id', editingBanner.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('banners')
          .insert([bannerData]);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      setIsDialogOpen(false);
      setEditingBanner(null);
      resetForm();
      toast({
        title: "Berhasil",
        description: editingBanner ? "Banner berhasil diperbarui" : "Banner berhasil ditambahkan",
      });
    },
    onError: (error) => {
      console.error('Error saving banner:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan banner",
        variant: "destructive",
      });
    },
  });

  // Delete banner
  const deleteBannerMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('banners')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners'] });
      toast({
        title: "Berhasil",
        description: "Banner berhasil dihapus",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal menghapus banner",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image_url: '',
      link_url: '',
      is_active: true,
      start_date: '',
      end_date: ''
    });
  };

  const handleEdit = (banner: any) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      description: banner.description || '',
      image_url: banner.image_url || '',
      link_url: banner.link_url || '',
      is_active: banner.is_active,
      start_date: banner.start_date ? new Date(banner.start_date).toISOString().split('T')[0] : '',
      end_date: banner.end_date ? new Date(banner.end_date).toISOString().split('T')[0] : ''
    });
    setIsDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingBanner(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast({
        title: "Error",
        description: "Judul banner harus diisi",
        variant: "destructive",
      });
      return;
    }
    console.log('Submitting banner form with data:', formData);
    saveBannerMutation.mutate(formData);
  };

  const handleDelete = (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus banner ini?')) {
      deleteBannerMutation.mutate(id);
    }
  };

  const handleImageUploaded = (url: string) => {
    console.log('Image uploaded callback received:', url);
    setFormData(prev => ({ ...prev, image_url: url }));
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID');
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Kelola Banner</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Tambah Banner
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{editingBanner ? 'Edit Banner' : 'Tambah Banner'}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Judul Banner</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Judul banner"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Deskripsi</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Deskripsi banner"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Gambar Banner</label>
                  <ImageUpload
                    currentImage={formData.image_url}
                    onImageUploaded={handleImageUploaded}
                    bucketName="banner-images"
                    folder="uploads"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Link URL (opsional)</label>
                  <Input
                    value={formData.link_url}
                    onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
                    placeholder="https://example.com"
                    type="url"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Tanggal Mulai (opsional)</label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Tanggal Berakhir (opsional)</label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <label className="text-sm font-medium">Banner Aktif</label>
                </div>
              </form>
            </ScrollArea>
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Batal
              </Button>
              <Button 
                type="submit" 
                disabled={saveBannerMutation.isPending}
                onClick={handleSubmit}
              >
                {saveBannerMutation.isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {totalItems === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">Belum ada banner tersedia</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4">
            {paginatedBanners.map((banner) => (
              <Card key={banner.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{banner.title}</CardTitle>
                      {banner.description && (
                        <p className="text-sm text-gray-600 mt-1">{banner.description}</p>
                      )}
                      {banner.link_url && (
                        <p className="text-xs text-blue-600 mt-1">
                          Link: {banner.link_url}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(banner)}>
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleDelete(banner.id)}
                        disabled={deleteBannerMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Display banner image if exists */}
                    {banner.image_url && (
                      <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                        <img 
                          src={banner.image_url} 
                          alt={banner.title}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.parentElement?.querySelector('.fallback-icon');
                            if (fallback) {
                              (fallback as HTMLElement).style.display = 'flex';
                            }
                          }}
                        />
                        <div className="fallback-icon hidden w-full h-full flex items-center justify-center bg-gray-200">
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Mulai: {formatDate(banner.start_date)}</span>
                      <span>Berakhir: {formatDate(banner.end_date)}</span>
                    </div>
                    <div className="flex space-x-4 text-xs">
                      <span className={`px-2 py-1 rounded ${banner.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {banner.is_active ? 'Aktif' : 'Tidak Aktif'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

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

export default AdminBannerManagement;