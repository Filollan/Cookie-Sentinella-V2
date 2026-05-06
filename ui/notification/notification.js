// ui/notification/notification.js - Notificaciones con sistema de idiomas

import { loadLayout } from '../components/layout/layout.js';
import i18n from '../../utils/i18n.js';
import { getIcon } from '../utils/lucideIcons.js';

// Cargar layout con la pestaña "notificaciones" activa
loadLayout('notificaciones');

// Espera a que el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
  // Inicializar i18n
  await i18n.init();
  
  // Referencias a los contadores en las tarjetas
  const protectedCookiesCount = document.getElementById('protectedCookiesCount');
  const xssAttemptsCount = document.getElementById('xssAttemptsCount');
  const fingerprintChangesCount = document.getElementById('fingerprintChangesCount');
  const exportAttemptsCount = document.getElementById('exportAttemptsCount');
  const threatAlertsCount = document.getElementById('threatAlertsCount');

  // Función para animar los números
  function animateCounter(element, targetValue) {
    const duration = 1000; // 1 segundo
    const startValue = parseInt(element.textContent) || 0;
    const increment = (targetValue - startValue) / (duration / 16);
    let currentValue = startValue;

    const animate = () => {
      currentValue += increment;
      if ((increment > 0 && currentValue >= targetValue) || 
          (increment < 0 && currentValue <= targetValue)) {
        element.textContent = targetValue;
        return;
      }
      element.textContent = Math.floor(currentValue);
      requestAnimationFrame(animate);
    };

    animate();
  }

  // Función para traducir la página
  function translateNotificationPage() {
    // Traducir título principal
    const mainTitle = document.querySelector('h4');
    if (mainTitle) mainTitle.textContent = i18n.t('notifications');
    
    // Traducir etiquetas de las tarjetas
    const cardLabels = document.querySelectorAll('.notification-text p');
    if (cardLabels.length >= 5) {
      cardLabels[0].textContent = i18n.t('protectedCookies');
      cardLabels[1].textContent = i18n.t('xssAttempts');
      cardLabels[2].textContent = i18n.t('fingerprintChanges');
      cardLabels[3].textContent = i18n.t('exportAttempts');
      cardLabels[4].textContent = 'Patrones de amenaza detectados';
    }
  }

  // Función para cargar y mostrar estadísticas
  async function loadNotificationStats() {
    try {
      // Solicitar estadísticas al background script
      const stats = await chrome.runtime.sendMessage({ action: 'getNotificationStats' });

      // Animar los contadores
      animateCounter(protectedCookiesCount, stats.protectedCookies);
      animateCounter(xssAttemptsCount, stats.xssAttempts);
      animateCounter(fingerprintChangesCount, stats.fingerprintChanges);
      animateCounter(exportAttemptsCount, stats.exportAttempts);
      animateCounter(threatAlertsCount, stats.threatAlerts || 0);

      // Mostrar eventos recientes si los hay
      if (stats.recentEvents && stats.recentEvents.length > 0) {
        displayRecentEvents(stats.recentEvents);
      }

      displayActivePatterns(stats.activePatterns || []);

    } catch (error) {
      console.error('Error al cargar las estadísticas de notificaciones:', error);
      
      // Valores por defecto en caso de error
      protectedCookiesCount.textContent = '0';
      xssAttemptsCount.textContent = '0';
      fingerprintChangesCount.textContent = '0';
      exportAttemptsCount.textContent = '0';
      threatAlertsCount.textContent = '0';
    }
  }

  function displayActivePatterns(patterns) {
    const list = document.getElementById('activePatternsList');
    if (!list) return;

    list.innerHTML = '';

    const recent = patterns.slice(0, 8);
    if (!recent.length) {
      const empty = document.createElement('span');
      empty.className = 'pattern-chip';
      empty.textContent = 'Sin actividad reciente';
      list.appendChild(empty);
      return;
    }

    recent.forEach((pattern) => {
      const chip = document.createElement('span');
      chip.className = 'pattern-chip';
      chip.textContent = pattern.replaceAll('_', ' ');
      list.appendChild(chip);
    });
  }

  // Función para mostrar eventos recientes
  function displayRecentEvents(events) {
    // Crear contenedor de eventos si no existe
    let eventsContainer = document.getElementById('recentEvents');
    if (!eventsContainer) {
      eventsContainer = document.createElement('div');
      eventsContainer.id = 'recentEvents';
      eventsContainer.className = 'recent-events';
      
      const headerContainer = document.createElement('div');
      headerContainer.style.display = 'flex';
      headerContainer.style.justifyContent = 'space-between';
      headerContainer.style.alignItems = 'center';
      headerContainer.style.margin = '24px 0 16px 0';

      const title = document.createElement('h4');
      title.id = 'recentEventsTitle';
      title.textContent = i18n.t('recentEvents');
      title.style.margin = '0';
      title.style.fontSize = '1.2rem';
      title.style.color = '#1f2937';
      
      const clearBtn = document.createElement('button');
      clearBtn.id = 'clearRecentEventsBtn';
      clearBtn.className = 'btn-clear-action';
      clearBtn.title = i18n.t('clearRecentEventsTooltip');
      clearBtn.setAttribute('aria-label', i18n.t('clearRecentEventsTooltip'));
      clearBtn.setAttribute('data-tooltip-i18n', 'clearRecentEventsTooltip');
      clearBtn.style.padding = '6px 14px';
      clearBtn.style.fontSize = '0.85rem';
      clearBtn.innerHTML = `
        ${getIcon('Trash2')}
        <span>${i18n.t('clearRecentEvents')}</span>
      `;
      
      clearBtn.addEventListener('click', async () => {
        clearBtn.disabled = true;
        const originalHtml = clearBtn.innerHTML;
        clearBtn.innerHTML = getIcon('LoaderCircle');
        clearBtn.querySelector('svg')?.classList.add('animate-spin');
        
        try {
          await chrome.runtime.sendMessage({ action: 'clearRecentEvents' });
          eventsContainer.innerHTML = '';
          
          // Show confirmation
          const confirmation = document.createElement('div');
          confirmation.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: #10b981; color: white; padding: 16px 24px; border-radius: 12px;
            font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
            z-index: 1000; animation: fadeInOut 2s ease-in-out;
          `;
          confirmation.innerHTML = `${getIcon('CheckCircle')}<span>${i18n.t('recentEventsCleared')}</span>`;
          document.body.appendChild(confirmation);
          setTimeout(() => document.body.removeChild(confirmation), 2000);
          
          loadNotificationStats(); // Recargar datos
        } catch (error) {
          console.error('Error clearing events:', error);
        } finally {
          setTimeout(() => {
            clearBtn.disabled = false;
            clearBtn.innerHTML = originalHtml;
          }, 800);
        }
      });
      
      headerContainer.appendChild(title);
      headerContainer.appendChild(clearBtn);
      
      // Insertar después de las tarjetas principales
      const container = document.querySelector('.popup-container.notification-container');
      container.appendChild(headerContainer);
      container.appendChild(eventsContainer);
    }

    const recentEventsTitle = document.getElementById('recentEventsTitle');
    if (recentEventsTitle) recentEventsTitle.textContent = i18n.t('recentEvents');

    const clearRecentEventsBtn = document.getElementById('clearRecentEventsBtn');
    if (clearRecentEventsBtn) {
      const tooltip = i18n.t('clearRecentEventsTooltip');
      clearRecentEventsBtn.title = tooltip;
      clearRecentEventsBtn.setAttribute('aria-label', tooltip);
      const label = clearRecentEventsBtn.querySelector('span');
      if (label) label.textContent = i18n.t('clearRecentEvents');
      i18n.initTooltips(clearRecentEventsBtn.parentElement || document);
    }

    // Limpiar eventos anteriores
    eventsContainer.innerHTML = '';

    // Mostrar últimos 5 eventos
    events.slice(0, 5).forEach(event => {
      const eventCard = document.createElement('div');
      eventCard.className = 'event-card';
      
      const eventTime = new Date(event.timestamp).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });
      
      let iconClass = 'blue';
      let iconName = 'ClipboardList';
      
      switch (event.type) {
        case 'session_protected':
          iconClass = 'green';
          iconName = 'ShieldCheck';
          break;
        case 'session_cleanup':
          iconClass = 'yellow';
          iconName = 'Trash2';
          break;
        case 'xss_attempt':
          iconClass = 'red';
          iconName = 'ShieldAlert';
          break;
        case 'fingerprint_change':
          iconClass = 'blue';
          iconName = 'Fingerprint';
          break;
        case 'threat_alert':
          iconClass = 'purple';
          iconName = 'Brain';
          break;
      }

      // Traducir el mensaje del evento
      let eventMessage = event.message;
      if (event.type === 'session_protected') {
        eventMessage = i18n.t('sessionProtected');
      } else if (event.type === 'session_cleanup') {
        eventMessage = i18n.t('sessionClosed');
      }

      eventCard.innerHTML = `
        <div class="notification-icon small ${iconClass}">${getIcon(iconName)}</div>
        <div class="event-text">
          <span class="event-message">${eventMessage}</span>
          <span class="event-time">${eventTime}</span>
        </div>
      `;

      eventsContainer.appendChild(eventCard);
    });
  }

  // Inicializar traducciones
  translateNotificationPage();
  
  // Cargar estadísticas iniciales
  await loadNotificationStats();

  // Actualizar estadísticas cada 10 segundos
  setInterval(loadNotificationStats, 10000);

  // Escuchar mensajes del background script para actualizaciones en tiempo real
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'stats_updated') {
      loadNotificationStats();
    } else if (message.action === 'languageUpdated') {
      translateNotificationPage();
      loadNotificationStats(); // Recargar para traducir eventos
      sendResponse({ success: true });
    }
  });
});
