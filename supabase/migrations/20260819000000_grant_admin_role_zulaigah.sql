-- Grant admin and employee roles to zulaigah.benjamin@maharajasspices.co.za
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin' FROM auth.users WHERE email = 'zulaigah.benjamin@maharajasspices.co.za'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'employee' FROM auth.users WHERE email = 'zulaigah.benjamin@maharajasspices.co.za'
ON CONFLICT (user_id, role) DO NOTHING;