// docreportstudio — виджет обратной связи
// Подключается на любой странице:  <script type="module" src="/assets/feedback.js"></script>
// Пишет в таблицу public.feedback в Supabase (через анонимный publishable-ключ + RLS).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = 'https://jgzsbfzivqlvruwewigg.supabase.co'
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_zRM4hYATscFC1m98kYQRtg_MzkeD0BO'

const sb = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)

// Определяем имя контекста по URL: dashboard / cervical / lspine / general
function detectAppName() {
  const p = window.location.pathname
  if (p.startsWith('/app/cervical')) return 'cervical'
  if (p.startsWith('/app/lspine')) return 'lspine'
  if (p.startsWith('/app')) return 'dashboard'
  return 'general'
}

// Стили (все классы с префиксом .dr-fb-, чтобы не конфликтовали с приложениями)
const style = document.createElement('style')
style.textContent = `
  .dr-fb-trigger {
    position: fixed;
    bottom: 20px;
    left: 20px;
    z-index: 9998;
    background: #2563eb;
    color: #ffffff;
    border: none;
    padding: 9px 14px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    opacity: 0.45;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
    transition: opacity 0.2s, background 0.15s, transform 0.15s, box-shadow 0.2s;
  }
  .dr-fb-trigger:hover {
    opacity: 1;
    background: #1d4ed8;
    transform: translateY(-1px);
    box-shadow: 0 4px 14px rgba(37, 99, 235, 0.35);
  }
  .dr-fb-trigger:active { transform: translateY(0); }

  .dr-fb-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.45);
    z-index: 9999;
    align-items: center;
    justify-content: center;
    padding: 20px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
  }
  .dr-fb-overlay.open { display: flex; }

  .dr-fb-card {
    background: #ffffff;
    border-radius: 16px;
    padding: 28px;
    max-width: 460px;
    width: 100%;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
    box-sizing: border-box;
  }
  .dr-fb-card h3 {
    font-size: 18px;
    font-weight: 700;
    margin: 0 0 6px;
    color: #1a1a1a;
  }
  .dr-fb-card .dr-fb-sub {
    color: #6b7280;
    font-size: 14px;
    margin: 0 0 18px;
    line-height: 1.5;
  }
  .dr-fb-card label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: #374151;
    margin-bottom: 6px;
  }
  .dr-fb-card select,
  .dr-fb-card textarea {
    width: 100%;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 10px 12px;
    font-size: 14px;
    font-family: inherit;
    color: #1a1a1a;
    background: #ffffff;
    margin-bottom: 14px;
    outline: none;
    box-sizing: border-box;
  }
  .dr-fb-card select:focus,
  .dr-fb-card textarea:focus { border-color: #2563eb; }
  .dr-fb-card textarea { resize: vertical; min-height: 110px; line-height: 1.5; }

  .dr-fb-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    margin-top: 4px;
  }
  .dr-fb-btn {
    padding: 10px 18px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    font-family: inherit;
  }
  .dr-fb-btn-cancel {
    background: #ffffff;
    color: #4b5563;
    border: 1px solid #e5e7eb;
  }
  .dr-fb-btn-cancel:hover { background: #f9fafb; }
  .dr-fb-btn-send {
    background: #2563eb;
    color: #ffffff;
  }
  .dr-fb-btn-send:hover { background: #1d4ed8; }
  .dr-fb-btn-send:disabled { opacity: 0.6; cursor: not-allowed; }

  .dr-fb-success {
    background: #ecfdf5;
    color: #065f46;
    border: 1px solid #a7f3d0;
    border-radius: 10px;
    padding: 16px;
    font-size: 14px;
    line-height: 1.5;
  }
  .dr-fb-error {
    background: #fef2f2;
    color: #991b1b;
    border: 1px solid #fecaca;
    border-radius: 10px;
    padding: 12px;
    font-size: 13px;
    margin-bottom: 12px;
  }

  @media (max-width: 480px) {
    .dr-fb-trigger { padding: 8px 12px; font-size: 11px; bottom: 16px; left: 16px; }
    .dr-fb-card { padding: 22px; }
  }
`
document.head.appendChild(style)

