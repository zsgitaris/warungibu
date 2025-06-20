
-- Cek berapa banyak user yang ada di tabel auth.users
SELECT COUNT(*) as total_auth_users FROM auth.users;

-- Cek berapa banyak profil yang ada di tabel profiles
SELECT COUNT(*) as total_profiles FROM public.profiles;

-- Cek detail semua profil yang ada
SELECT 
  p.id,
  p.full_name,
  p.role,
  p.created_at,
  u.email,
  u.created_at as auth_created_at
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
ORDER BY p.created_at DESC;

-- Cek apakah trigger masih aktif
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Cek apakah function handle_new_user masih ada
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' 
AND routine_schema = 'public';
