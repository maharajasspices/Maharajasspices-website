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
      headers:=jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body:='{"batchSize": 50}'::jsonb
    ) as request_id;
  $$
);