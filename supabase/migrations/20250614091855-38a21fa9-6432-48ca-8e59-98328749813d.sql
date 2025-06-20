
-- Update user role to admin (ganti 'email@example.com' dengan email akun yang ingin dijadikan admin)
UPDATE public.profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'zetsu301@gmail.com'  -- Ganti dengan email Anda
);

-- Atau jika ingin update berdasarkan user_id langsung:
-- UPDATE public.profiles SET role = 'admin' WHERE id = 'user_id_here';

-- Untuk melihat semua user dan role mereka:
SELECT 
  p.id,
  p.full_name,
  p.role,
  u.email
FROM public.profiles p
JOIN auth.users u ON p.id = u.id;
