
import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Upload, Image, CheckCircle, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ImageUploadProps {
  onImageUploaded: (url: string) => void;
  currentImage?: string;
  bucketName?: string;
  folder?: string;
}

export interface ImageUploadRef {
  uploadImage: () => Promise<string | null>;
}

const ImageUpload = forwardRef<ImageUploadRef, ImageUploadProps>(({ 
  onImageUploaded, 
  currentImage, 
  bucketName = 'menu-images',
  folder = 'uploads'
}, ref) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImage || null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('File selected:', file.name, file.type, file.size);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "❌ File Tidak Valid",
        description: "Mohon pilih file gambar yang valid (JPG, PNG, GIF)",
        variant: "destructive",
        className: "bg-gradient-to-r from-red-500 to-pink-500 text-white border-red-300 shadow-lg"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "⚠️ File Terlalu Besar",
        description: "Ukuran file maksimal 5MB",
        variant: "destructive",
        className: "bg-gradient-to-r from-orange-500 to-red-500 text-white border-orange-300 shadow-lg"
      });
      return;
    }

    // Store the selected file and create preview URL
    setSelectedFile(file);
    const previewURL = URL.createObjectURL(file);
    setPreviewUrl(previewURL);

    toast({
      title: "📁 File Dipilih",
      description: "Gambar siap untuk diupload. Klik 'Create' atau 'Update' untuk menyimpan.",
      className: "bg-gradient-to-r from-blue-400 to-cyan-500 text-white border-blue-300 shadow-lg"
    });
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!selectedFile) {
      // If no new file selected, return current image URL
      return currentImage || null;
    }

    setUploading(true);

    try {
      toast({
        title: "📤 Mengupload...",
        description: "Sedang memproses gambar, mohon tunggu",
        className: "bg-gradient-to-r from-blue-400 to-cyan-500 text-white border-blue-300 shadow-lg"
      });

      // Generate unique filename
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${folder}/${fileName}`;

      console.log('Uploading to path:', filePath);

      // Upload file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      console.log('Upload successful:', data);

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      console.log('Public URL:', publicUrl);

      toast({
        title: "🎉 Upload Berhasil!",
        description: "Gambar berhasil diupload ke Supabase Storage.",
        className: "bg-gradient-to-r from-green-400 to-emerald-500 text-white border-green-300 shadow-xl animate-bounce-gentle"
      });

      // Clear selected file after successful upload
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      return publicUrl;

    } catch (error) {
      console.error('Upload error:', error);
      
      let errorMessage = "Terjadi kesalahan saat mengupload gambar";
      if (error instanceof Error) {
        errorMessage = error.message;
      }

      toast({
        title: "💥 Upload Gagal",
        description: errorMessage,
        variant: "destructive",
        className: "bg-gradient-to-r from-red-500 to-pink-600 text-white border-red-300 shadow-lg"
      });

      return null;
    } finally {
      setUploading(false);
    }
  };

  // Expose upload function to parent component
  useImperativeHandle(ref, () => ({
    uploadImage
  }), [selectedFile, currentImage, bucketName, folder]);

  const handleRemoveImage = async () => {
    // Clear preview and selected file
    setPreviewUrl(null);
    setSelectedFile(null);
    onImageUploaded('');
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // If there's a current image stored in Supabase, try to delete it
    if (currentImage && currentImage.includes('supabase')) {
      try {
        // Extract file path from URL
        const url = new URL(currentImage);
        const pathParts = url.pathname.split('/');
        const filePath = pathParts.slice(-2).join('/'); // Get folder/filename
        
        console.log('Deleting file:', filePath);
        
        const { error } = await supabase.storage
          .from(bucketName)
          .remove([filePath]);
        
        if (error) {
          console.error('Delete error:', error);
        } else {
          console.log('File deleted successfully');
        }
      } catch (error) {
        console.error('Error parsing URL or deleting file:', error);
      }
    }

    toast({
      title: "🗑️ Gambar Dihapus",
      description: "Gambar berhasil dihapus",
      className: "bg-gradient-to-r from-gray-400 to-gray-500 text-white border-gray-300 shadow-lg"
    });
  };

  const handleButtonClick = () => {
    console.log('Button clicked, triggering file input');
    if (fileInputRef.current && !uploading) {
      fileInputRef.current.click();
    }
  };

  const handleDropZoneClick = () => {
    console.log('Drop zone clicked, triggering file input');
    if (fileInputRef.current && !uploading) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
      <div 
        className={`border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-orange-400 transition-colors duration-300 bg-gradient-to-br from-orange-50 to-amber-50 ${uploading ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
        onClick={handleDropZoneClick}
      >
        {uploading ? (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Mengupload...</h3>
              <p className="text-gray-500 text-sm">
                Mohon tunggu, sedang mengupload ke Supabase Storage
              </p>
            </div>
          </div>
        ) : previewUrl ? (
          <div className="relative inline-block">
            <img
              src={previewUrl}
              alt="Preview"
              className="max-w-full max-h-48 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
              onLoad={() => {
                console.log('Preview image loaded successfully');
              }}
              onError={() => {
                console.error('Preview image failed to load');
              }}
            />
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveImage();
              }}
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 rounded-full w-8 h-8 p-0 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-lg"
            >
              <X className="w-4 h-4" />
            </Button>
            {selectedFile && (
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium">
                Siap diupload
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center shadow-lg">
              <Image className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Upload Gambar</h3>
              <p className="text-gray-500 text-sm">
                Drag & drop gambar atau klik untuk memilih
              </p>
              <p className="text-xs text-gray-400 mt-1">
                JPG, PNG, GIF (Max. 5MB)
              </p>
            </div>
          </div>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={uploading}
      />

      <div className="flex justify-center">
        <Button
          onClick={handleButtonClick}
          disabled={uploading}
          className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-medium px-6 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Mengupload...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              {previewUrl ? 'Ganti Gambar' : 'Pilih Gambar'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
});

ImageUpload.displayName = 'ImageUpload';

export default ImageUpload;
