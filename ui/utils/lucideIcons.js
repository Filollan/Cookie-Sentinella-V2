/**
 * Lucide Icons - Utility para renderizar iconos profesionales
 * Proporciona acceso a iconos monocromáticos consistentes
 */

export const LucideIcons = {
  /**
   * Shield Check - Cookies protegidas
   */
  ShieldCheck: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    <polyline points="10 19 12 21 16 17"></polyline>
  </svg>`,

  /**
   * Shield Alert - Intentos de XSS
   */
  ShieldAlert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>`,

  /**
   * Fingerprint - Cambios de fingerprint
   */
  Fingerprint: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon">
    <circle cx="12" cy="12" r="10"></circle>
    <path d="M12 4c-3.3 0-6.2 1.5-8.1 3.8m16.2 0C18.2 5.5 15.3 4 12 4"></path>
    <path d="M12 20c3.3 0 6.2-1.5 8.1-3.8m-16.2 0C5.8 18.5 8.7 20 12 20"></path>
    <path d="M8 12h8"></path>
    <circle cx="12" cy="12" r="1"></circle>
  </svg>`,

  /**
   * Arrow Up Right - Intentos de exportación
   */
  ArrowUpRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon">
    <line x1="17" y1="7" x2="17" y2="17"></line>
    <polyline points="12 2 17 7 12 12"></polyline>
    <path d="M12 17H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7"></path>
  </svg>`,

  /**
   * Brain - Patrones de amenaza detectados
   */
  Brain: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon">
    <path d="M9.59 4.59A2 2 0 1 0 8 2.5a2 2 0 0 0 1.59 2.09z"></path>
    <path d="M16.41 4.59A2 2 0 1 0 15 2.5a2 2 0 0 0 1.41 2.09z"></path>
    <path d="M12 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"></path>
    <path d="M12 20v-2"></path>
    <path d="M6 17a2 2 0 0 0-2 2v1"></path>
    <path d="M20 17a2 2 0 0 0-2 2v1"></path>
  </svg>`,

  /**
   * Trash 2 - Icono de eliminación
   */
  Trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    <line x1="10" y1="11" x2="10" y2="17"></line>
    <line x1="14" y1="11" x2="14" y2="17"></line>
  </svg>`,

  /**
   * Alert Triangle - Alerta
   */
  AlertTriangle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3.05h16.94a2 2 0 0 0 1.71-3.05l-8.47-14.14a2 2 0 0 0-3.42 0z"></path>
    <line x1="12" y1="9" x2="12" y2="13"></line>
    <line x1="12" y1="17" x2="12.01" y2="17"></line>
  </svg>`,

  /**
   * Check Circle - Confirmación/éxito
   */
  CheckCircle: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
    <polyline points="22 4 12 14.01 9 11.01"></polyline>
  </svg>`,

  /**
   * Info - Información
   */
  Info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide-icon">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="16" x2="12" y2="12"></line>
    <line x1="12" y1="8" x2="12.01" y2="8"></line>
  </svg>`,
};

/**
 * Función para insertar un icono en un elemento
 * @param {HTMLElement} element - Elemento donde insertar el icono
 * @param {string} iconName - Nombre del icono (ej: 'ShieldCheck')
 * @param {string} color - Color CSS (default: '#1F2937')
 */
export function insertIcon(element, iconName, color = '#1F2937') {
  if (!element || !LucideIcons[iconName]) {
    console.warn(`Icon "${iconName}" not found or invalid element`);
    return;
  }

  const iconHTML = LucideIcons[iconName];
  element.innerHTML = iconHTML;
  
  // Aplicar color
  const svg = element.querySelector('svg');
  if (svg) {
    svg.style.color = color;
    svg.style.stroke = color;
  }
}

/**
 * Obtener el SVG de un icono como string
 * @param {string} iconName - Nombre del icono
 * @returns {string} SVG como string
 */
export function getIcon(iconName) {
  return LucideIcons[iconName] || null;
}

export default LucideIcons;
