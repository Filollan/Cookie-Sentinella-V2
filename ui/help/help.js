// ui/help/help.js — FAQ estático con acordeón + botones de soporte/reporte

import { loadLayout } from '../components/layout/layout.js';
import i18n from '../../utils/i18n.js';

document.addEventListener('DOMContentLoaded', async () => {
  await i18n.init();
  await loadLayout('ayuda');

  // ─── FAQ: acordeón estático ───────────────────────────────────────────────
  const faqBtn   = document.getElementById('faq-btn');
  const faqPanel = document.getElementById('faq-panel');
  const faqArrow = document.getElementById('faq-arrow');

  faqBtn.addEventListener('click', () => {
    const isOpen = faqPanel.style.display !== 'none';
    faqPanel.style.display = isOpen ? 'none' : 'block';
    faqArrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
    faqArrow.style.color = isOpen ? '#9ca3af' : '#4f46e5';
  });

  // Acordeón de preguntas individuales
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const idx    = btn.dataset.index;
      const answer = document.querySelector(`.faq-answer[data-index="${idx}"]`);
      const chevron = btn.querySelector('.faq-chevron');
      const isOpen  = answer.classList.contains('open');

      // Cerrar todos
      document.querySelectorAll('.faq-answer').forEach(a => a.classList.remove('open'));
      document.querySelectorAll('.faq-chevron').forEach(c => { c.textContent = '+'; c.style.transform = 'rotate(0deg)'; });

      if (!isOpen) {
        answer.classList.add('open');
        chevron.textContent = '−';
        chevron.style.transform = 'rotate(0deg)';
      }
    });
  });

  // ─── Botón Soporte: abre el chatbot flotante──────────────────────────────
  document.getElementById('support-btn').addEventListener('click', () => {
    const fab = document.getElementById('csbotFab');
    if (fab) fab.click();
  });

  // ─── Botón Reportar problema ──────────────────────────────────────────────
  const reportBtn = document.getElementById('report-btn');
  const reportPanel = document.getElementById('report-panel');
  const reportArrow = document.getElementById('report-arrow');

  reportBtn.addEventListener('click', () => {
    const isOpen = reportPanel.style.display !== 'none';
    reportPanel.style.display = isOpen ? 'none' : 'block';
    if (reportArrow) {
      reportArrow.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(90deg)';
      reportArrow.style.color = isOpen ? '#9ca3af' : '#4f46e5';
    }
  });

  const reportForm = document.getElementById('report-form');
  if (reportForm) {
    reportForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = document.getElementById('report-name').value;
      const desc = document.getElementById('report-desc').value;
      
      const email = 'mcadena@unimayor.edu.co';
      const submitBtn = reportForm.querySelector('.submit-btn');
      const originalText = submitBtn.textContent;
      
      // Mostrar estado de carga
      submitBtn.textContent = i18n.getCurrentLanguage() === 'es' ? 'Enviando...' : 'Sending...';
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.7';

      // Usar Web3Forms API para enviar el correo
      fetch('https://api.web3forms.com/submit', {
        method: "POST",
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            access_key: "a5971a81-e653-4612-89ee-bea08564846f", 
            subject: "Reporte de Problema - CookieSentinella",
            from_name: name,
            email: "no-reply@cookiesentinella.com",
            message: desc
        })
      })
      .then(async (response) => {
          let json = await response.json();
          if (response.status == 200) {
              alert(i18n.getCurrentLanguage() === 'es' ? 'Reporte enviado con éxito.' : 'Report sent successfully.');
              reportForm.reset();
              reportPanel.style.display = 'none';
              if (reportArrow) {
                reportArrow.style.transform = 'rotate(0deg)';
                reportArrow.style.color = '#9ca3af';
              }
          } else {
              console.log(response);
              alert(i18n.getCurrentLanguage() === 'es' ? 'Error al enviar: ' + json.message : 'Error sending: ' + json.message);
          }
      })
      .catch(error => {
          console.error('Error al enviar el reporte:', error);
          alert(i18n.getCurrentLanguage() === 'es' ? 'Hubo un error al conectar con el servidor.' : 'There was an error connecting to the server.');
      })
      .finally(() => {
          submitBtn.textContent = originalText;
          submitBtn.disabled = false;
          submitBtn.style.opacity = '1';
      });
    });
  }

  // ─── Traducciones ─────────────────────────────────────────────────────────
  function translatePage() {
    i18n.translatePage();
  }

  translatePage();

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'languageUpdated') {
      translatePage();
      sendResponse({ success: true });
    }
  });
});