
-- Restore EXECUTE for authenticated/anon on functions referenced inside RLS policies
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sc_is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sc_is_manager_or_admin(uuid) TO authenticated;
