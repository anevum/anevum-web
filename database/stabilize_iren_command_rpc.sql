create or replace function public.iren_command_snapshot()
returns jsonb
language sql
stable
security definer
set search_path = pg_catalog, public, private
as $function$
  with control as (
    select revision, state, updated_at
    from private.iren_control_state
    where singleton
    limit 1
  ),
  objective_rows as (
    select objective_key,parent_key,title,description,status,owner_system,priority,
           dependencies,success_criteria,protected_action,metadata,created_at,updated_at,completed_at
    from private.iren_objectives
  ),
  job_rows as (
    select job_id,objective_key,title,owner_system,job_type,status,priority,
           protected_action,requires_human,requested_by,requested_via,
           started_at,completed_at,result,error,metadata,created_at,updated_at
    from private.iren_jobs
    order by created_at desc
    limit 100
  ),
  command_rows as (
    select command_id,command_text,source,requested_by,status,response,linked_job_id,
           created_at,updated_at,completed_at
    from private.iren_commands
    order by created_at desc
    limit 50
  )
  select jsonb_build_object(
    'control',
      (select to_jsonb(c) from control c),
    'work',
      jsonb_build_object(
        'objectives',
          coalesce(
            (select jsonb_agg(to_jsonb(o) order by o.priority desc, o.created_at asc)
             from objective_rows o),
            '[]'::jsonb
          ),
        'jobs',
          coalesce(
            (select jsonb_agg(to_jsonb(j) order by j.created_at desc)
             from job_rows j),
            '[]'::jsonb
          ),
        'commands',
          coalesce(
            (select jsonb_agg(to_jsonb(c) order by c.created_at desc)
             from command_rows c),
            '[]'::jsonb
          )
      )
  );
$function$;

create or replace function public.iren_enqueue_command(
  p_command text,
  p_requested_by text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $function$
declare
  created private.iren_commands%rowtype;
begin
  if nullif(btrim(p_command), '') is null then
    raise exception 'command_required' using errcode = '22023';
  end if;

  insert into private.iren_commands (command_text, source, requested_by)
  values (
    left(btrim(p_command), 4000),
    'command',
    left(coalesce(nullif(btrim(p_requested_by), ''), 'command-admin'), 160)
  )
  returning * into created;

  return jsonb_build_object(
    'command_id', created.command_id,
    'command_text', created.command_text,
    'source', created.source,
    'requested_by', created.requested_by,
    'status', created.status,
    'created_at', created.created_at
  );
end;
$function$;

revoke all on function public.iren_command_snapshot() from public;
revoke all on function public.iren_command_snapshot() from anon, authenticated;
grant execute on function public.iren_command_snapshot() to service_role;

revoke all on function public.iren_enqueue_command(text, text) from public;
revoke all on function public.iren_enqueue_command(text, text) from anon, authenticated;
grant execute on function public.iren_enqueue_command(text, text) to service_role;
