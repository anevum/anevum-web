-- ANEVUM public moderated wiki v1
-- Private Canon Wiki remains the authoritative internal source.
-- Public pages begin empty; only admin-approved submissions become published.

create or replace function public.is_wiki_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select
    coalesce((auth.jwt() -> 'app_metadata' ->> 'wiki_admin')::boolean, false)
    or coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') in ('admin', 'wiki_admin');
$$;

revoke all on function public.is_wiki_admin() from public;
grant execute on function public.is_wiki_admin() to anon, authenticated;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function public.set_updated_at() from public;

create table public.wiki_categories (
  id text primary key,
  label text not null,
  description text not null default '',
  sort_order integer not null default 0
);

create table public.wiki_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null,
  category_id text not null references public.wiki_categories(id),
  summary text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  current_revision_id uuid,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table public.wiki_revisions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.wiki_pages(id) on delete cascade,
  revision_no integer not null check (revision_no > 0),
  title text not null,
  summary text not null default '',
  body_md text not null default '',
  category_id text not null references public.wiki_categories(id),
  change_summary text not null default '',
  author_id uuid references auth.users(id) on delete set null,
  status text not null default 'approved' check (status in ('approved', 'reverted')),
  created_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  unique(page_id, revision_no)
);

alter table public.wiki_pages
  add constraint wiki_pages_current_revision_fkey
  foreign key (current_revision_id) references public.wiki_revisions(id) on delete set null;

create table public.wiki_submissions (
  id uuid primary key default gen_random_uuid(),
  submission_type text not null check (submission_type in ('new_page', 'edit_page')),
  page_id uuid references public.wiki_pages(id) on delete cascade,
  proposed_slug text not null check (proposed_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  proposed_title text not null,
  category_id text not null references public.wiki_categories(id),
  summary text not null default '',
  body_md text not null default '',
  change_summary text not null default '',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'changes_requested')),
  submitter_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_note text not null default '',
  resulting_revision_id uuid references public.wiki_revisions(id) on delete set null,
  check ((submission_type = 'new_page' and page_id is null) or (submission_type = 'edit_page' and page_id is not null))
);

create table public.wiki_links (
  id uuid primary key default gen_random_uuid(),
  from_page_id uuid not null references public.wiki_pages(id) on delete cascade,
  to_page_id uuid not null references public.wiki_pages(id) on delete cascade,
  relation text not null default 'related',
  created_at timestamptz not null default now(),
  unique(from_page_id, to_page_id, relation),
  check (from_page_id <> to_page_id)
);

create table public.wiki_saves (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  page_id uuid not null references public.wiki_pages(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, page_id)
);

create table public.wiki_admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  submission_id uuid references public.wiki_submissions(id) on delete set null,
  page_id uuid references public.wiki_pages(id) on delete set null,
  action text not null check (action in ('approve', 'reject', 'request_changes', 'archive', 'restore')),
  note text not null default '',
  created_at timestamptz not null default now()
);

insert into public.wiki_categories (id, label, description, sort_order) values
  ('universe', 'Universe', 'People, science, technology, institutions and concepts.', 10),
  ('atlas', 'Atlas', 'Worlds, regions, cities, sites and infrastructure.', 20),
  ('archive', 'Archive', 'Historical events, records, facilities and eras.', 30),
  ('stories', 'Stories', 'Published story-facing reference material.', 40),
  ('meta', 'Meta', 'Public documentation about the ANEVUM wiki itself.', 90);

create index wiki_pages_status_idx on public.wiki_pages(status);
create index wiki_pages_category_idx on public.wiki_pages(category_id);
create index wiki_revisions_page_created_idx on public.wiki_revisions(page_id, created_at desc);
create index wiki_submissions_status_created_idx on public.wiki_submissions(status, created_at asc);
create index wiki_submissions_submitter_idx on public.wiki_submissions(submitter_id, created_at desc);
create unique index wiki_pending_new_slug_idx on public.wiki_submissions(proposed_slug)
  where submission_type = 'new_page' and status = 'pending';
create index wiki_links_from_idx on public.wiki_links(from_page_id);
create index wiki_links_to_idx on public.wiki_links(to_page_id);

create trigger wiki_pages_updated_at
before update on public.wiki_pages
for each row execute function public.set_updated_at();

alter table public.wiki_categories enable row level security;
alter table public.wiki_pages enable row level security;
alter table public.wiki_revisions enable row level security;
alter table public.wiki_submissions enable row level security;
alter table public.wiki_links enable row level security;
alter table public.wiki_saves enable row level security;
alter table public.wiki_admin_actions enable row level security;

grant select on public.wiki_categories, public.wiki_pages, public.wiki_revisions, public.wiki_links to anon, authenticated;
grant select, insert, update on public.wiki_submissions to authenticated;
grant select, insert, delete on public.wiki_saves to authenticated;
grant insert, update, delete on public.wiki_categories, public.wiki_pages, public.wiki_revisions, public.wiki_links to authenticated;
grant select, insert on public.wiki_admin_actions to authenticated;

create policy wiki_categories_read on public.wiki_categories for select to anon, authenticated using (true);
create policy wiki_categories_admin_write on public.wiki_categories for all to authenticated
  using ((select public.is_wiki_admin())) with check ((select public.is_wiki_admin()));

create policy wiki_pages_public_read on public.wiki_pages for select to anon, authenticated
  using (status = 'published' or (select public.is_wiki_admin()));
