// utils/i18n.js - Sistema de internacionalización completo

class I18n {
  constructor() {
    this.currentLanguage = 'es';
    this.translations = {
      es: {
        // Header
        appName: 'CookieSentinella',
        
        // Estados principales
        protectionActive: 'Protección activa',
        protectionInactive: 'Protección inactiva',
        sessionActive: '🟢 Sesión activa',
        sessionInactive: '🔴 Sesión inactiva',
        loadingStatus: 'Cargando estado...',
        verifyingSession: 'Verificando sesión...',
        
        // Botones principales
        activateProtection: 'Activar protección',
        deactivateProtection: 'Desactivar protección',
        cleanSession: 'Limpiar Sesión',
        cleaning: 'Limpiando...',
        cleanupCompleted: '¡Limpieza completada!',
        cleanupError: 'Error en limpieza',
        
        // Navegación
        inicio: 'Inicio',
        notifications: 'Notificaciones',
        configuration: 'Configuración',
        help: 'Ayuda',
        
        // Página de Notificaciones
        protectedCookies: 'Cookies protegidas',
        xssAttempts: 'Intentos de XSS',
        fingerprintChanges: 'Cambios de fingerprint',
        exportAttempts: 'Intentos de exportación',
        recentEvents: 'Eventos Recientes',
        clearRecentEvents: 'Borrar eventos',
        recentEventsCleared: '¡Eventos recientes borrados!',
        
        // Página de Configuración
        language: 'Idioma',
        spanish: 'ES Español',
        english: 'EN English',
        
        // Limpiar notificaciones
        clearSystemNotifications: 'Limpiar notificaciones del sistema',
        clearSystemNotificationsDesc: 'Elimina todas las notificaciones persistentes de la barra del navegador.',
        clearSystemNotificationsBtn: 'Limpiar Notificaciones',
        notificationsCleared: '¡Notificaciones limpiadas exitosamente!',
        
        // Página de Ayuda
        faq: 'Preguntas frecuentes',
        support: 'Soporte',
        reportProblem: 'Informar de un problema',
        faqAlert: 'Aquí irán las preguntas frecuentes (FAQ).',
        reportAlert: 'Formulario de reporte en construcción.',
        reportNameLabel: 'Tu Nombre:',
        reportDescLabel: 'Descripción del Problema:',
        reportSubmitBtn: 'Enviar Reporte',
        // FAQ estático
        faqQ1: '¿Qué hace CookieSentinella?',
        faqA1: 'Protege tus cookies de sesión de Moodle con encriptación avanzada y detecta intentos de manipulación. Aplica configuraciones de seguridad (Secure, HttpOnly, SameSite) y monitorea cambios sospechosos en tiempo real.',
        faqQ2: '¿Cómo funciona la protección?',
        faqA2: 'Una vez activada, encripta las cookies, aplica los flags de seguridad (Secure, HttpOnly, SameSite=Strict) y monitorea cualquier cambio no autorizado, bloqueándolo automáticamente.',
        faqQ3: '¿Qué hace "Limpiar Sesión"?',
        faqA3: 'Elimina todas las cookies de sesión de Moodle y desactiva la protección de forma segura. Esto cerrará tu sesión activa en la plataforma.',
        faqQ4: '¿Qué son los intentos de XSS?',
        faqA4: 'Son ataques de tipo Cross-Site Scripting: código malicioso que intenta robar tu cookie de sesión. CookieSentinella los detecta y bloquea automáticamente, registrando cada intento en Notificaciones.',
        faqQ5: '¿La extensión envía mis datos a algún servidor?',
        faqA5: 'No. Toda la protección funciona localmente en tu navegador. No se envía ninguna cookie ni dato personal a servidores externos.',
        
        // Notificaciones del sistema
        protectionActiveNotif: 'CookieSentinella — Protección activa',
        protectionMessage: 'Sesión segura: cookies blindadas (Secure/HttpOnly/SameSite), bloqueo XSS y alerta por cambios sospechosos.\nLimpieza automática al cerrar sesión.',
        cleanupNotif: 'CookieSentinella — Limpieza completada',
        cleanupMessage: 'Cookies de sesión eliminadas y protección desactivada.',
        cookieTamperingTitle: 'Cookie Tampering Detected',
        cookieTamperingMessage: 'Unauthorized change in MoodleSession cookie',
        fingerprintChangedTitle: 'Device Fingerprint Changed',
        fingerprintChangedMessage: 'Significant changes detected in device fingerprint.',
        xssAttemptTitle: 'XSS Attempt Detected',
        
        // Errores
        errorLoadingStatus: 'Error al cargar estado',
        errorLoadingStats: 'Error al cargar las estadísticas de notificaciones',
        
        // Eventos de notificaciones
        sessionProtected: 'Sesión protegida exitosamente',
        sessionClosed: 'Sesión cerrada y cookies limpiadas',
        
        // Estados de sesión
        success: 'éxito',
        info: 'información',
        warning: 'advertencia',
        error: 'error',
        
        // Chatbot
        supportChat: 'Chat de Soporte',
        chatOnline: 'En línea',
        chatPlaceholder: 'Escribe un mensaje...',
        loadingChat: 'Cargando chat...',
        chatNotAvailable: 'Chat no disponible temporalmente',
        chatError: 'Error al cargar el chat',
        chatErrorMessage: 'No se pudo conectar con el servicio de chat. Por favor, intenta más tarde o contacta soporte por email.',
        retryChat: 'Reintentar',

        // Tooltips
        toggleProtectionTooltip: 'Activa o desactiva la protección automática de cookies y alertas.',
        activateProtectionTooltip: 'Enciende el blindaje de cookies y las alertas de seguridad.',
        deactivateProtectionTooltip: 'Apaga temporalmente el blindaje de cookies y las notificaciones de seguridad.',
        cleanSessionTooltip: 'Elimina las cookies de sesión Moodle y limpia el estado actual.',
        homeTooltip: 'Abre el panel principal de estado de CookieSentinella.',
        notificationsTooltip: 'Muestra estadísticas, eventos recientes y patrones detectados.',
        configurationTooltip: 'Abre las opciones de idioma y limpieza de notificaciones.',
        helpTooltip: 'Abre preguntas frecuentes, soporte y reporte de problemas.',
        languageSelectTooltip: 'Selecciona el idioma de la interfaz.',
        spanishOptionTooltip: 'Cambiar la interfaz a español.',
        englishOptionTooltip: 'Cambiar la interfaz a inglés.',
        clearSystemNotificationsTooltip: 'Borra las notificaciones persistentes de CookieSentinella en el navegador.',
        clearRecentEventsTooltip: 'Elimina el historial reciente mostrado en este panel.',
        faqTooltip: 'Muestra u oculta las preguntas frecuentes.',
        faqQuestionTooltip: 'Haz clic para ver u ocultar la respuesta.',
        supportTooltip: 'Abre el chat de soporte de CookieSentinella.',
        reportProblemTooltip: 'Muestra u oculta el formulario para reportar un problema.',
        reportSubmitTooltip: 'Envía el reporte del problema al equipo de soporte.',
        supportChatTooltip: 'Abre el chat flotante de soporte.',
        closeChatTooltip: 'Cierra el chat de soporte.'
      },
      
      en: {
        // Header
        appName: 'CookieSentinella',
        
        // Main states
        protectionActive: 'Protection active',
        protectionInactive: 'Protection inactive',
        sessionActive: '🟢 Active session',
        sessionInactive: '🔴 Inactive session',
        loadingStatus: 'Loading status...',
        verifyingSession: 'Verifying session...',
        
        // Main buttons
        activateProtection: 'Activate protection',
        deactivateProtection: 'Deactivate protection',
        cleanSession: 'Clean Session',
        cleaning: 'Cleaning...',
        cleanupCompleted: 'Cleanup completed!',
        cleanupError: 'Cleanup error',
        
        // Navigation
        inicio: 'Home',
        notifications: 'Notifications',
        configuration: 'Configuration',
        help: 'Help',
        
        // Notifications Page
        protectedCookies: 'Protected cookies',
        xssAttempts: 'XSS attempts',
        fingerprintChanges: 'Fingerprint changes',
        exportAttempts: 'Export attempts',
        recentEvents: 'Recent Events',
        clearRecentEvents: 'Clear events',
        recentEventsCleared: 'Recent events cleared!',
        
        // Configuration Page
        language: 'Language',
        spanish: 'ES Spanish',
        english: 'EN English',
        
        // Clean notifications
        clearSystemNotifications: 'Clear system notifications',
        clearSystemNotificationsDesc: 'Removes all persistent notifications from your browser.',
        clearSystemNotificationsBtn: 'Clear Notifications',
        notificationsCleared: 'Notifications cleared successfully!',
        
        // Help Page
        faq: 'Frequently Asked Questions',
        support: 'Support',
        reportProblem: 'Report a problem',
        faqAlert: 'Frequently Asked Questions (FAQ) will be here.',
        reportAlert: 'Report form under construction.',
        reportNameLabel: 'Your Name:',
        reportDescLabel: 'Problem Description:',
        reportSubmitBtn: 'Send Report',
        // Static FAQ
        faqQ1: 'What does CookieSentinella do?',
        faqA1: 'Protects your Moodle session cookies with advanced encryption and detects tampering. Applies security settings (Secure, HttpOnly, SameSite) and monitors suspicious changes in real time.',
        faqQ2: 'How does the protection work?',
        faqA2: 'Once activated, it encrypts cookies, applies security flags (Secure, HttpOnly, SameSite=Strict) and monitors any unauthorized changes, blocking them automatically.',
        faqQ3: 'What does "Clean Session" do?',
        faqA3: 'Deletes all Moodle session cookies and deactivates protection safely. This will close your active session on the platform.',
        faqQ4: 'What are XSS attempts?',
        faqA4: 'Cross-Site Scripting attacks: malicious code that tries to steal your session cookie. CookieSentinella detects and blocks them automatically, logging each attempt in Notifications.',
        faqQ5: 'Does the extension send my data to any server?',
        faqA5: 'No. All protection works locally in your browser. No cookies or personal data are sent to external servers.',
        
        // System notifications
        protectionActiveNotif: 'CookieSentinella — Active Protection',
        protectionMessage: 'Secure session: armored cookies (Secure/HttpOnly/SameSite), XSS blocking and suspicious change alerts.\nAutomatic cleanup on logout.',
        cleanupNotif: 'CookieSentinella — Cleanup Completed',
        cleanupMessage: 'Session cookies deleted and protection disabled.',
        cookieTamperingTitle: 'Cookie Tampering Detected',
        cookieTamperingMessage: 'Unauthorized change in MoodleSession cookie',
        fingerprintChangedTitle: 'Device Fingerprint Changed',
        fingerprintChangedMessage: 'Significant changes detected in device fingerprint.',
        xssAttemptTitle: 'XSS Attempt Detected',
        
        // Errors
        errorLoadingStatus: 'Error loading status',
        errorLoadingStats: 'Error loading notification statistics',
        
        // Notification events
        sessionProtected: 'Session successfully protected',
        sessionClosed: 'Session closed and cookies cleaned',
        
        // Session states
        success: 'success',
        info: 'info',
        warning: 'warning',
        error: 'error',

        // Chatbot
        supportChat: 'Support Chat',
        chatOnline: 'Online',
        chatPlaceholder: 'Type a message...',
        loadingChat: 'Loading chat...',
        chatNotAvailable: 'Chat temporarily unavailable',
        chatError: 'Error loading chat',
        chatErrorMessage: 'Could not connect to chat service. Please try again later or contact support via email.',
        retryChat: 'Retry',

        // Tooltips
        toggleProtectionTooltip: 'Turn automatic cookie protection and alerts on or off.',
        activateProtectionTooltip: 'Turn on cookie hardening and security alerts.',
        deactivateProtectionTooltip: 'Temporarily turn off cookie hardening and security notifications.',
        cleanSessionTooltip: 'Delete Moodle session cookies and clear the current state.',
        homeTooltip: 'Open the main CookieSentinella status panel.',
        notificationsTooltip: 'Show statistics, recent events, and detected patterns.',
        configurationTooltip: 'Open language options and notification cleanup tools.',
        helpTooltip: 'Open FAQs, support, and problem reporting.',
        languageSelectTooltip: 'Select the interface language.',
        spanishOptionTooltip: 'Switch the interface to Spanish.',
        englishOptionTooltip: 'Switch the interface to English.',
        clearSystemNotificationsTooltip: 'Clear persistent CookieSentinella browser notifications.',
        clearRecentEventsTooltip: 'Delete the recent history shown in this panel.',
        faqTooltip: 'Show or hide frequently asked questions.',
        faqQuestionTooltip: 'Click to show or hide the answer.',
        supportTooltip: 'Open the CookieSentinella support chat.',
        reportProblemTooltip: 'Show or hide the problem report form.',
        reportSubmitTooltip: 'Send the problem report to the support team.',
        supportChatTooltip: 'Open the floating support chat.',
        closeChatTooltip: 'Close the support chat.'
      }
    };
    
    this.init();
  }
  
