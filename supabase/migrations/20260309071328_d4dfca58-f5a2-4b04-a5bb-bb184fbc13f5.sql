INSERT INTO public.user_roles (user_id, role)
VALUES ('7568882b-28e1-40ea-a11b-2cb8b3d73d60', 'employee')
ON CONFLICT (user_id, role) DO NOTHING;