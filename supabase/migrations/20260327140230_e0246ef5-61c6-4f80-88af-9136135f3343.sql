INSERT INTO public.user_roles (user_id, role)
VALUES ('c4aa8579-29cf-4049-81bc-9eed1e640e10', 'employee')
ON CONFLICT (user_id, role) DO NOTHING;