# ВРуки (v1.0) — Документация

ВРуки — простая доска объявлений без лишних комиссий и ограничений. Домен: v-ruki.ru.
Разработано на стеке React + Vite + Tailwind CSS + Supabase.

## ⚙️ Переменные окружения (.env)

Для работы приложения создайте `.env` файл:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
VITE_SITE_URL=https://your-domain.com
VITE_MAX_FILE_SIZE=5242880
```

> ⚠️ **ВНИМАНИЕ**: Никогда не добавляйте `SUPABASE_SERVICE_ROLE_KEY` в это приложение. Всё, что начинается с `VITE_`, будет доступно в коде фронтенда.

## 📜 SQL Setup (Настоящая безопасность)

Выполните этот SQL в консоли Supabase. Это единственный способ обеспечить реальную защиту данных:

```sql
-- 1. Таблицы профилей и ролей
alter table public.profiles add column role text check (role in ('user', 'admin', 'moderator')) default 'user';

-- 2. Таблица логов безопасности
create table public.security_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  context text not null,
  message text,
  user_agent text,
  created_at timestamptz default now()
);

alter table public.security_logs enable row level security;

create policy "Admins can read logs"
on public.security_logs for select
using (
  exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  )
);

-- 3. Очистка старых политик
drop policy if exists "Users can insert listings" on public.listings;
drop policy if exists "Secure listing creation" on public.listings;
drop policy if exists "Public can view active listings" on public.listings;
drop policy if exists "Admin can moderate listings" on public.listings;

-- 4. Защита SELECT: Публика видит только active, владелец и админ — всё
create policy "Listing visibility policy"
on public.listings for select
using (
  status = 'active'
  or auth.uid() = user_id
  or (select role from public.profiles where id = auth.uid()) in ('admin', 'moderator')
);

-- 5. Защита INSERT: Лимит 3 в день + проверка блокировки
create policy "Secure listing creation"
on public.listings for insert
with check (
  auth.uid() = user_id
  and exists (select 1 from public.profiles where id = auth.uid() and is_blocked = false)
  and (select count(*) from public.listings where user_id = auth.uid() and created_at > now() - interval '1 day') < 3
);

-- 6. Защита UPDATE: Модерация доступна только админам, редактирование — владельцу
create policy "Listing update policy"
on public.listings for update
using (
  auth.uid() = user_id 
  or (select role from public.profiles where id = auth.uid()) in ('admin', 'moderator')
)
with check (
  (auth.uid() = user_id and (status = 'draft' or status = 'moderation')) -- Владелец может менять только до одобрения
  or (select role from public.profiles where id = auth.uid()) in ('admin', 'moderator') -- Админ может всё
);

-- 7. Защита логов (INSERT разрешен всем авторизованным, SELECT только админам)
create policy "Users can insert logs" on public.security_logs for insert with check (auth.uid() is not null);
create policy "Admins can read logs" on public.security_logs for select using (
  (select role from public.profiles where id = auth.uid()) = 'admin'
);

-- 5. Ограничения на длину текста (Constraints)
alter table public.listings add constraint listings_title_length_check 
  check (char_length(title) between 10 and 100);
alter table public.listings add constraint listings_description_length_check 
  check (char_length(description) between 30 and 3000);
alter table public.listings add constraint listings_price_check 
  check (price >= 0);
```

## 🛡 Безопасность и архитектура

1.  **Принцип "Frontend is UI only"**: Фронтенд проверяет роль пользователя (`profile.role`) исключительно для переключения интерфейса (показ кнопок, меню).
2.  **Реальная защита (RLS)**: Все права на запись, редактирование и удаление контролируются политиками Supabase Row Level Security. Даже если злоумышленник изменит роль в локальном состоянии JS, БД отклонит любой несанкционированный запрос.
3.  **SQL Constraints**: Длина текста и корректность цен гарантированы на уровне схемы PostgreSQL.

## 📁 Структура проекта

*   `src/components/` — Переиспользуемые компоненты (Header, Footer, ListingCard).
*   `src/context/` — AuthContext для управления сессиями.
*   `src/utils/clientValidation.ts` — UX-валидация для помощи пользователю.
*   `src/utils/logger.ts` — Логирование действий в таблицу `security_logs`.

## ⚠️ TODO (v2.0)
*   **Серверный поиск**: Переход с клиентской фильтрации на Postgres Full Text Search.
*   **CAPTCHA**: Интеграция hCaptcha для защиты от ботов.
*   **IP Logging**: Логирование IP через Supabase Edge Functions.

---
Разработано специально для проекта "ВРуки" (v-ruki.ru).
