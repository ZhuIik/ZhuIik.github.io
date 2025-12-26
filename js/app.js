// ===== helpers =====
function qs(selector) {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`Не найден элемент: ${selector}`);
  return el;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function setHint(el, text, type = "info") {
  // type: info | ok | error
  el.textContent = text;
  el.style.color =
    type === "error" ? "#b91c1c" :
    type === "ok" ? "#166534" :
    "";
}

function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function loadJson(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

// ===== keys =====
const LS_KEYS = {
  consult: "coursemind_consult_request_last",
  demo: "coursemind_demo_request_last",
};

// ===== validators =====
function isEmail(value) {
  // простая проверка, достаточно для учебного проекта
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isTelegramUsername(value) {
  // @username или username, латиница/цифры/подчёркивание, 5-32 символа
  const v = value.startsWith("@") ? value.slice(1) : value;
  return /^[a-zA-Z0-9_]{5,32}$/.test(v);
}

function channelLabel(ch) {
  return ch === "telegram" ? "Telegram" : ch === "email" ? "Email" : "—";
}

function roleLabel(role) {
  switch (role) {
    case "teacher": return "Преподаватель";
    case "student": return "Студент";
    case "admin": return "Администратор";
    default: return "—";
  }
}

// ===== consultation form =====
function initConsultForm() {
  const form = qs("#consultForm");
  const hint = qs("#consultHint");
  const result = qs("#consultResult");

  const contactInput = form.elements.contact;

  // подсказка placeholder по выбору канала
  form.addEventListener("change", () => {
    const channel = form.elements.channel.value;
    if (channel === "telegram") {
      contactInput.placeholder = "@username";
    } else if (channel === "email") {
      contactInput.placeholder = "name@example.com";
    }
  });

  // восстановление последней записи
  const saved = loadJson(LS_KEYS.consult);
  if (saved) {
    setHint(hint, "Есть сохранённая последняя запись на консультацию (localStorage).", "info");
    renderConsultResult(result, saved);
    result.hidden = false;
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    // 1) HTML5 валидация
    if (!form.checkValidity()) {
      form.reportValidity();
      setHint(hint, "Проверь поля формы — есть незаполненные или некорректные.", "error");
      return;
    }

    // 2) JS-валидация по каналу
    const channel = form.elements.channel.value;
    const contact = String(form.elements.contact.value).trim();

    if (channel === "telegram") {
      if (!isTelegramUsername(contact)) {
        setHint(hint, "Для Telegram укажи username: @username (латиница/цифры/_, 5–32 символа).", "error");
        return;
      }
    }

    if (channel === "email") {
      if (!isEmail(contact)) {
        setHint(hint, "Для Email укажи корректный адрес вида name@example.com.", "error");
        return;
      }
    }

    // 3) payload
    const payload = {
      role: form.elements.role.value,
      channel,
      contact,
      time: form.elements.time.value, // HH:MM
      comment: String(form.elements.comment.value).trim(),
      createdAt: new Date().toISOString(),
    };

    // 4) имитация отправки
    saveJson(LS_KEYS.consult, payload);
    renderConsultResult(result, payload);
    result.hidden = false;

    setHint(hint, "Запись принята (имитация). Данные сохранены в localStorage.", "ok");

    form.reset();
  });
}

function renderConsultResult(container, data) {
  container.innerHTML = `
    <h3 style="margin:0 0 8px;">Запись на консультацию принята</h3>
    <p style="margin:0 0 6px;"><strong>Роль:</strong> ${escapeHtml(roleLabel(data.role))}</p>
    <p style="margin:0 0 6px;"><strong>Канал:</strong> ${escapeHtml(channelLabel(data.channel))}</p>
    <p style="margin:0 0 6px;"><strong>Контакт:</strong> ${escapeHtml(data.contact)}</p>
    <p style="margin:0 0 6px;"><strong>Время:</strong> ${escapeHtml(data.time)}</p>
    <p style="margin:0;"><strong>Комментарий:</strong> ${escapeHtml(data.comment)}</p>
  `;
}

// ===== demo form =====
function initDemoForm() {
  const form = qs("#demoForm");
  const hint = qs("#demoHint");
  const result = qs("#demoResult");

  const saved = loadJson(LS_KEYS.demo);
  if (saved) {
    setHint(hint, "Есть сохранённая последняя заявка на демо (localStorage).", "info");
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      setHint(hint, "Проверь поля формы — есть незаполненные или некорректные.", "error");
      return;
    }

    const payload = {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      status: form.elements.status.value,
      message: form.elements.message.value.trim(),
      createdAt: new Date().toISOString(),
    };

    saveJson(LS_KEYS.demo, payload);
    renderDemoResult(result, payload);
    result.hidden = false;

    setHint(hint, "Заявка отправлена (имитация). Данные сохранены в localStorage.", "ok");
    form.reset();
  });
}

function statusLabel(status) {
  switch (status) {
    case "teacher": return "Преподаватель";
    case "student": return "Студент";
    case "admin": return "Администратор";
    default: return "—";
  }
}

function renderDemoResult(container, data) {
  container.innerHTML = `
    <h3 style="margin:0 0 8px;">Заявка принята</h3>
    <p style="margin:0 0 6px;"><strong>Имя:</strong> ${escapeHtml(data.name)}</p>
    <p style="margin:0 0 6px;"><strong>Email:</strong> ${escapeHtml(data.email)}</p>
    <p style="margin:0 0 6px;"><strong>Статус:</strong> ${escapeHtml(statusLabel(data.status))}</p>
    <p style="margin:0;"><strong>Сообщение:</strong> ${escapeHtml(data.message)}</p>
  `;
}

// ===== start =====
document.addEventListener("DOMContentLoaded", () => {
  initConsultForm();
  initDemoForm();
});
