
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User } from "@supabase/supabase-js";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import OrderHistory from "@/components/orders/OrderHistory";
import { Shield, User as UserIcon, Sparkles } from "lucide-react";

interface ProfilePageProps {
  user: User;
  onBack: () => void;
}

const ProfilePage = ({ user, onBack }: ProfilePageProps) => {
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['profile', user.id],
    queryFn: async () => {
      console.log("Fetching profile data for:", user.id);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        console.error("Profile fetch error:", error);
        throw error;
      }
      
      console.log("Profile data:", data);
      return data;
    },
    retry: 1,
    retryDelay: 1000,
  });

  // Update form state when profile data is loaded
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhoneNumber(profile.phone_number || "");
    }
  }, [profile]);

  const updateProfileMutation = useMutation({
    mutationFn: async (profileData: { full_name: string; phone_number: string }) => {
      console.log("Updating profile with data:", profileData);
      
      // Validate required fields
      if (!profileData.full_name.trim()) {
        throw new Error("Nama lengkap harus diisi");
      }

      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: profileData.full_name.trim(),
          phone_number: profileData.phone_number.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) {
        console.error("Profile update error:", error);
        throw error;
      }
      
      console.log("Profile updated successfully:", data);
      return data;
    },
    onSuccess: (data) => {
      // Update the query cache with new data
      queryClient.setQueryData(['profile', user.id], data);
      
      // Invalidate to refetch from server
      queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      
      toast({
        title: "Berhasil",
        description: "Profil berhasil diperbarui",
      });
    },
    onError: (error: any) => {
      console.error("Update profile mutation error:", error);
      const errorMessage = error?.message || "Gagal memperbarui profil";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!fullName.trim()) {
      toast({
        title: "Error",
        description: "Nama lengkap harus diisi",
        variant: "destructive",
      });
      return;
    }

    updateProfileMutation.mutate({
      full_name: fullName,
      phone_number: phoneNumber,
    });
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return (
          <span className="bg-red-100 text-red-800 text-sm px-3 py-1 rounded-full font-semibold flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Administrator
          </span>
        );
      case 'customer':
        return (
          <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full font-semibold flex items-center gap-2">
            <UserIcon className="w-4 h-4" />
            Customer
          </span>
        );
      default:
        return (
          <span className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-full font-semibold">
            {role}
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-25 to-red-50">
        {/* Enhanced Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-100/40 via-transparent to-red-100/40"></div>
          <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-br from-orange-200/30 to-amber-200/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 right-10 w-96 h-96 bg-gradient-to-bl from-red-200/25 to-pink-200/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-gradient-to-tr from-yellow-200/20 to-orange-200/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
        
        <div className="relative z-10 flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-red-50 via-pink-25 to-red-50">
        <div className="relative z-10 flex items-center justify-center py-12">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              <strong className="font-bold">Error!</strong>
              <span className="block sm:inline mt-1">Gagal memuat profil: {error.message}</span>
            </div>
            <Button onClick={onBack} variant="outline">
              Kembali
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-25 to-red-50">
      {/* Enhanced Background Decorations */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Main gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-100/40 via-transparent to-red-100/40"></div>
        
        {/* Floating decorative elements */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-br from-orange-200/30 to-amber-200/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 right-10 w-96 h-96 bg-gradient-to-bl from-red-200/25 to-pink-200/25 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-gradient-to-tr from-yellow-200/20 to-orange-200/20 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        {/* Geometric shapes */}
        <div className="absolute top-1/4 left-1/4 w-8 h-8 bg-orange-300/20 rotate-45 animate-bounce" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-3/4 right-1/4 w-6 h-6 bg-red-300/20 rotate-12 animate-bounce" style={{ animationDelay: '1.5s' }}></div>
        <div className="absolute bottom-1/3 left-1/6 w-10 h-10 bg-amber-300/15 rounded-full animate-pulse" style={{ animationDelay: '2.5s' }}></div>
        
        {/* Sparkle effects */}
        <div className="absolute top-20 right-1/3 opacity-60">
          <Sparkles className="w-6 h-6 text-orange-400 animate-pulse" />
        </div>
        <div className="absolute bottom-1/4 left-1/5 opacity-40">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" style={{ animationDelay: '1s' }} />
        </div>
        <div className="absolute top-1/3 right-1/6 opacity-50">
          <Sparkles className="w-5 h-5 text-red-400 animate-pulse" style={{ animationDelay: '2s' }} />
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center mb-6">
          <Button 
            onClick={onBack} 
            variant="ghost" 
            size="sm" 
            className="glass border-0 hover:bg-white/80 text-gray-700 hover:text-gray-900 backdrop-blur-sm rounded-full px-4 py-2 transition-all duration-300 shadow-soft hover:shadow-medium"
          >
            ← Kembali
          </Button>
          <h1 className="text-2xl font-bold ml-4 text-gray-900">Profil Saya</h1>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-2 glass border-0 bg-white/60 backdrop-blur-sm">
            <TabsTrigger 
              value="profile" 
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-medium rounded-lg transition-all duration-200"
            >
              Profil
            </TabsTrigger>
            <TabsTrigger 
              value="orders"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-medium rounded-lg transition-all duration-200"
            >
              Riwayat Pesanan
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <Card className="glass border-0 shadow-strong backdrop-blur-xl bg-white/80 hover:bg-white/90 transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-gray-900">
                  <span>Informasi Profil</span>
                  {profile?.role && getRoleBadge(profile.role)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Email</label>
                    <Input value={user.email || ""} disabled className="bg-gray-50" />
                    <p className="text-xs text-gray-500 mt-1">Email tidak dapat diubah</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Nama Lengkap *</label>
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Masukkan nama lengkap"
                      required
                      className={!fullName.trim() ? "border-red-300" : ""}
                    />
                    {!fullName.trim() && (
                      <p className="text-xs text-red-500 mt-1">Nama lengkap harus diisi</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Nomor Telepon</label>
                    <Input
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      placeholder="Masukkan nomor telepon"
                      type="tel"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Role</label>
                    <Input 
                      value={profile?.role || 'customer'} 
                      disabled 
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">Role ditentukan oleh administrator</p>
                  </div>
                  
                  <div className="pt-4">
                    <Button 
                      type="submit" 
                      className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-medium hover:shadow-strong transition-all duration-300"
                      disabled={updateProfileMutation.isPending || !fullName.trim()}
                    >
                      {updateProfileMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="orders">
            <div className="glass border-0 shadow-strong backdrop-blur-xl bg-white/80 rounded-xl p-6">
              <OrderHistory user={user} />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProfilePage;
