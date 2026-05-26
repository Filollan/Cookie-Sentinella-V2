(function() {
  'use strict';

  const COOKIE_NAME = 'MoodleSession';
  let sessionActive = false;


  const CENTER_ALERT_ID = 'cookie-sentinella-center-alert';
  let centerAlertTimer = null;

  function getAlertPalette(level = 'info') {
    if (level === 'danger') return { accent: '#ef4444', glow: 'rgba(239, 68, 68, 0.35)' };
    if (level === 'warning') return { accent: '#f59e0b', glow: 'rgba(245, 158, 11, 0.35)' };
    if (level === 'success') return { accent: '#10b981', glow: 'rgba(16, 185, 129, 0.35)' };
    return { accent: '#3b82f6', glow: 'rgba(59, 130, 246, 0.35)' };
  }

  function showCenteredAlert(payload = {}) {
    const title = payload.title || 'CookieSentinella';
    const message = payload.message || 'Se detectó un evento de seguridad.';
    const level = payload.level || 'warning';
    const durationMs = Math.max(3000, Math.min(15000, Number(payload.durationMs) || 7000));
    const palette = getAlertPalette(level);

    const existing = document.getElementById(CENTER_ALERT_ID);
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = CENTER_ALERT_ID;
    overlay.setAttribute('role', 'alertdialog');
    overlay.setAttribute('aria-live', 'assertive');
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      background: rgba(15, 23, 42, 0.55);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
      backdrop-filter: blur(2px);
    `;

    const card = document.createElement('div');
    card.style.cssText = `
      width: min(560px, 100%);
      border-radius: 18px;
      background: #ffffff;
      color: #111827;
      padding: 24px;
      border: 2px solid ${palette.accent};
      box-shadow: 0 22px 64px ${palette.glow};
      font-family: Inter, system-ui, -apple-system, sans-serif;
      text-align: left;
    `;

    card.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px;">
        <h3 style="margin:0;font-size:1.1rem;line-height:1.4;color:${palette.accent};font-weight:800;">${title}</h3>
        <button id="cookie-sentinella-center-alert-close" aria-label="Cerrar" style="border:0;background:#f3f4f6;color:#111827;width:32px;height:32px;border-radius:9999px;cursor:pointer;font-size:18px;line-height:1;">×</button>
      </div>
      <p style="margin:0;font-size:0.98rem;line-height:1.55;color:#1f2937;white-space:pre-line;">${message}</p>
      <p style="margin:14px 0 0;font-size:0.78rem;color:#6b7280;">Esta alerta se muestra al centro para asegurar su visibilidad.</p>
    `;

    overlay.appendChild(card);
    document.documentElement.appendChild(overlay);

    const dismiss = () => {
      if (centerAlertTimer) {
        clearTimeout(centerAlertTimer);
        centerAlertTimer = null;
      }
      overlay.remove();
    };

    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) dismiss();
    });
    card.querySelector('#cookie-sentinella-center-alert-close')?.addEventListener('click', dismiss);

    centerAlertTimer = setTimeout(dismiss, durationMs);
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.action === 'showCenteredNotification') {
      showCenteredAlert(message.payload || {});
      sendResponse({ success: true });
    }
  });

  // Detectar elementos de sesión
  function checkSessionStatus() {
    if (document.readyState === 'loading') return;

    const hasUserMenu = document.querySelector('.usermenu, .userpicture');
    const isPostLoginPage = ['/my/', '/user/profile.php'].some(path => 
      window.location.pathname.includes(path)
    );

    const newSessionStatus = hasUserMenu || isPostLoginPage;

    if (newSessionStatus && !sessionActive) {
      chrome.runtime.sendMessage({ action: 'sessionStart' });
      sessionActive = true;
    } else if (!newSessionStatus && sessionActive) {
      chrome.runtime.sendMessage({ action: 'sessionEnd' });
      sessionActive = false;
    }
  }

  // Configurar observador solo si document.body existe
  function setupObserver() {
    if (!document.body) {
      setTimeout(setupObserver, 100);
      return;
    }

    try {
      const observer = new MutationObserver(() => {
        checkSessionStatus();
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    } catch (error) {
      console.error('Error configurando observer:', error);
    }
  }

  // Inicializar
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      checkSessionStatus();
      setupObserver();
    });
  } else {
    checkSessionStatus();
    setupObserver();
  }
})();