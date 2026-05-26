(function() {
  'use strict';

  const COOKIE_NAME = 'MoodleSession';
  let sessionActive = false;

  function removeThreatOverlay() {
    const existing = document.getElementById('cs-centered-threat-overlay');
    if (existing) existing.remove();
  }

  function getFriendlyThreatCopy(severity) {
    if (severity === 'alto') {
      return {
        title: '⚠️ Detectamos un riesgo alto en esta página',
        message: 'Ya bloqueamos la amenaza para proteger tu cuenta. Te recomendamos limpiar tu sesión por seguridad y volver a ingresar.'
      };
    }

    return {
      title: '⚠️ Detectamos actividad sospechosa',
      message: 'La extensión te está protegiendo. Como medida adicional, puedes limpiar tu sesión ahora y continuar con más seguridad.'
    };
  }

  function showCenteredThreatAlert({ title, message, severity }) {
    removeThreatOverlay();

    const overlay = document.createElement('div');
    overlay.id = 'cs-centered-threat-overlay';
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.55);
      z-index: 2147483647;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: Inter, Arial, sans-serif;
    `;

    const card = document.createElement('div');
    const borderColor = severity === 'alto' ? '#ef4444' : '#f59e0b';
    card.style.cssText = `
      max-width: 520px;
      width: calc(100vw - 40px);
      background: #111827;
      color: #f9fafb;
      border: 2px solid ${borderColor};
      border-radius: 14px;
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.45);
      padding: 22px;
    `;

    const friendlyCopy = getFriendlyThreatCopy(severity);
    const safeTitle = friendlyCopy.title;
    const safeMessage = friendlyCopy.message;
    const technicalDetail = typeof message === 'string' && message.trim() ? message.trim() : '';

    card.innerHTML = `
      <h2 style="margin:0 0 10px;font-size:20px;line-height:1.2;">${safeTitle}</h2>
      <p style="margin:0 0 18px;font-size:15px;line-height:1.5;">${safeMessage}</p>
      ${technicalDetail ? `<p style="margin:0 0 18px;font-size:12px;line-height:1.4;color:#d1d5db;">Detalle detectado: ${technicalDetail}</p>` : ''}
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button id="cs-centered-threat-cleanup" style="background:${borderColor};color:white;border:none;border-radius:8px;padding:10px 14px;cursor:pointer;font-weight:600;">Limpiar sesión ahora</button>
        <button id="cs-centered-threat-ack" style="background:#374151;color:white;border:none;border-radius:8px;padding:10px 14px;cursor:pointer;font-weight:600;">Entendido</button>
      </div>
    `;

    overlay.appendChild(card);
    document.documentElement.appendChild(overlay);

    const closeButton = card.querySelector('#cs-centered-threat-ack');
    const cleanupButton = card.querySelector('#cs-centered-threat-cleanup');

    cleanupButton?.addEventListener('click', () => {
      chrome.runtime.sendMessage({ action: 'forceCleanup' }, () => {
        removeThreatOverlay();
      });
    });

    closeButton?.addEventListener('click', removeThreatOverlay);
  }

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

  chrome.runtime.onMessage.addListener((request) => {
    if (request?.action === 'showCenteredThreatAlert') {
      showCenteredThreatAlert(request.payload || {});
    }
  });

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
