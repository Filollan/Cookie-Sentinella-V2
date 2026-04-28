// ui/config/config.js - Configuración con sistema de idiomas completo

import { loadLayout } from '../components/layout/layout.js';
import i18n from '../../utils/i18n.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Cargar layout
  await loadLayout('configuración');
  
  // Esperar a que i18n se inicialice
  await i18n.init();
  
  // Referencias a elementos del DOM
  const languageSelect = document.getElementById('languageSelect');
  const currentLanguage = document.getElementById('currentLanguage');
  const languageOptions = document.getElementById('languageOptions');
  const languageOptionElements = document.querySelectorAll('.language-option');
  
  // Actualizar interfaz con idioma actual
  function updateLanguageInterface() {
    // Actualizar selector de idioma
    const currentLang = i18n.getCurrentLanguage();
    currentLanguage.textContent = i18n.t(currentLang === 'es' ? 'spanish' : 'english');
    
    // Traducir toda la página
    i18n.translatePage();
    
    // Actualizar opciones de idioma
    document.querySelector('[data-lang="es"]').textContent = i18n.t('spanish');
    document.querySelector('[data-lang="en"]').textContent = i18n.t('english');
    
    // Actualizar título de la sección
    const configTitle = document.querySelector('h3[data-i18n="configuration"]');
    if (configTitle) configTitle.textContent = i18n.t('configuration');
    
    const langTitle = document.querySelector('h3[data-i18n="language"]');
    if (langTitle) langTitle.textContent = i18n.t('language');
  }
  
  // Alternar visibilidad de opciones de idioma
  languageSelect.addEventListener('click', () => {
    const isVisible = languageOptions.style.display !== 'none';
    languageOptions.style.display = isVisible ? 'none' : 'block';
    
    // Rotar flecha
    const arrow = languageSelect.querySelector('.arrow');
    arrow.style.transform = isVisible ? 'rotate(0deg)' : 'rotate(90deg)';
  });
  
  // Manejar selección de idioma
  languageOptionElements.forEach(option => {
    option.addEventListener('click', async (e) => {
      const selectedLang = e.target.getAttribute('data-lang');
      
      // Guardar idioma seleccionado
      const success = await i18n.setLanguage(selectedLang);
      
      if (success) {
        // Actualizar interfaz inmediatamente
        updateLanguageInterface();
        
        // Ocultar opciones
        languageOptions.style.display = 'none';
        const arrow = languageSelect.querySelector('.arrow');
        arrow.style.transform = 'rotate(0deg)';
        
        // Notificar al background script sobre el cambio de idioma
        try {
          await chrome.runtime.sendMessage({
            action: 'languageChanged',
            language: selectedLang
          });
        } catch (error) {
          console.log('Background script notification failed:', error);
        }
        
        // Mostrar confirmación visual
        showLanguageChangeConfirmation();
      }
    });
  });
  
  // Función para mostrar confirmación de cambio de idioma
  function showLanguageChangeConfirmation() {
    // Crear elemento de confirmación
    const confirmation = document.createElement('div');
    confirmation.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #10b981;
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      font-weight: 600;
      box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
      z-index: 1000;
      animation: fadeInOut 2s ease-in-out;
    `;
    
    confirmation.textContent = i18n.getCurrentLanguage() === 'es' 
      ? '✓ Idioma cambiado correctamente' 
      : '✓ Language changed successfully';
    
    // Agregar animación CSS
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
      }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(confirmation);
    
    // Remover después de la animación
    setTimeout(() => {
      document.body.removeChild(confirmation);
      document.head.removeChild(style);
    }, 2000);
  }
  
  // Cerrar opciones al hacer clic fuera
  document.addEventListener('click', (e) => {
    if (!languageSelect.contains(e.target) && !languageOptions.contains(e.target)) {
      languageOptions.style.display = 'none';
      const arrow = languageSelect.querySelector('.arrow');
      arrow.style.transform = 'rotate(0deg)';
    }
  });
  
  // Lógica para limpiar notificaciones
  const clearNotificationsBtn = document.getElementById('clearNotificationsBtn');
  if (clearNotificationsBtn) {
    clearNotificationsBtn.addEventListener('click', async () => {
      // Deshabilitar botón temporalmente y mostrar estado de carga
      clearNotificationsBtn.disabled = true;
      const originalHtml = clearNotificationsBtn.innerHTML;
      clearNotificationsBtn.innerHTML = '<span class="loading-spinner"></span> Limpiando...';
      
      try {
        // Obtener todas las notificaciones activas
        chrome.notifications.getAll((notifications) => {
          const notificationIds = Object.keys(notifications);
          
          if (notificationIds.length > 0) {
            // Limpiar cada notificación
            let clearedCount = 0;
            notificationIds.forEach((id) => {
              chrome.notifications.clear(id, (wasCleared) => {
                clearedCount++;
                // Cuando todas hayan sido procesadas
                if (clearedCount === notificationIds.length) {
                  showNotificationClearedConfirmation();
                }
              });
            });
          } else {
            // Si no hay notificaciones, mostrar éxito de todas formas
            showNotificationClearedConfirmation();
          }
        });
      } catch (error) {
        console.error('Error clearing notifications:', error);
      } finally {
        // Restaurar botón después de un breve delay
        setTimeout(() => {
          clearNotificationsBtn.disabled = false;
          clearNotificationsBtn.innerHTML = originalHtml;
        }, 800);
      }
    });
  }

  // Función para mostrar confirmación de limpieza de notificaciones
  function showNotificationClearedConfirmation() {
    // Crear elemento de confirmación
    const confirmation = document.createElement('div');
    confirmation.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #10b981;
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      font-weight: 600;
      box-shadow: 0 4px 16px rgba(16, 185, 129, 0.3);
      z-index: 1000;
      animation: fadeInOut 2s ease-in-out;
    `;
    
    confirmation.textContent = '✓ ' + i18n.t('notificationsCleared');
    
    // Verificar si el estilo ya existe
    if (!document.getElementById('confirmation-style')) {
      const style = document.createElement('style');
      style.id = 'confirmation-style';
      style.textContent = `
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
          20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(confirmation);
    
    // Remover después de la animación
    setTimeout(() => {
      if (document.body.contains(confirmation)) {
        document.body.removeChild(confirmation);
      }
    }, 2000);
  }
  
  // Inicializar interfaz
  updateLanguageInterface();
  
  // Escuchar cambios de idioma desde otras partes de la extensión
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'languageUpdated') {
      updateLanguageInterface();
      sendResponse({ success: true });
    }
  });
});

// Función para actualizar traducciones dinámicamente
window.updateTranslations = function() {
  i18n.translatePage();
};