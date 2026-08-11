-- Update config to require JWT for invoice endpoint
-- This must be done in config.toml manually, but we document it here

-- Note: The send-invoice function now requires authentication
-- Update supabase/config.toml to set:
-- [functions.send-invoice]
-- verify_jwt = true

-- This migration serves as documentation of the security fix