import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash2, Star, Heart, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ImageUpload from "./ImageUpload";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQueryClient } from "@tanstack/react-query";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  ingredients: string;
  price: number;
  category_id: string;
  image_url?: string;
  is_available: boolean;
  is_popular: boolean;
  categories?: {
    name: string;
  };
}

interface Category {
  id: string;
  name: string;
}

const AdminMenuManagement = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<MenuItem | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const imageUploadRef = useRef<{ uploadImage: () => Promise<string | null> }>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    ingredients: "",
    price: 0,
    category_id: "",
    image_url: "",
    is_available: true,
    is_popular: false,
  });

  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          *,
          categories (
            name
          )
        `)
        .order('name');
      
      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast({
        title: "Error",
        description: "Gagal memuat menu items",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Upload image first if there's a new image selected
      let finalImageUrl = formData.image_url;
      if (imageUploadRef.current) {
        const uploadedUrl = await imageUploadRef.current.uploadImage();
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
        }
      }

      const dataToSubmit = { ...formData, image_url: finalImageUrl };

      if (editingItem) {
        const { error } = await supabase
          .from('menu_items')
          .update(dataToSubmit)
          .eq('id', editingItem.id);
        
        if (error) throw error;
        
        toast({
          title: "Berhasil",
          description: "Menu item berhasil diupdate",
        });
      } else {
        const { error } = await supabase
          .from('menu_items')
          .insert([dataToSubmit]);
        
        if (error) throw error;
        
        toast({
          title: "Berhasil",
          description: "Menu item berhasil ditambahkan",
        });
      }
      
      // Invalidate related queries to refresh data everywhere
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['popular-items'] }),
        queryClient.invalidateQueries({ queryKey: ['menu-items'] }),
        queryClient.invalidateQueries({ queryKey: ['categories'] })
      ]);
      
      fetchMenuItems();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving menu item:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan menu item",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Berhasil",
        description: "Menu item berhasil dihapus",
      });
      
      fetchMenuItems();
      setDeletingItem(null);
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus menu item",
        variant: "destructive",
      });
    }
  };

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Berhasil",
        description: `Menu item ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}`,
      });
      
      // Invalidate queries to refresh data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['popular-items'] }),
        queryClient.invalidateQueries({ queryKey: ['menu-items'] })
      ]);
      
      fetchMenuItems();
    } catch (error) {
      console.error('Error updating availability:', error);
      toast({
        title: "Error",
        description: "Gagal mengupdate status menu item",
        variant: "destructive",
      });
    }
  };

  const togglePopular = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_popular: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Berhasil",
        description: `Menu item ${!currentStatus ? 'ditandai sebagai favorit' : 'dihapus dari favorit'}`,
      });
      
      // Invalidate popular-items query specifically since this affects the homepage
      await queryClient.invalidateQueries({ queryKey: ['popular-items'] });
      
      fetchMenuItems();
    } catch (error) {
      console.error('Error updating popular status:', error);
      toast({
        title: "Error",
        description: "Gagal mengupdate status favorit",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || "",
      ingredients: item.ingredients || "",
      price: item.price,
      category_id: item.category_id,
      image_url: item.image_url || "",
      is_available: item.is_available,
      is_popular: item.is_popular,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      ingredients: "",
      price: 0,
      category_id: "",
      image_url: "",
      is_available: true,
      is_popular: false,
    });
    setEditingItem(null);
  };

  const handleImageUpload = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, image_url: imageUrl }));
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Menu Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Menu
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label htmlFor="name">Nama Menu</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="category">Kategori</Label>
                  <Select
                    value={formData.category_id}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="price">Harga</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="ingredients">Bahan-bahan</Label>
                  <Textarea
                    id="ingredients"
                    value={formData.ingredients}
                    onChange={(e) => setFormData(prev => ({ ...prev, ingredients: e.target.value }))}
                  />
                </div>

                <div>
                  <Label>Gambar Menu</Label>
                  <ImageUpload
                    ref={imageUploadRef}
                    currentImage={formData.image_url}
                    onImageUploaded={handleImageUpload}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="available"
                    checked={formData.is_available}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_available: checked }))}
                  />
                  <Label htmlFor="available">Tersedia</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="popular"
                    checked={formData.is_popular}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_popular: checked }))}
                  />
                  <Label htmlFor="popular">Favorit Pelanggan</Label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" className="w-full sm:w-auto">
                  {editingItem ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:gap-6">
        {menuItems.map((item) => (
          <Card key={item.id} className="overflow-hidden">
            <CardContent className="p-4 md:p-6">
              {isMobile ? (
                // Mobile Layout
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.image_url ? (
                        <img 
                          src={item.image_url} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">No Image</span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold truncate">{item.name}</h3>
                            {item.is_popular && (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 flex-shrink-0">
                                <Heart className="w-3 h-3" fill="currentColor" />
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-1 line-clamp-2">{item.description}</p>
                          <p className="text-xs text-gray-500 mb-2">Kategori: {item.categories?.name}</p>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleEdit(item)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => togglePopular(item.id, item.is_popular)}>
                              <Heart className={`w-4 h-4 mr-2 ${item.is_popular ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                              {item.is_popular ? 'Remove from Favorit' : 'Add to Favorit'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleAvailability(item.id, item.is_available)}>
                              <span className="w-4 h-4 mr-2">⚡</span>
                              {item.is_available ? 'Disable' : 'Enable'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeletingItem(item)} className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-xl md:text-2xl font-bold text-orange-600">
                      Rp {item.price.toLocaleString('id-ID')}
                    </p>
                    <Badge variant={item.is_available ? "default" : "secondary"} className="text-xs">
                      {item.is_available ? "Available" : "Unavailable"}
                    </Badge>
                  </div>
                </div>
              ) : (
                // Desktop Layout
                <div className="flex items-center space-x-4">
                  <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400 text-xs">No Image</span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-xl font-semibold">{item.name}</h3>
                      {item.is_popular && (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          <Heart className="w-3 h-3 mr-1" fill="currentColor" />
                          Favorit
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600 mb-1">{item.description}</p>
                    <p className="text-sm text-gray-500 mb-2">Kategori: {item.categories?.name}</p>
                    <p className="text-2xl font-bold text-orange-600">
                      Rp {item.price.toLocaleString('id-ID')}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge variant={item.is_available ? "default" : "secondary"}>
                      {item.is_available ? "Available" : "Unavailable"}
                    </Badge>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePopular(item.id, item.is_popular)}
                      className={item.is_popular ? "bg-yellow-50 border-yellow-200" : ""}
                    >
                      <Heart className={`w-4 h-4 ${item.is_popular ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Hapus Menu Item</AlertDialogTitle>
                          <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus menu item "{item.name}"? 
                            Tindakan ini tidak dapat dibatalkan.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Batal</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDelete(item.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Hapus
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <Button
                      variant={item.is_available ? "secondary" : "default"}
                      size="sm"
                      onClick={() => toggleAvailability(item.id, item.is_available)}
                    >
                      {item.is_available ? "Disable" : "Enable"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete confirmation dialog for mobile */}
      <AlertDialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Menu Item</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus menu item "{deletingItem?.name}"? 
              Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deletingItem && handleDelete(deletingItem.id)}
              className="bg-red-600 hover:bg-red-700"
            >
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminMenuManagement;
