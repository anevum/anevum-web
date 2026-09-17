-- REPLY ownership verification v1
-- Claim codes are stored only as SHA-256 hashes. Authenticated RHENLINK members
-- may redeem a valid, unused code exactly once for the REPLY publication.

create extension if not exists pgcrypto with schema extensions;

create table public.publication_claim_codes (
  id uuid primary key default gen_random_uuid(),
  publication_id text not null default 'reply-book-1',
  code_hash text not null unique,
  edition text not null default 'REPLY',
  xp_award integer not null default 250 check (xp_award between 0 and 5000),
  enabled boolean not null default true,
  expires_at timestamptz,
  claimed_by uuid references auth.users(id) on delete set null,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  check (code_hash ~ '^[0-9a-f]{64}$'),
  check ((claimed_by is null and claimed_at is null) or (claimed_by is not null and claimed_at is not null))
);

create table public.member_publication_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  publication_id text not null,
  code_id uuid not null unique references public.publication_claim_codes(id) on delete restrict,
  edition text not null,
  xp_awarded integer not null check (xp_awarded between 0 and 5000),
  claimed_at timestamptz not null default now(),
  unique (user_id, publication_id)
);

create index member_publication_claims_user_idx on public.member_publication_claims(user_id, claimed_at desc);
create index publication_claim_codes_publication_idx on public.publication_claim_codes(publication_id, enabled);

alter table public.publication_claim_codes enable row level security;
alter table public.member_publication_claims enable row level security;

revoke all on public.publication_claim_codes from anon, authenticated;
revoke all on public.member_publication_claims from anon, authenticated;
grant select on public.member_publication_claims to authenticated;

create policy member_publication_claims_owner_read on public.member_publication_claims
  for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.redeem_publication_code(p_code text)
returns table (
  publication_id text,
  edition text,
  xp_awarded integer,
  claimed_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_normalized text;
  v_hash text;
  v_code public.publication_claim_codes%rowtype;
  v_existing public.member_publication_claims%rowtype;
begin
  if v_user is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  v_normalized := upper(regexp_replace(coalesce(p_code, ''), '[^A-Za-z0-9]', '', 'g'));
  if length(v_normalized) < 8 or length(v_normalized) > 64 then
    raise exception 'invalid claim code' using errcode = '22023';
  end if;

  v_hash := encode(extensions.digest(v_normalized, 'sha256'), 'hex');

  select * into v_code
  from public.publication_claim_codes
  where code_hash = v_hash
  for update;

  if not found then
    raise exception 'claim code not recognized' using errcode = 'P0002';
  end if;

  select * into v_existing
  from public.member_publication_claims
  where user_id = v_user and publication_id = v_code.publication_id;

  if found then
    return query select v_existing.publication_id, v_existing.edition, v_existing.xp_awarded, v_existing.claimed_at;
    return;
  end if;

  if not v_code.enabled then
    raise exception 'claim code is disabled' using errcode = '55000';
  end if;
  if v_code.expires_at is not null and v_code.expires_at <= now() then
    raise exception 'claim code has expired' using errcode = '55000';
  end if;
  if v_code.claimed_by is not null then
    raise exception 'claim code has already been redeemed' using errcode = '55000';
  end if;

  update public.publication_claim_codes
  set claimed_by = v_user, claimed_at = now()
  where id = v_code.id;

  insert into public.member_publication_claims (user_id, publication_id, code_id, edition, xp_awarded)
  values (v_user, v_code.publication_id, v_code.id, v_code.edition, v_code.xp_award)
  returning * into v_existing;

  return query select v_existing.publication_id, v_existing.edition, v_existing.xp_awarded, v_existing.claimed_at;
end;
$$;

revoke all on function public.redeem_publication_code(text) from public;
grant execute on function public.redeem_publication_code(text) to authenticated;

create or replace function public.issue_publication_claim_codes(
  p_count integer default 1,
  p_edition text default 'REPLY',
  p_xp_award integer default 250,
  p_expires_at timestamptz default null
)
returns table (
  claim_code text,
  claim_edition text,
  claim_xp integer,
  claim_expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_index integer;
  v_raw text;
  v_display text;
  v_normalized text;
begin
  if not public.is_wiki_admin() then
    raise exception 'admin required' using errcode = '42501';
  end if;
  if p_count < 1 or p_count > 100 then
    raise exception 'claim code count must be between 1 and 100' using errcode = '22023';
  end if;
  if p_xp_award < 0 or p_xp_award > 5000 then
    raise exception 'xp award must be between 0 and 5000' using errcode = '22023';
  end if;
  if length(trim(coalesce(p_edition, ''))) < 1 or length(trim(p_edition)) > 80 then
    raise exception 'edition label is required' using errcode = '22023';
  end if;

  for v_index in 1..p_count loop
    v_raw := upper(encode(extensions.gen_random_bytes(8), 'hex'));
    v_display := 'REPLY-' || substr(v_raw, 1, 4) || '-' || substr(v_raw, 5, 4) || '-' || substr(v_raw, 9, 4) || '-' || substr(v_raw, 13, 4);
    v_normalized := upper(regexp_replace(v_display, '[^A-Za-z0-9]', '', 'g'));

    insert into public.publication_claim_codes (publication_id, code_hash, edition, xp_award, expires_at)
    values (
      'reply-book-1',
      encode(extensions.digest(v_normalized, 'sha256'), 'hex'),
      trim(p_edition),
      p_xp_award,
      p_expires_at
    );

    return query select v_display, trim(p_edition), p_xp_award, p_expires_at;
  end loop;
end;
$$;

revoke all on function public.issue_publication_claim_codes(integer, text, integer, timestamptz) from public;
grant execute on function public.issue_publication_claim_codes(integer, text, integer, timestamptz) to authenticated;

comment on table public.publication_claim_codes is 'Server-authoritative hashed publication ownership claim codes. Never expose code hashes publicly.';
comment on table public.member_publication_claims is 'Verified publication ownership claims attached to RHENLINK users.';
comment on function public.redeem_publication_code(text) is 'Redeems one hashed publication claim code for the authenticated user and returns the verified reward.';
comment on function public.issue_publication_claim_codes(integer, text, integer, timestamptz) is 'Admin-only one-time claim-code issuance. Plaintext codes are returned only during issuance; only hashes are stored.';
