-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule keep-alive to run every 6 days at 3 AM UTC
SELECT cron.schedule(
  'keep-alive-ping',
  '0 3 */6 * *',
  $$
  SELECT
    net.http_post(
        url:='https://dhafduzlhpartlvsgbqx.supabase.co/functions/v1/keep-alive',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoYWZkdXpsaHBhcnRsdnNnYnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MzYxODcsImV4cCI6MjA3ODUxMjE4N30.Gap7YK8lmkOLoeKwl0xvo-DJEbHCAg8qKCnYyQ7Lbzw"}'::jsonb,
        body:='{"source": "cron"}'::jsonb
    ) as request_id;
  $$
);