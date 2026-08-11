select cron.unschedule(jobid)
from cron.job
where jobname = 'reconcile_courier_orders_every_5_minutes';

select cron.schedule(
  'reconcile_courier_orders_every_5_minutes',
  '*/5 * * * *',
  $$
  select
    net.http_post(
      url:='https://dhafduzlhpartlvsgbqx.supabase.co/functions/v1/reconcile-courier-orders',
      headers:='{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRoYWZkdXpsaHBhcnRsdnNnYnF4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MzYxODcsImV4cCI6MjA3ODUxMjE4N30.Gap7YK8lmkOLoeKwl0xvo-DJEbHCAg8qKCnYyQ7Lbzw"}'::jsonb,
      body:='{"batchSize":50}'::jsonb
    ) as request_id;
  $$
);