create policy wiki_pages_admin_write on public.wiki_pages for all to authenticated
  using ((select public.is_wiki_admin())) with check ((select public.is_wiki_admin()));

create policy wiki_revisions_public_read on public.wiki_revisions for select to anon, authenticated
  using (
    (status = 'approved' and exists (
      select 1 from public.wiki_pages p where p.id = wiki_revisions.page_id and p.status = 'published'
    )) or (select public.is_wiki_admin())
  );
create policy wiki_revisions_admin_write on public.wiki_revisions for all to authenticated
  using ((select public.is_wiki_admin())) with check ((select public.is_wiki_admin()));

create policy wiki_submissions_member_read on public.wiki_submissions for select to authenticated
  using (submitter_id = (select auth.uid()) or (select public.is_wiki_admin()));
create policy wiki_submissions_member_insert on public.wiki_submissions for insert to authenticated
  with check (
    submitter_id = (select auth.uid()) and status = 'pending'
    and reviewed_by is null and reviewed_at is null and resulting_revision_id is null
  );
create policy wiki_submissions_admin_update on public.wiki_submissions for update to authenticated
  using ((select public.is_wiki_admin())) with check ((select public.is_wiki_admin()));

create policy wiki_links_public_read on public.wiki_links for select to anon, authenticated
  using (
    (select public.is_wiki_admin()) or (
      exists (select 1 from public.wiki_pages p where p.id = wiki_links.from_page_id and p.status = 'published')
      and exists (select 1 from public.wiki_pages p where p.id = wiki_links.to_page_id and p.status = 'published')
    )
  );
create policy wiki_links_admin_write on public.wiki_links for all to authenticated
  using ((select public.is_wiki_admin())) with check ((select public.is_wiki_admin()));

create policy wiki_saves_owner_read on public.wiki_saves for select to authenticated
  using (user_id = (select auth.uid()));
create policy wiki_saves_owner_insert on public.wiki_saves for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.wiki_pages p where p.id = wiki_saves.page_id and p.status = 'published')
  );
create policy wiki_saves_owner_delete on public.wiki_saves for delete to authenticated
  using (user_id = (select auth.uid()));

create policy wiki_admin_actions_admin_read on public.wiki_admin_actions for select to authenticated
  using ((select public.is_wiki_admin()));
create policy wiki_admin_actions_admin_insert on public.wiki_admin_actions for insert to authenticated
  with check ((select public.is_wiki_admin()) and admin_id = (select auth.uid()));

create or replace function public.review_wiki_submission(
  p_submission_id uuid,
  p_decision text,
  p_note text default ''
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  s public.wiki_submissions%rowtype;
  v_page_id uuid;
  v_revision_id uuid;
  v_revision_no integer;
  v_action text;
begin
  if not public.is_wiki_admin() then
    raise exception 'wiki admin required' using errcode = '42501';
  end if;

  if p_decision not in ('approved', 'rejected', 'changes_requested') then
    raise exception 'invalid review decision' using errcode = '22023';
  end if;

  select * into s from public.wiki_submissions where id = p_submission_id for update;
  if not found then raise exception 'submission not found' using errcode = 'P0002'; end if;
  if s.status <> 'pending' then raise exception 'submission already reviewed' using errcode = '55000'; end if;

  if p_decision = 'approved' then
    if s.submission_type = 'new_page' then
      insert into public.wiki_pages (slug, title, category_id, summary, status, created_by)
      values (s.proposed_slug, s.proposed_title, s.category_id, s.summary, 'draft', s.submitter_id)
      returning id into v_page_id;
      v_revision_no := 1;
    else
      v_page_id := s.page_id;
      select coalesce(max(revision_no), 0) + 1 into v_revision_no
      from public.wiki_revisions where page_id = v_page_id;
    end if;

    insert into public.wiki_revisions (
      page_id, revision_no, title, summary, body_md, category_id, change_summary,
      author_id, status, reviewed_by, reviewed_at
    ) values (
      v_page_id, v_revision_no, s.proposed_title, s.summary, s.body_md, s.category_id,
      s.change_summary, s.submitter_id, 'approved', auth.uid(), now()
    ) returning id into v_revision_id;

    update public.wiki_pages
    set slug = s.proposed_slug,
        title = s.proposed_title,
        category_id = s.category_id,
        summary = s.summary,
        status = 'published',
        current_revision_id = v_revision_id,
        published_at = coalesce(published_at, now())
    where id = v_page_id;

    update public.wiki_submissions
    set status = 'approved', reviewed_by = auth.uid(), reviewed_at = now(),
        review_note = coalesce(p_note, ''), resulting_revision_id = v_revision_id
    where id = s.id;
    v_action := 'approve';
  else
    update public.wiki_submissions
    set status = p_decision, reviewed_by = auth.uid(), reviewed_at = now(), review_note = coalesce(p_note, '')
    where id = s.id;
    v_page_id := s.page_id;
    v_action := case when p_decision = 'rejected' then 'reject' else 'request_changes' end;
  end if;

  insert into public.wiki_admin_actions (admin_id, submission_id, page_id, action, note)
  values (auth.uid(), s.id, v_page_id, v_action, coalesce(p_note, ''));

  return v_page_id;
end;
$$;

revoke all on function public.review_wiki_submission(uuid, text, text) from public;
grant execute on function public.review_wiki_submission(uuid, text, text) to authenticated;
