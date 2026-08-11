-- Confirm the email for aryan123qwer@gmail.com
UPDATE auth.users 
SET email_confirmed_at = NOW()
WHERE email = 'aryan123qwer@gmail.com' AND email_confirmed_at IS NULL;