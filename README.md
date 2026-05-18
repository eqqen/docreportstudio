# docreportstudio

Веб-сервис: генератор готовых протоколов МРТ для рентгенологов.

## Структура папки

```
docreportstudio/
├── index.html              ← лендинг (главная)
├── auth/
│   └── callback.html       ← страница приёма magic-link (создадим на шаге 5)
├── app/
│   ├── index.html          ← дашборд после входа (создадим на шаге 6)
│   ├── cervical/
│   │   └── index.html      ← МРТ ШОП (перенесём из Cervical-standalone-2026fix4)
│   └── lspine/
│       └── index.html      ← МРТ ПОП (перенесём из L-spine-standalone-2026fix4)
├── supabase/
│   └── schema.sql          ← схема БД, выполнить в Supabase SQL Editor
└── README.md               ← этот файл
```

## Текущий статус

- [x] Лендинг (index.html) — черновик готов, форма-заглушка
- [x] Схема БД для Supabase
- [ ] Регистрация домена
- [ ] Аккаунт Cloudflare + GitHub
- [ ] Деплой лендинга на Cloudflare Pages
- [ ] Подключить Supabase
- [ ] Перенести HTML-приложения и закрыть авторизацией
- [ ] Транзакционные письма
- [ ] Форма обратной связи + аналитика
- [ ] Тесты + запуск беты

## Как посмотреть лендинг локально

Открыть `index.html` двойным кликом — откроется в браузере. Это HTML, никакого билда не нужно.

## Стек

- **Cloudflare Pages** — хостинг (free)
- **Supabase** — auth + БД (free)
- **Cloudflare Workers** — серверная логика (free)
- **Resend** — транзакционные письма (free до 3000/мес)
- **GitHub** — репозиторий
