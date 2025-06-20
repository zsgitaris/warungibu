import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Banner {
  id: string;
  title: string;
  description?: string;
  image_url?: string;
  link_url?: string;
}

const Banner = () => {
  const { data: banners } = useQuery({
    queryKey: ['banners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Banner[];
    },
  });

  if (!banners || banners.length === 0) return null;

  return (
    <section className="py-8 bg-gradient-to-br from-orange-50 via-amber-25 to-red-50">
      <div className="container mx-auto px-4">
        <div className="grid gap-4 md:grid-cols-2">
          {banners.map((banner) => (
            <Card 
              key={banner.id} 
              style={{
                background: 'linear-gradient(135deg, rgba(255, 237, 213, 0.95) 0%, rgba(255, 255, 255, 0.98) 50%, rgba(255, 243, 224, 0.95) 100%)',
                backdropFilter: 'blur(8px)',
                border: '2px solid rgba(251, 146, 60, 0.3)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), 0 4px 16px rgba(251, 146, 60, 0.2)'
              }}
              className="transition-all duration-300 hover:-translate-y-2 hover:scale-105 rounded-2xl overflow-hidden"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 
                      className="text-xl font-bold mb-2"
                      style={{
                        background: 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                      }}
                    >
                      {banner.title}
                    </h3>
                    {banner.description && (
                      <p 
                        className="mb-4 leading-relaxed"
                        style={{ color: '#374151' }}
                      >
                        {banner.description}
                      </p>
                    )}
                    {banner.link_url && (
                      <Button 
                        variant="outline" 
                        style={{
                          background: 'rgba(255, 255, 255, 0.95)',
                          border: '2px solid #fb923c',
                          color: '#ea580c',
                          borderRadius: '12px',
                          padding: '8px 24px',
                          fontWeight: '600',
                          boxShadow: '0 4px 12px rgba(251, 146, 60, 0.2)',
                          transition: 'all 0.3s ease'
                        }}
                        className="hover:bg-white hover:border-orange-500 hover:text-orange-600 hover:-translate-y-1 hover:scale-105"
                      >
                        Lihat Detail
                      </Button>
                    )}
                  </div>
                  <div className="ml-4">
                    <div 
                      style={{
                        width: '64px',
                        height: '64px',
                        background: 'linear-gradient(135deg, #f97316 0%, #dc2626 100%)',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 24px rgba(249, 115, 22, 0.4)',
                        transition: 'all 0.3s ease'
                      }}
                      className="hover:scale-110 hover:rotate-12"
                    >
                      <span 
                        className="text-3xl"
                        style={{ 
                          animation: 'bounce 2s infinite',
                          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
                        }}
                      >
                        🎉
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Banner;