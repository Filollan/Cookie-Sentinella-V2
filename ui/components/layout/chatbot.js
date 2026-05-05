// ui/components/layout/chatbot.js
// Chatbot flotante global integrado con Chatbase (iframe en modal)

import i18n from '../../../utils/i18n.js';

const CHATBASE_IFRAME_URL = 'https://www.chatbase.co/chatbot-iframe/Au5_7fF9fgcmrNBJY_m0a';

export function initFloatingChatbot() {
  if (document.getElementById('csbotWidget')) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  const currentPath = window.location.pathname;
  const isSubfolder = currentPath.includes('/notification/') || currentPath.includes('/config/') || currentPath.includes('/help/');
  link.href = isSubfolder ? '../components/layout/chatbot.css' : './components/layout/chatbot.css';
  document.head.appendChild(link);

  const widget = document.createElement('div');
  widget.id = 'csbotWidget';
  widget.innerHTML = `
    <button id="csbotFab" class="csbot-fab" aria-label="Abrir chat de soporte" title="Soporte" data-tooltip-i18n="supportChatTooltip">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    </button>

    <div id="chatbotModal" class="chatbot-modal" style="display: none;">
      <div class="chatbot-overlay"></div>
      <div id="csbotPanel" class="chatbot-container" role="dialog" aria-modal="true" aria-labelledby="chatbotTitle">
        <div class="chatbot-header">
          <h4 id="chatbotTitle">Chat de Soporte</h4>
          <button id="closeChatbot" class="close-btn" aria-label="Cerrar chat" title="Cerrar chat" data-tooltip-i18n="closeChatTooltip">&times;</button>
        </div>
        <div class="chatbot-content" id="chatbotContent">
          <iframe
            id="chatbotFrame"
            src=""
            width="100%"
            height="100%"
            allow="clipboard-read; clipboard-write; microphone"
            style="border: none; border-radius: 0 0 20px 20px;"
            title="Chatbot de Soporte">
          </iframe>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(widget);

  const modal = document.getElementById('chatbotModal');
  const panel = document.getElementById('csbotPanel');
  const fab = document.getElementById('csbotFab');
  const closeBtn = document.getElementById('closeChatbot');
  const overlay = modal?.querySelector('.chatbot-overlay');
  const titleEl = document.getElementById('chatbotTitle');

  const updateTranslations = () => {
    try {
      titleEl.textContent = i18n.t('supportChat') || 'Chat de Soporte';
      const supportTooltip = i18n.t('supportChatTooltip') || i18n.t('supportChat') || 'Chat de Soporte';
      const closeTooltip = i18n.t('closeChatTooltip') || 'Cerrar chat';
      fab.setAttribute('aria-label', supportTooltip);
      fab.setAttribute('title', supportTooltip);
      closeBtn.setAttribute('aria-label', closeTooltip);
      closeBtn.setAttribute('title', closeTooltip);
    } catch (e) {
      console.warn("Traducciones no listas aún");
    }
  };

  const openChat = () => {
    const frame = document.getElementById('chatbotFrame');
    const contentBox = document.getElementById('chatbotContent');
    
    if (frame && !frame.src.includes('chatbase.co')) {
      frame.src = CHATBASE_IFRAME_URL;
      // Ocultar el spinner cuando el iframe cargue
      frame.onload = () => {
        if (contentBox) contentBox.classList.add('loaded');
        frame.style.background = '#ffffff';
      };
    }
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    // Pequeño delay para asegurar que la transición CSS funcione al abrir
    setTimeout(() => {
      modal.classList.add('active');
    }, 10);
  };

  const closeChat = () => {
    modal.classList.remove('active');
    
    // Esperar a que termine la animación antes de ocultar
    setTimeout(() => {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }, 300);
  };

  fab.addEventListener('click', () => {
    if (modal.style.display === 'none') {
      openChat();
    } else {
      closeChat();
    }
  });

  closeBtn.addEventListener('click', closeChat);
  overlay?.addEventListener('click', closeChat);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && modal.style.display !== 'none') {
      closeChat();
    }
  });

  if (chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'languageUpdated') {
        updateTranslations();
        sendResponse({ success: true });
      }
    });
  }

  updateTranslations();

  // Compatibilidad con código previo que consulta la visibilidad del panel
  panel.style.display = 'flex';
}
