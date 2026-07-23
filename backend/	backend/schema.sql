-- NexaBot — Supabase Schema
-- Supabase Dashboard > SQL Editor me paste karke Run karein

create extension if not exists "pgcrypto";

-- ============ BOTS ============
create table if not exists public.bots (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Support Bot',
  business_name text not null default 'My Business',
  knowledge_base text default '',
  welcome_message text default 'Hi! How can I help you today?',
  fallback_message text default 'I don''t have that information. Please contact our team directly.',
  tone text default 'friendly and professional',
  theme_color text default '#2563eb',
  created_at timestamptz not null default now()
);

-- ============ MESSAGES ============
create table if not exists public.messages (
  id bigserial primary key,
  bot_id uuid not null references public.bots(id) on delete cascade,
  session_id text not null,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_messages_session on public.messages(session_id, created_at desc);
create index if not exists idx_messages_bot on public.messages(bot_id, created_at desc);

-- ============ RLS ============
-- Backend service_role key use karta hai jo RLS bypass karti hai.
-- RLS ON rakho taake anon key se koi data na nikaal sake.
alter table public.bots enable row level security;
alter table public.messages enable row level security;

-- Koi public policy nahi — sirf service_role access.

-- ============ DEMO BOT ============
insert into public.bots (name, business_name, knowledge_base, welcome_message, theme_color, tone)
values (
  'Dr. Assist',
  'Lahore Dental Clinic',
  'ABOUT: Lahore Dental Clinic, established 2015, located at 12-A Main Boulevard, Gulberg III, Lahore.

TIMINGS: Monday to Saturday, 10:00 AM to 8:00 PM. Sunday closed. Emergency line open 24/7.

SERVICES & PRICES:
- Consultation: PKR 1,500
- Teeth Cleaning (Scaling): PKR 5,000
- Tooth Filling: PKR 3,500 per tooth
- Root Canal: PKR 15,000 to 25,000 depending on tooth
- Tooth Extraction: PKR 4,000
- Teeth Whitening: PKR 20,000
- Braces (full treatment): PKR 120,000 to 180,000
- Dental Implant: PKR 90,000 per implant

DOCTORS:
- Dr. Ayesha Khan (BDS, FCPS) — Orthodontist, available Mon/Wed/Fri
- Dr. Bilal Ahmed (BDS, MDS) — Endodontist, available Tue/Thu/Sat

APPOINTMENTS: Call 042-3577-1234 or WhatsApp 0300-1234567. Walk-ins accepted but appointment preferred.

PAYMENT: Cash, credit/debit card, and Easypaisa accepted. Installment plans available for braces and implants.

INSURANCE: We accept Jubilee Life, EFU Health, and State Life panels.

POLICY: Appointment cancellation requires 4 hours notice. No refund on completed procedures.',
  'Assalam o Alaikum! Lahore Dental Clinic me khush aamdeed. Main aapki kaise madad kar sakta hoon?',
  '#0d9488',
  'warm, professional, and reassuring'
)
on conflict do nothing;

-- Bot ID copy karein:
select id, business_name from public.bots;
