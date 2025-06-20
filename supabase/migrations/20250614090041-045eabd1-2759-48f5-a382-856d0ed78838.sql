
-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('menu-images', 'menu-images', true);

-- Create storage bucket for category images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('category-images', 'category-images', true);

-- Storage policies for menu images
CREATE POLICY "Anyone can view menu images" ON storage.objects
FOR SELECT USING (bucket_id = 'menu-images');

CREATE POLICY "Authenticated users can upload menu images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'menu-images' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can update menu images" ON storage.objects
FOR UPDATE USING (bucket_id = 'menu-images' AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Admins can delete menu images" ON storage.objects
FOR DELETE USING (bucket_id = 'menu-images' AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
));

-- Storage policies for category images
CREATE POLICY "Anyone can view category images" ON storage.objects
FOR SELECT USING (bucket_id = 'category-images');

CREATE POLICY "Authenticated users can upload category images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'category-images' AND auth.role() = 'authenticated');

CREATE POLICY "Admins can update category images" ON storage.objects
FOR UPDATE USING (bucket_id = 'category-images' AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
));

CREATE POLICY "Admins can delete category images" ON storage.objects
FOR DELETE USING (bucket_id = 'category-images' AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
));

-- Create cart table for shopping cart functionality
CREATE TABLE public.cart_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES public.menu_items ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, menu_item_id)
);

-- Enable RLS for cart_items
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cart_items
CREATE POLICY "Users can manage their own cart items" ON public.cart_items
    FOR ALL USING (auth.uid() = user_id);

-- Trigger for cart_items updated_at
CREATE TRIGGER update_cart_items_updated_at BEFORE UPDATE ON public.cart_items
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create table for promotional banners
CREATE TABLE public.banners (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    link_url TEXT,
    is_active BOOLEAN DEFAULT true,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for banners
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;

-- RLS Policies for banners (public read, admin write)
CREATE POLICY "Anyone can view active banners" ON public.banners
    FOR SELECT USING (is_active = true);
CREATE POLICY "Only admins can manage banners" ON public.banners
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Trigger for banners updated_at
CREATE TRIGGER update_banners_updated_at BEFORE UPDATE ON public.banners
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample categories
INSERT INTO public.categories (name, description, is_active) VALUES
('Makanan Utama', 'Nasi, mie, dan hidangan utama lainnya', true),
('Lauk Pauk', 'Ayam, ikan, daging, dan lauk pendamping', true),
('Sayuran', 'Sayur-sayuran segar dan tumisan', true),
('Minuman', 'Minuman segar dan hangat', true),
('Cemilan', 'Camilan dan makanan ringan', true),
('Dessert', 'Makanan penutup dan es', true);

-- Insert sample menu items
INSERT INTO public.menu_items (category_id, name, description, ingredients, price, is_available, is_popular) VALUES
-- Makanan Utama
((SELECT id FROM public.categories WHERE name = 'Makanan Utama'), 'Nasi Gudeg', 'Nasi dengan gudeg khas Yogyakarta', 'Nasi, gudeg, ayam, tahu, tempe, areh', 25000, true, true),
((SELECT id FROM public.categories WHERE name = 'Makanan Utama'), 'Nasi Rawon', 'Nasi dengan rawon daging sapi', 'Nasi, daging sapi, kuah rawon, tauge, kerupuk', 30000, true, true),
((SELECT id FROM public.categories WHERE name = 'Makanan Utama'), 'Mie Ayam', 'Mie dengan ayam dan bakso', 'Mie, ayam, bakso, sawi, kaldu ayam', 20000, true, false),
((SELECT id FROM public.categories WHERE name = 'Makanan Utama'), 'Nasi Pecel', 'Nasi dengan sayuran dan bumbu pecel', 'Nasi, kacang panjang, bayam, tauge, bumbu pecel', 18000, true, true),

-- Lauk Pauk
((SELECT id FROM public.categories WHERE name = 'Lauk Pauk'), 'Ayam Bakar', 'Ayam bakar bumbu kecap', 'Ayam, bumbu bakar, kecap manis', 35000, true, true),
((SELECT id FROM public.categories WHERE name = 'Lauk Pauk'), 'Ikan Gurame Goreng', 'Ikan gurame goreng crispy', 'Ikan gurame, tepung, bumbu', 40000, true, false),
((SELECT id FROM public.categories WHERE name = 'Lauk Pauk'), 'Rendang Daging', 'Rendang daging sapi Padang', 'Daging sapi, santan, bumbu rendang', 45000, true, true),
((SELECT id FROM public.categories WHERE name = 'Lauk Pauk'), 'Tempe Mendoan', 'Tempe goreng tepung khas Banyumas', 'Tempe, tepung, bumbu', 12000, true, false),

-- Sayuran
((SELECT id FROM public.categories WHERE name = 'Sayuran'), 'Gado-gado', 'Sayuran dengan bumbu kacang', 'Kacang panjang, kol, timun, bumbu kacang', 15000, true, false),
((SELECT id FROM public.categories WHERE name = 'Sayuran'), 'Tumis Kangkung', 'Kangkung tumis terasi', 'Kangkung, terasi, cabai, bawang', 10000, true, false),
((SELECT id FROM public.categories WHERE name = 'Sayuran'), 'Sayur Asem', 'Sayur asem segar', 'Kacang panjang, jagung, labu siam, asam jawa', 12000, true, false),

-- Minuman
((SELECT id FROM public.categories WHERE name = 'Minuman'), 'Es Teh Manis', 'Es teh manis segar', 'Teh, gula, es batu', 5000, true, false),
((SELECT id FROM public.categories WHERE name = 'Minuman'), 'Jus Jeruk', 'Jus jeruk segar', 'Jeruk segar, gula, es', 8000, true, false),
((SELECT id FROM public.categories WHERE name = 'Minuman'), 'Es Kelapa Muda', 'Kelapa muda segar', 'Kelapa muda, es, gula aren', 12000, true, true),

-- Cemilan
((SELECT id FROM public.categories WHERE name = 'Cemilan'), 'Kerupuk Udang', 'Kerupuk udang crispy', 'Tepung tapioka, udang', 8000, true, false),
((SELECT id FROM public.categories WHERE name = 'Cemilan'), 'Pisang Goreng', 'Pisang goreng tepung', 'Pisang, tepung, minyak', 10000, true, false),

-- Dessert
((SELECT id FROM public.categories WHERE name = 'Dessert'), 'Es Campur', 'Es campur spesial', 'Es serut, kolang kaling, cincau, sirup', 15000, true, true),
((SELECT id FROM public.categories WHERE name = 'Dessert'), 'Klepon', 'Klepon isi gula merah', 'Tepung ketan, gula merah, kelapa parut', 12000, true, false);

-- Insert sample banners
INSERT INTO public.banners (title, description, is_active, start_date, end_date) VALUES
('Promo Spesial Hari Ini!', 'Dapatkan diskon 20% untuk semua menu makanan utama', true, now(), now() + interval '30 days'),
('Menu Baru: Rendang Daging', 'Coba menu terbaru kami - Rendang Daging autentik Padang', true, now(), now() + interval '60 days');
