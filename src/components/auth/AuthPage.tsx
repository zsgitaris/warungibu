import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, UtensilsCrossed, CheckCircle, ArrowLeft, Sparkles, AlertCircle, PartyPopper, Crown } from "lucide-react";

interface AuthPageProps {
  onBack?: () => void;
}

const AuthPage = ({ onBack }: AuthPageProps) => {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showSignInSuccessDialog, setShowSignInSuccessDialog] = useState(false);
  const { toast } = useToast();

  const [signInData, setSignInData] = useState({
    email: "",
    password: "",
  });

  const [signUpData, setSignUpData] = useState({
    fullName: "",
    email: "",
    password: "",
    phoneNumber: "",
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: signInData.email,
      password: signInData.password,
    });

    if (error) {
      toast({
        title: "❌ Login Gagal",
        description: (
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span>{error.message}</span>
          </div>
        ),
        variant: "destructive",
      });
    } else {
      setShowSignInSuccessDialog(true);
      setSignInData({
        email: "",
        password: "",
      });
    }

    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: signUpData.email,
      password: signUpData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: signUpData.fullName,
          phone_number: signUpData.phoneNumber,
        },
      },
    });

    if (error) {
      toast({
        title: "❌ Pendaftaran Gagal",
        description: (
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <span>{error.message}</span>
          </div>
        ),
        variant: "destructive",
      });
    } else {
      setShowSuccessDialog(true);
      setSignUpData({
        fullName: "",
        email: "",
        password: "",
        phoneNumber: "",
      });
    }

    setLoading(false);
  };

  const handleCloseSuccessDialog = () => {
    setShowSuccessDialog(false);
    if (onBack) {
      onBack();
    }
  };

  const handleCloseSignInSuccessDialog = () => {
    setShowSignInSuccessDialog(false);
    if (onBack) {
      onBack();
    }
  };

  return (
    <>
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-25 to-red-50">
        {/* Enhanced Background Decorations */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Main gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-100/90 via-transparent to-red-100/90"></div>
          
          {/* Floating decorative elements */}
          <div className="absolute top-10 left-10 w-72 h-72 bg-gradient-to-br from-orange-200/90 to-amber-200/90 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 right-10 w-96 h-96 bg-gradient-to-bl from-red-200/90 to-pink-200/90 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-gradient-to-tr from-yellow-200/90 to-orange-200/90 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          
          {/* Geometric shapes */}
          <div className="absolute top-1/4 left-1/4 w-8 h-8 bg-orange-300/90 rotate-45 animate-bounce" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute top-3/4 right-1/4 w-6 h-6 bg-red-300/90 rotate-12 animate-bounce" style={{ animationDelay: '1.5s' }}></div>
          <div className="absolute bottom-1/3 left-1/6 w-10 h-10 bg-amber-300/90 rounded-full animate-pulse" style={{ animationDelay: '2.5s' }}></div>
          
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
        <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
          <div className="w-full max-w-md">
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 hover:bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 transition-all duration-300 shadow-soft hover:shadow-medium font-poppins"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Menu
              </Button>
            )}

            {/* Brand Header with 3D Effects and Modern Fonts */}
            <div className="text-center mb-8 animate-fade-in">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-full mb-6 shadow-strong hover:shadow-xl transition-all duration-300 hover:scale-105">
                <UtensilsCrossed className="w-10 h-10 text-white" />
              </div>
              <h1 className="font-playfair text-4xl font-black text-gray-900 mb-4 bg-gradient-to-r from-orange-600 via-red-600 to-orange-800 bg-clip-text text-transparent drop-shadow-2xl" 
                  style={{ 
                    textShadow: '4px 4px 8px rgba(0,0,0,0.5), 0 0 30px rgba(251,146,60,0.7), 2px 2px 4px rgba(0,0,0,0.3)',
                    filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.4))',
                    WebkitTextStroke: '1px rgba(0,0,0,0.1)'
                  }}>
                Warung IbuMus
              </h1>
              <p className="font-poppins text-gray-800 text-xl font-black mb-4 drop-shadow-lg" 
                 style={{ 
                   textShadow: '2px 2px 6px rgba(0,0,0,0.6), 1px 1px 3px rgba(0,0,0,0.4)',
                   filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.3))',
                   WebkitTextStroke: '0.5px rgba(0,0,0,0.1)'
                 }}>
                Makanan Rumahan Terenak di Kota
              </p>
              <div className="flex items-center justify-center gap-3 mt-4 text-base text-gray-700 font-black font-dancing"
                   style={{ 
                     textShadow: '2px 2px 4px rgba(0,0,0,0.5), 1px 1px 2px rgba(0,0,0,0.3)',
                     filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                     WebkitTextStroke: '0.3px rgba(0,0,0,0.1)'
                   }}>
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse shadow-lg"></div>
                <span className="tracking-wide">Autentik • Lezat • Terpercaya</span>
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-lg"></div>
              </div>
            </div>

            {/* Auth Card with Colored Tabs */}
            <Card className="glass border-0 shadow-strong backdrop-blur-xl bg-white/90 hover:bg-white/95 transition-all duration-300 animate-scale-in">
              <CardHeader className="text-center pb-6">
                <CardTitle className="font-playfair text-2xl font-bold text-gray-900">
                  Selamat Datang
                </CardTitle>
                <CardDescription className="font-poppins text-gray-600 text-base">
                  Masuk ke akun Anda atau buat akun baru
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="signin" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-gray-100/90 p-1 rounded-xl">
                    <TabsTrigger 
                      value="signin" 
                      className="font-poppins font-semibold rounded-lg data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-medium transition-all duration-200 text-gray-700 hover:bg-blue-100"
                    >
                      Masuk
                    </TabsTrigger>
                    <TabsTrigger 
                      value="signup" 
                      className="font-poppins font-semibold rounded-lg data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-medium transition-all duration-200 text-gray-700 hover:bg-green-100"
                    >
                      Daftar
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin" className="mt-6">
                    <form onSubmit={handleSignIn} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="signin-email" className="font-poppins text-gray-700 font-medium">
                          Email
                        </Label>
                        <Input
                          id="signin-email"
                          type="email"
                          placeholder="email@example.com"
                          value={signInData.email}
                          onChange={(e) =>
                            setSignInData({ ...signInData, email: e.target.value })
                          }
                          className="font-poppins input-modern h-12 px-4 bg-white/90 border-gray-200 focus:border-orange-400 focus:ring-orange-400/20"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signin-password" className="font-poppins text-gray-700 font-medium">
                          Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="signin-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Masukkan password Anda"
                            value={signInData.password}
                            onChange={(e) =>
                              setSignInData({ ...signInData, password: e.target.value })
                            }
                            className="font-poppins input-modern h-12 px-4 pr-12 bg-white/90 border-gray-200 focus:border-orange-400 focus:ring-orange-400/20"
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent focus-visible:ring-orange-400"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-500" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-500" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <Button 
                        type="submit" 
                        className="font-poppins w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-xl shadow-medium hover:shadow-strong transition-all duration-300 btn-modern" 
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="spinner"></div>
                            Memproses...
                          </div>
                        ) : (
                          "Masuk"
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup" className="mt-6">
                    <form onSubmit={handleSignUp} className="space-y-5">
                      <div className="space-y-2">
                        <Label htmlFor="signup-name" className="font-poppins text-gray-700 font-medium">
                          Nama Lengkap
                        </Label>
                        <Input
                          id="signup-name"
                          type="text"
                          placeholder="Masukkan nama lengkap"
                          value={signUpData.fullName}
                          onChange={(e) =>
                            setSignUpData({ ...signUpData, fullName: e.target.value })
                          }
                          className="font-poppins input-modern h-12 px-4 bg-white/90 border-gray-200 focus:border-orange-400 focus:ring-orange-400/20"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-email" className="font-poppins text-gray-700 font-medium">
                          Email
                        </Label>
                        <Input
                          id="signup-email"
                          type="email"
                          placeholder="email@example.com"
                          value={signUpData.email}
                          onChange={(e) =>
                            setSignUpData({ ...signUpData, email: e.target.value })
                          }
                          className="font-poppins input-modern h-12 px-4 bg-white/90 border-gray-200 focus:border-orange-400 focus:ring-orange-400/20"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-phone" className="font-poppins text-gray-700 font-medium">
                          Nomor Telepon
                        </Label>
                        <Input
                          id="signup-phone"
                          type="tel"
                          placeholder="08xxxxxxxxxx"
                          value={signUpData.phoneNumber}
                          onChange={(e) =>
                            setSignUpData({ ...signUpData, phoneNumber: e.target.value })
                          }
                          className="font-poppins input-modern h-12 px-4 bg-white/90 border-gray-200 focus:border-orange-400 focus:ring-orange-400/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-password" className="font-poppins text-gray-700 font-medium">
                          Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Buat password yang kuat"
                            value={signUpData.password}
                            onChange={(e) =>
                              setSignUpData({ ...signUpData, password: e.target.value })
                            }
                            className="font-poppins input-modern h-12 px-4 pr-12 bg-white/90 border-gray-200 focus:border-orange-400 focus:ring-orange-400/20"
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent focus-visible:ring-orange-400"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-gray-500" />
                            ) : (
                              <Eye className="h-4 w-4 text-gray-500" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <Button 
                        type="submit" 
                        className="font-poppins w-full h-12 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-medium hover:shadow-strong transition-all duration-300 btn-modern" 
                        disabled={loading}
                      >
                        {loading ? (
                          <div className="flex items-center gap-2">
                            <div className="spinner"></div>
                            Membuat akun...
                          </div>
                        ) : (
                          "Daftar Sekarang"
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="text-center mt-8 text-sm text-gray-500">
              <p className="font-poppins backdrop-blur-sm bg-white/40 rounded-full px-4 py-2 inline-block">
                Dengan mendaftar, Anda menyetujui syarat dan ketentuan kami
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Sign Up Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md border-0 shadow-2xl overflow-hidden">
          <div className="relative rounded-2xl bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 p-8">
            {/* Enhanced Background Effects */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-200/40 to-green-300/30 rounded-full -translate-y-20 translate-x-20 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-teal-200/30 to-emerald-200/40 rounded-full translate-y-16 -translate-x-16 animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/2 w-6 h-6 bg-emerald-300/30 rounded-full -translate-x-3 -translate-y-3 animate-bounce" style={{ animationDelay: '0.5s' }}></div>
            
            {/* Floating Icons */}
            <div className="absolute top-6 right-6 opacity-20 animate-bounce" style={{ animationDelay: '2s' }}>
              <Sparkles className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="absolute bottom-6 left-6 opacity-25 animate-pulse" style={{ animationDelay: '1.5s' }}>
              <Crown className="w-4 h-4 text-green-500" />
            </div>
            
            <DialogHeader className="text-center relative z-10">
              {/* Enhanced Success Icon */}
              <div className="mx-auto mb-6 relative">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 shadow-xl animate-pulse">
                  <CheckCircle className="h-12 w-12 text-white animate-bounce" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center animate-spin" style={{ animationDuration: '3s' }}>
                  <PartyPopper className="h-4 w-4 text-white" />
                </div>
              </div>
              
              <DialogTitle className="font-playfair text-2xl font-bold bg-gradient-to-r from-emerald-600 to-green-700 bg-clip-text text-transparent mb-3">
                🎉 Pendaftaran Berhasil!
              </DialogTitle>
              
              <DialogDescription className="font-poppins text-center text-gray-700 text-base leading-relaxed space-y-2">
                <div className="font-semibold text-emerald-700">
                  Selamat! Akun Anda telah berhasil dibuat dengan sukses.
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-emerald-50/50 rounded-lg p-3 border border-emerald-200/50">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span>📧 Silakan periksa email Anda untuk verifikasi akun</span>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                </div>
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-8 relative z-10">
              <Button 
                onClick={handleCloseSuccessDialog}
                className="font-poppins w-full bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  ✨ Mengerti, Terima Kasih!
                  <Sparkles className="w-5 h-5" />
                </div>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Enhanced Sign In Success Dialog */}
      <Dialog open={showSignInSuccessDialog} onOpenChange={setShowSignInSuccessDialog}>
        <DialogContent className="sm:max-w-md border-0 shadow-2xl overflow-hidden">
          <div className="relative rounded-2xl bg-gradient-to-br from-orange-50 via-amber-50 to-red-50 p-8">
            {/* Enhanced Background Effects */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-orange-200/40 to-red-300/30 rounded-full -translate-y-20 translate-x-20 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-amber-200/30 to-orange-200/40 rounded-full translate-y-16 -translate-x-16 animate-pulse" style={{ animationDelay: '1s' }}></div>
            <div className="absolute top-1/2 left-1/2 w-6 h-6 bg-orange-300/30 rounded-full -translate-x-3 -translate-y-3 animate-bounce" style={{ animationDelay: '0.5s' }}></div>
            
            {/* Floating Icons */}
            <div className="absolute top-6 right-6 opacity-20 animate-bounce" style={{ animationDelay: '2s' }}>
              <UtensilsCrossed className="w-5 h-5 text-orange-500" />
            </div>
            <div className="absolute bottom-6 left-6 opacity-25 animate-pulse" style={{ animationDelay: '1.5s' }}>
              <Crown className="w-4 h-4 text-amber-500" />
            </div>
            
            <DialogHeader className="text-center relative z-10">
              {/* Enhanced Success Icon */}
              <div className="mx-auto mb-6 relative">
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 via-amber-500 to-red-600 shadow-xl animate-pulse">
                  <CheckCircle className="h-12 w-12 text-white animate-bounce" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center animate-spin" style={{ animationDuration: '3s' }}>
                  <PartyPopper className="h-4 w-4 text-white" />
                </div>
              </div>
              
              <DialogTitle className="font-playfair text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-700 bg-clip-text text-transparent mb-3">
                🚀 Login Berhasil!
              </DialogTitle>
              
              <DialogDescription className="font-poppins text-center text-gray-700 text-base leading-relaxed space-y-2">
                <div className="font-semibold text-orange-700">
                  Selamat datang kembali di <strong>Warung IbuMus</strong>!
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-orange-50/50 rounded-lg p-3 border border-orange-200/50">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                  <span>🍽️ Anda akan dialihkan ke halaman utama untuk menikmati menu lezat kami</span>
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                </div>
              </DialogDescription>
            </DialogHeader>
            
            <div className="mt-8 relative z-10">
              <Button 
                onClick={handleCloseSignInSuccessDialog}
                className="font-poppins w-full bg-gradient-to-r from-orange-500 via-amber-500 to-red-500 hover:from-orange-600 hover:via-amber-600 hover:to-red-600 text-white font-semibold py-4 px-6 rounded-xl shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
              >
                <div className="flex items-center justify-center gap-2">
                  <UtensilsCrossed className="w-5 h-5" />
                  🎯 Lanjutkan ke Menu
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AuthPage;
