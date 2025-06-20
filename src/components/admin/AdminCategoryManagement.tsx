import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, MoreVertical } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ImageUpload from "./ImageUpload";
import { useIsMobile } from "@/hooks/use-mobile";
import { useQueryClient } from "@tanstack/react-query";

interface Category {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
}

const AdminCategoryManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const imageUploadRef = useRef<{ uploadImage: () => Promise<string | null>; reset: () => void }>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image_url: "",
    is_active: true,
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Reset the image upload component when dialog closes
    if (!isDialogOpen && imageUploadRef.current) {
      imageUploadRef.current.reset();
    }
  }, [isDialogOpen]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Gagal memuat kategori",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Upload image first if there's a new image selected
      let finalImageUrl = formData.image_url;
      if (imageUploadRef.current) {
        console.log('Attempting to upload image...');
        const uploadedUrl = await imageUploadRef.current.uploadImage();
        console.log('Upload result:', uploadedUrl);
        if (uploadedUrl) {
          finalImageUrl = uploadedUrl;
          console.log('Using uploaded image URL:', finalImageUrl);
        } else if (!formData.image_url) {
          // If upload failed and we don't have an existing image, show error
          toast({
            title: "Error",
            description: "Gagal mengupload gambar. Silakan coba lagi.",
            variant: "destructive",
          });
          return;
        }
      }

      const dataToSubmit = { 
        name: formData.name,
        description: formData.description,
        image_url: finalImageUrl,
        is_active: formData.is_active
      };

      console.log('Submitting data:', dataToSubmit);

      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(dataToSubmit)
          .eq('id', editingCategory.id);
        
        if (error) throw error;
        
        toast({
          title: "Berhasil",
          description: "Kategori berhasil diupdate",
        });
      } else {
        const { error } = await supabase
          .from('categories')
          .insert([dataToSubmit]);
        
        if (error) throw error;
        
        toast({
          title: "Berhasil",
          description: "Kategori berhasil ditambahkan",
        });
      }
      
      // Invalidate related queries to refresh data everywhere
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['categories'] }),
        queryClient.invalidateQueries({ queryKey: ['menu-items'] })
      ]);
      
      fetchCategories();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving category:', error);
      toast({
        title: "Error",
        description: "Gagal menyimpan kategori",
        variant: "destructive",
      });
    }
  };

  const deleteImageFromStorage = async (imageUrl: string) => {
    if (!imageUrl || !imageUrl.includes('supabase')) {
      console.log('No Supabase image to delete:', imageUrl);
      return;
    }

    try {
      // Extract file path from URL
      const url = new URL(imageUrl);
      const pathParts = url.pathname.split('/');
      // For category-images bucket, the path should be like /storage/v1/object/public/category-images/uploads/filename
      const bucketIndex = pathParts.findIndex(part => part === 'category-images');
      if (bucketIndex === -1) {
        console.error('Could not find bucket name in URL');
        return;
      }
      
      const filePath = pathParts.slice(bucketIndex + 1).join('/');
      
      console.log('Deleting image from storage:', filePath);
      
      const { error } = await supabase.storage
        .from('category-images')
        .remove([filePath]);
      
      if (error) {
        console.error('Error deleting image from storage:', error);
      } else {
        console.log('Image deleted from storage successfully');
      }
    } catch (error) {
      console.error('Error parsing URL or deleting image:', error);
    }
  };

  const handleDelete = async () => {
    if (!deletingCategory) return;

    try {
      console.log('Deleting category:', deletingCategory);

      // First delete the image from storage if it exists
      if (deletingCategory.image_url) {
        await deleteImageFromStorage(deletingCategory.image_url);
      }

      // Then delete the category from database
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', deletingCategory.id);
      
      if (error) {
        console.error('Database delete error:', error);
        throw error;
      }
      
      console.log('Category deleted successfully from database');
      
      toast({
        title: "Berhasil",
        description: "Kategori berhasil dihapus",
      });
      
      // Invalidate related queries to refresh data everywhere
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['categories'] }),
        queryClient.invalidateQueries({ queryKey: ['menu-items'] })
      ]);
      
      // Refresh the categories list
      await fetchCategories();
      setDeletingCategory(null);
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: "Error",
        description: "Gagal menghapus kategori",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('categories')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      
      if (error) throw error;
      
      toast({
        title: "Berhasil",
        description: `Kategori ${!currentStatus ? 'diaktifkan' : 'dinonaktifkan'}`,
      });
      
      // Invalidate queries to refresh data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['categories'] }),
        queryClient.invalidateQueries({ queryKey: ['menu-items'] })
      ]);
      
      fetchCategories();
    } catch (error) {
      console.error('Error updating category status:', error);
      toast({
        title: "Error",
        description: "Gagal mengupdate status kategori",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      image_url: category.image_url || "",
      is_active: category.is_active,
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      image_url: "",
      is_active: true,
    });
    setEditingCategory(null);
    if (imageUploadRef.current) {
      imageUploadRef.current.reset();
    }
  };

  const handleImageUpload = (imageUrl: string) => {
    console.log('Image uploaded callback:', imageUrl);
    setFormData(prev => ({ ...prev, image_url: imageUrl }));
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Category Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={resetForm} className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Nama Kategori</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                <Label>Gambar Kategori</Label>
                <ImageUpload
                  ref={imageUploadRef}
                  currentImage={formData.image_url}
                  onImageUploaded={handleImageUpload}
                  bucketName="category-images"
                  folder="uploads"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="active">Aktif</Label>
              </div>

              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="w-full sm:w-auto">
                  Cancel
                </Button>
                <Button type="submit" className="w-full sm:w-auto">
                  {editingCategory ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:gap-6">
        {categories.map((category) => (
          <Card key={category.id} className="overflow-hidden">
            <CardContent className="p-4 md:p-6">
              {isMobile ? (
                // Mobile Layout
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                      {category.image_url ? (
                        <img 
                          src={category.image_url} 
                          alt={category.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">No Image</span>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold truncate">{category.name}</h3>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-2">{category.description}</p>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={() => handleEdit(category)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => toggleActive(category.id, category.is_active)}>
                              <span className="w-4 h-4 mr-2">⚡</span>
                              {category.is_active ? 'Disable' : 'Enable'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setDeletingCategory(category)} className="text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-end">
                    <Badge variant={category.is_active ? "default" : "secondary"} className="text-xs">
                      {category.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              ) : (
                // Desktop Layout
                <div className="flex items-center space-x-4">
                  <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                    {category.image_url ? (
                      <img 
                        src={category.image_url} 
                        alt={category.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-gray-400 text-xs">No Image</span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-1">{category.name}</h3>
                    <p className="text-gray-600 mb-2">{category.description}</p>
                  </div>

                  <div className="flex flex-nowrap overflow-x-auto whitespace-nowrap space-x-2 scrollbar-thin scrollbar-thumb-gray-300">
                    <Badge variant={category.is_active ? "default" : "secondary"}>
                      {category.is_active ? "Active" : "Inactive"}
                    </Badge>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(category)}
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingCategory(category)}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </Button>

                    <Button
                      variant={category.is_active ? "secondary" : "default"}
                      size="sm"
                      onClick={() => toggleActive(category.id, category.is_active)}
                    >
                      {category.is_active ? "Disable" : "Enable"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deletingCategory} onOpenChange={() => setDeletingCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kategori</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus kategori "{deletingCategory?.name}"? 
              Tindakan ini tidak dapat dibatalkan dan akan menghapus gambar dari storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
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

export default AdminCategoryManagement;