  async init() {
    // Cargar idioma guardado o detectar idioma del navegador
    const stored = await this.getStoredLanguage();
    if (stored) {
      this.currentLanguage = stored;
    } else {
      // Detectar idioma del navegador
      const browserLang = navigator.language.split('-')[0];
      this.currentLanguage = ['es', 'en'].includes(browserLang) ? browserLang : 'es';
      await this.saveLanguage(this.currentLanguage);
    }
  }
  
  async getStoredLanguage() {
    try {
      const result = await chrome.storage.local.get(['selectedLanguage']);
      return result.selectedLanguage;
    } catch (error) {
      console.error('Error getting stored language:', error);
      return null;
    }
  }
  
  async saveLanguage(lang) {
    try {
      await chrome.storage.local.set({ selectedLanguage: lang });
      this.currentLanguage = lang;
    } catch (error) {
      console.error('Error saving language:', error);
    }
  }
  
  t(key) {
    return this.translations[this.currentLanguage][key] || key;
  }
  
  getCurrentLanguage() {
    return this.currentLanguage;
  }
  
  async setLanguage(lang) {
    if (['es', 'en'].includes(lang)) {
      await this.saveLanguage(lang);
      return true;
    }
    return false;
  }
  
  // Método para traducir elementos del DOM automáticamente
  translatePage() {
    // Traducir elementos con atributo data-i18n
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.t(key);
      
      if (element.tagName === 'INPUT' && (element.type === 'button' || element.type === 'submit')) {
        element.value = translation;
      } else if (element.placeholder !== undefined) {
        element.placeholder = translation;
      } else {
        element.textContent = translation;
      }
    });
    
    this.initTooltips(document);
    
    // Actualizar título de la página si existe
    const titleElement = document.querySelector('title');
    if (titleElement && titleElement.hasAttribute('data-i18n')) {
      const key = titleElement.getAttribute('data-i18n');
      titleElement.textContent = this.t(key);
    }
  }
  
  getTooltipText(element) {
    const key = element.getAttribute('data-tooltip-i18n');
    if (key) return this.t(key);
    return element.dataset.tooltipText || element.getAttribute('data-tooltip') || element.getAttribute('aria-label') || '';
  }

  ensureTooltipElement() {
    let tooltip = document.getElementById('cookie-sentinella-tooltip');
    if (tooltip) return tooltip;

    tooltip = document.createElement('span');
    tooltip.id = 'cookie-sentinella-tooltip';
    tooltip.className = 'cs-tooltip-v2';
    tooltip.setAttribute('data-direction', 's');
    tooltip.setAttribute('data-component', 'Tooltip');
    tooltip.setAttribute('aria-hidden', 'true');
    tooltip.setAttribute('popover', 'auto');
    document.body.appendChild(tooltip);
    return tooltip;
  }

  showTooltip(element) {
    const message = this.getTooltipText(element);
    if (!message) return;

    const tooltip = this.ensureTooltipElement();
    tooltip.textContent = message;
    if (typeof tooltip.showPopover === 'function' && !tooltip.matches(':popover-open')) {
      tooltip.showPopover();
    }
    tooltip.classList.add('visible');
    tooltip.setAttribute('aria-hidden', 'false');

    const tooltipId = tooltip.id;
    element.setAttribute('aria-describedby', tooltipId);

    const targetRect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const gap = 2;
    const viewportPadding = 8;
    const anchorX = targetRect.left + (targetRect.width / 2);

    const top = targetRect.bottom + gap;
    let left = anchorX - (tooltipRect.width / 2);
    left = Math.max(viewportPadding, Math.min(left, window.innerWidth - tooltipRect.width - viewportPadding));

    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.setAttribute('data-direction', 's');
  }

  hideTooltip(element = null) {
    const tooltip = document.getElementById('cookie-sentinella-tooltip');
    if (!tooltip) return;

    tooltip.classList.remove('visible');
    tooltip.setAttribute('aria-hidden', 'true');
    if (typeof tooltip.hidePopover === 'function' && tooltip.matches(':popover-open')) {
      tooltip.hidePopover();
    }
    if (element) element.removeAttribute('aria-describedby');
  }

  initTooltips(root = document) {
    if (typeof document === 'undefined') return;

    const scope = root || document;
    const scopedElements = Array.from(scope.querySelectorAll('[data-tooltip-i18n], [data-tooltip]'));
    const tooltipElements = scope.matches?.('[data-tooltip-i18n], [data-tooltip]')
      ? [scope, ...scopedElements]
      : scopedElements;
    tooltipElements.forEach(element => {
      const message = this.getTooltipText(element);
      if (!message) return;

      element.dataset.tooltipText = message;
      element.removeAttribute('title');
      element.setAttribute('aria-label', message);

      if (element.dataset.tooltipBound === 'true') return;
      element.dataset.tooltipBound = 'true';

      element.addEventListener('pointerenter', () => this.showTooltip(element));
      element.addEventListener('focus', () => this.showTooltip(element));
      element.addEventListener('pointerleave', () => this.hideTooltip(element));
      element.addEventListener('blur', () => this.hideTooltip(element));
      element.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') this.hideTooltip(element);
      });
    });
  }

  // Método para obtener todas las traducciones de un idioma
  getAllTranslations(lang = null) {
    const language = lang || this.currentLanguage;
    return this.translations[language] || {};
  }
}

// Instancia global
const i18n = new I18n();

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
  module.exports = i18n;
}

// Exportar para uso en extensiones de Chrome
if (typeof window !== 'undefined') {
  window.i18n = i18n;
}

export default i18n;