// Кнопка и модалка (отдельный контейнер, не лезем в DOM приложения)
const root = document.createElement('div')
root.id = 'dr-fb-root'
root.innerHTML = `
  <button class="dr-fb-trigger" type="button" aria-label="Обратная связь">💬 Обратная связь</button>
  <div class="dr-fb-overlay" role="dialog" aria-modal="true">
    <div class="dr-fb-card">
      <h3>Обратная связь</h3>
      <p class="dr-fb-sub">Нашли ошибку, неточность в формулировке или хотите предложить улучшение? Опишите — увидим и исправим.</p>
      <div class="dr-fb-error" style="display:none"></div>
      <div class="dr-fb-content">
        <label for="dr-fb-category">Тип сообщения</label>
        <select id="dr-fb-category">
          <option value="bug">Баг / что-то не работает</option>
          <option value="content">Контент / формулировка</option>
          <option value="feature">Предложение / улучшение</option>
          <option value="other">Другое</option>
        </select>
        <label for="dr-fb-message">Опишите подробнее</label>
        <textarea id="dr-fb-message" placeholder="Что произошло или что хочется?" required></textarea>
        <div class="dr-fb-actions">
          <button class="dr-fb-btn dr-fb-btn-cancel" type="button">Отмена</button>
          <button class="dr-fb-btn dr-fb-btn-send" type="button">Отправить</button>
        </div>
      </div>
    </div>
  </div>
`
document.body.appendChild(root)

const trigger = root.querySelector('.dr-fb-trigger')
const overlay = root.querySelector('.dr-fb-overlay')
const card = root.querySelector('.dr-fb-card')
const content = root.querySelector('.dr-fb-content')
const errorBox = root.querySelector('.dr-fb-error')
const categoryEl = root.querySelector('#dr-fb-category')
const messageEl = root.querySelector('#dr-fb-message')
const sendBtn = root.querySelector('.dr-fb-btn-send')
const cancelBtn = root.querySelector('.dr-fb-btn-cancel')

function openModal() {
  errorBox.style.display = 'none'
  overlay.classList.add('open')
  setTimeout(() => messageEl.focus(), 80)
}
function closeModal() {
  overlay.classList.remove('open')
  // Сброс на следующий раз, кроме случая если уже показан success
  if (content.style.display === 'none') {
    setTimeout(() => {
      messageEl.value = ''
      content.style.display = 'block'
      const successEl = card.querySelector('.dr-fb-success')
      if (successEl) successEl.remove()
    }, 300)
  } else {
    messageEl.value = ''
  }
}

trigger.addEventListener('click', openModal)
cancelBtn.addEventListener('click', closeModal)
overlay.addEventListener('click', e => { if (e.target === overlay) closeModal() })
document.addEventListener('keydown', e => { if (e.key === 'Escape' && overlay.classList.contains('open')) closeModal() })

sendBtn.addEventListener('click', async () => {
  const message = messageEl.value.trim()
  if (!message) {
    messageEl.focus()
    return
  }

  errorBox.style.display = 'none'
  sendBtn.disabled = true
  sendBtn.textContent = 'Отправляем…'

  const { data: { session } } = await sb.auth.getSession()

  const { error } = await sb.from('feedback').insert({
    user_id: session?.user?.id || null,
    category: categoryEl.value,
    app_name: detectAppName(),
    message,
    user_agent: navigator.userAgent.slice(0, 500)
  })

  sendBtn.disabled = false
  sendBtn.textContent = 'Отправить'

  if (error) {
    errorBox.textContent = 'Не удалось отправить: ' + error.message
    errorBox.style.display = 'block'
    return
  }

  // Успех — заменяем содержимое благодарностью
  content.style.display = 'none'
  const success = document.createElement('div')
  success.className = 'dr-fb-success'
  success.innerHTML = '✓ Спасибо! Сообщение получено. Если нужен ответ — продублируйте свой email в тексте.'
  card.appendChild(success)
  setTimeout(closeModal, 3000)
})
