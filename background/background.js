const COOKIE_NAME = 'MoodleSession';
const TARGET_DOMAIN = 'virtualunimayor.edu.co';
const LOGIN_URLS = ['/login/index.php'];
const POST_LOGIN_URLS = ['/my/', '/user/profile.php'];
const LOGOUT_URLS = ['/login/logout.php'];

let sessionActive = false;
let protectionEnabled = true;
let lastCookieValue = null;
let internalCookieWriteUntil = 0;
const COOKIE_CLONE_WINDOW_MS = 20 * 1000;
const COOKIE_CLONE_MIN_EVENTS = 3;

const cookieMutationState = {
  timeline: []
};

// Escuchar cambios de navegación
chrome.webNavigation.onCommitted.addListener(async (details) => {
  const url = new URL(details.url);
  
  // Detectar logout
  if (LOGOUT_URLS.some(path => url.pathname.includes(path))) {
    await handleLogout();
    return;
  }

  // Verificar estado de sesión
  await checkSessionStatus(details.url);
});

// Verificar estado de sesión
async function checkSessionStatus(url) {
  if (!url.includes(TARGET_DOMAIN)) return;

  try {
    const [hasUserMenu, isPostLoginPage] = await Promise.all([
      checkUserMenuExistence(),
      POST_LOGIN_URLS.some(path => new URL(url).pathname.includes(path))
    ]);

    const newSessionStatus = hasUserMenu || isPostLoginPage;
    
    if (newSessionStatus && !sessionActive) {
      // Nueva sesión detectada
      await handleLogin();
    } else if (!newSessionStatus && sessionActive) {
      // Sesión perdida
      await handleLogout();
    }
  } catch (error) {
    console.error('Error verificando estado de sesión:', error);
  }
}

// Verificar elementos de UI que indican sesión activa
async function checkUserMenuExistence() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tabs.length) return false;

  try {
    const result = await chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: () => !!document.querySelector('.usermenu, .userpicture')
    });
    return result[0]?.result || false;
  } catch (error) {
    return false;
  }
}

// Manejar inicio de sesión
async function handleLogin() {
  console.log('🟢 Sesión iniciada - Activando protección');
  sessionActive = true;
  
  // Proteger cookies existentes
  const cookies = await chrome.cookies.getAll({
    name: COOKIE_NAME,
    domain: TARGET_DOMAIN
  });
  
  if (cookies.length > 0) {
    const currentCookieValue = cookies[0].value;
    
    // Solo mostrar notificación si es una cookie nueva/diferente
    if (lastCookieValue !== currentCookieValue) {
      lastCookieValue = currentCookieValue;
      
      for (const cookie of cookies) {
        await protectCookie(cookie);
      }

      // Mostrar notificación INMEDIATAMENTE con idioma apropiado
      await createLocalizedNotification('protection', {
        id: 'protection_' + Date.now(),
        priority: 2
      });
      
      // Guardar evento para notificaciones
      await saveNotificationEvent('session_protected', {
        timestamp: new Date().toISOString(),
        message: await getLocalizedMessage('sessionProtected'),
        type: 'success'
      });
    }
  }
}

// Manejar cierre de sesión
async function handleLogout() {
  console.log('🔴 Sesión cerrada - Limpiando cookies');
  sessionActive = false;
  lastCookieValue = null;
  
  // Mostrar notificación de limpieza INMEDIATAMENTE con idioma apropiado
  await createLocalizedNotification('cleanup', {
    id: 'cleanup_' + Date.now(),
    priority: 1
  });
  
  // Eliminar todas las cookies de sesión
  const cookies = await chrome.cookies.getAll({
    name: COOKIE_NAME,
    domain: TARGET_DOMAIN
  });
  
  for (const cookie of cookies) {
    internalCookieWriteUntil = Date.now() + 3000;
    await chrome.cookies.remove({
      url: `https://${cookie.domain}${cookie.path}`,
      name: cookie.name
    });
  }

  // Guardar evento para notificaciones
  await saveNotificationEvent('session_cleanup', {
    timestamp: new Date().toISOString(),
    message: await getLocalizedMessage('sessionClosed'),
    type: 'info'
  });
}

// Proteger cookie específica
async function protectCookie(cookie) {
  if (!protectionEnabled || !sessionActive) return;

  try {
    // Verificar si ya está protegida
    if (cookie.secure && cookie.httpOnly && cookie.sameSite === 'lax') {
      return;
    }

    // Crear versión protegida
    const protectedCookie = {
      url: `https://${cookie.domain}${cookie.path}`,
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path,
      secure: true,
      httpOnly: true,
      sameSite: 'lax',
      expirationDate: cookie.expirationDate
    };

    // Eliminar versiones no protegidas
    internalCookieWriteUntil = Date.now() + 3000;
    await chrome.cookies.remove({
      url: `https://${cookie.domain}${cookie.path}`,
      name: cookie.name
    });

    // Establecer cookie protegida
    internalCookieWriteUntil = Date.now() + 3000;
    await chrome.cookies.set(protectedCookie);
    console.log('Cookie protegida:', protectedCookie);

    // Incrementar contador de cookies protegidas
    await incrementProtectedCookiesCount();

  } catch (error) {
    console.error('Error protegiendo cookie:', error);
  }
}

// Incrementar contador de cookies protegidas
async function incrementProtectedCookiesCount() {
  try {
    const result = await chrome.storage.local.get(['protected_cookies_stats']);
    const currentCount = result.protected_cookies_stats || 0;
    await chrome.storage.local.set({ 
      protected_cookies_stats: currentCount + 1 
    });
  } catch (error) {
    console.error('Error incrementando contador:', error);
  }
}

// Guardar eventos para el panel de notificaciones
async function saveNotificationEvent(type, data) {
  try {
    const result = await chrome.storage.local.get(['notification_events']);
    const events = result.notification_events || [];
    
    events.unshift({ // Agregar al inicio
      id: Date.now(),
      type: type,
      ...data
    });
    
    // Mantener solo los últimos 50 eventos
    if (events.length > 50) {
      events.splice(50);
    }
    
    await chrome.storage.local.set({ notification_events: events });
  } catch (error) {
    console.error('Error guardando evento de notificación:', error);
  }
}

function trimCookieMutationTimeline(now = Date.now()) {
  const cutoff = now - COOKIE_CLONE_WINDOW_MS;
  cookieMutationState.timeline = cookieMutationState.timeline.filter((item) => item.ts >= cutoff);
}

async function saveExportAttemptEvent(details) {
  try {
    const result = await chrome.storage.local.get(['export_attempts']);
    const attempts = result.export_attempts || [];
    attempts.unshift({
      id: Date.now(),
      timestamp: new Date().toISOString(),
      source: 'cookie_editor_pattern',
      ...details
    });
    if (attempts.length > 100) attempts.splice(100);
    await chrome.storage.local.set({ export_attempts: attempts });
  } catch (error) {
    console.error('Error guardando intento de clonación/exportación:', error);
  }
}

async function analyzeCookieCloneAttempt(changeInfo) {
  if (!sessionActive) return;
  if (changeInfo.removed) return;
  if (Date.now() < internalCookieWriteUntil) return;
  if (!changeInfo.cookie?.domain?.includes(TARGET_DOMAIN)) return;
  if (changeInfo.cause !== 'explicit' && changeInfo.cause !== 'overwrite') return;

  const now = Date.now();
  const cookie = changeInfo.cookie;

  cookieMutationState.timeline.push({
    ts: now,
    cause: changeInfo.cause,
    value: cookie.value,
    domain: cookie.domain,
    path: cookie.path
  });
  trimCookieMutationTimeline(now);

  const recentWrites = cookieMutationState.timeline.length;
  const distinctScopes = new Set(
    cookieMutationState.timeline.map((entry) => `${entry.domain}|${entry.path}`)
  ).size;

  const suspiciousValueChange = Boolean(lastCookieValue && cookie.value && lastCookieValue !== cookie.value);
  const suspiciousBurst = recentWrites >= COOKIE_CLONE_MIN_EVENTS;
  const suspiciousScopeSpread = distinctScopes >= 2;
  const suspiciousCause = changeInfo.cause === 'explicit';

  // Solo se activa si hay múltiples escrituras (inyector.py o fuerza bruta)
  // o si intentan esparcir la cookie a otros scopes. 
  // Un solo cambio 'explicit' es normal al iniciar sesión.
  if (!(suspiciousBurst || suspiciousScopeSpread)) {
    lastCookieValue = cookie.value || lastCookieValue;
    return;
  }

  const details = {
    cause: changeInfo.cause,
    domain: cookie.domain,
    path: cookie.path,
    recentWrites,
    distinctScopes,
    valueChanged: suspiciousValueChange
  };

  await saveExportAttemptEvent(details);
  await saveNotificationEvent('cookie_clone_attempt', {
    timestamp: new Date(now).toISOString(),
    message: 'Posible clonación de cookie detectada (patrón tipo Cookie-Editor).',
    type: 'warning'
  });

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const candidateTabId = tabs[0]?.id;
  if (typeof candidateTabId === 'number') {
    await registerThreatIndicator(candidateTabId, {
      category: 'interceptor_tool',
      indicatorType: 'cookie_editor_clone_pattern',
      confidence: 'high',
      weight: 33,
      details
    });
  }

  lastCookieValue = cookie.value || lastCookieValue;
}

chrome.cookies.onChanged.addListener((changeInfo) => {
  if (changeInfo.cookie?.name !== COOKIE_NAME) return;
  analyzeCookieCloneAttempt(changeInfo).catch((error) => {
    console.error('Error analizando patrón de clonación de cookie:', error);
  });
});

// Comunicación con la UI
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getStatus':
      sendResponse({ active: sessionActive, protection: protectionEnabled });
      break;
    case 'toggleProtection':
      protectionEnabled = request.enable;
      sendResponse({ success: true });
      break;
    case 'forceCleanup':
      handleLogout().then(() => sendResponse({ success: true }));
      return true;
    case 'getNotificationStats':
      getNotificationStats().then(stats => sendResponse(stats));
      return true;
    case 'languageChanged':
      // Actualizar notificaciones con nuevo idioma
      updateNotificationLanguage(request.language).then(() => {
        // Notificar a todas las pestañas sobre el cambio de idioma
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach(tab => {
            chrome.tabs.sendMessage(tab.id, { 
              action: 'languageUpdated', 
              language: request.language 
            }).catch(() => {
              // Ignorar errores si la pestaña no puede recibir mensajes
            });
          });
        });
        sendResponse({ success: true });
      });
      return true;
    case 'clearRecentEvents':
      chrome.storage.local.set({ notification_events: [] }).then(() => {
        sendResponse({ success: true });
      });
      return true;
  }
});

// Obtener estadísticas para el panel de notificaciones
async function getNotificationStats() {
  try {
    const result = await chrome.storage.local.get([
      'protected_cookies_stats',
      'xss_attempts',
      'fingerprint_changes',
      'export_attempts',
      'notification_events',
      'threat_events'
    ]);

    const threatEvents = result.threat_events || [];
    const activePatterns = Array.from(new Set(
      threatEvents
        .slice(0, 30)
        .flatMap((event) => (event.indicators || []).map((indicator) => indicator.indicatorType))
        .filter(Boolean)
    ));

    return {
      protectedCookies: result.protected_cookies_stats || 0,
      xssAttempts: result.xss_attempts?.length || 0,
      fingerprintChanges: result.fingerprint_changes?.length || 0,
      exportAttempts: result.export_attempts?.length || 0,
      threatAlerts: threatEvents.length,
      activePatterns,
      recentEvents: result.notification_events?.slice(0, 10) || []
    };
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    return {
      protectedCookies: 0,
      xssAttempts: 0,
      fingerprintChanges: 0,
      exportAttempts: 0,
      threatAlerts: 0,
      activePatterns: [],
      recentEvents: []
    };
  }
}

// Función para actualizar el idioma de las notificaciones
async function updateNotificationLanguage(language) {
  try {
    // Actualizar idioma de notificaciones futuras
    await chrome.storage.local.set({ notificationLanguage: language });
    console.log(`Idioma de notificaciones actualizado a: ${language}`);
  } catch (error) {
    console.error('Error actualizando idioma de notificaciones:', error);
  }
}

// Función para obtener idioma actual
async function getCurrentLanguage() {
  try {
    const stored = await chrome.storage.local.get(['notificationLanguage']);
    return stored.notificationLanguage || 'es';
  } catch (error) {
    console.error('Error obteniendo idioma:', error);
    return 'es';
  }
}

// Función para obtener mensaje localizado
async function getLocalizedMessage(messageKey) {
  const lang = await getCurrentLanguage();
  
  const messages = {
    es: {
      sessionProtected: 'Sesión protegida exitosamente',
      sessionClosed: 'Sesión cerrada y cookies limpiadas'
    },
    en: {
      sessionProtected: 'Session successfully protected',
      sessionClosed: 'Session closed and cookies cleaned'
    }
  };
  
  return messages[lang][messageKey] || messageKey;
}

// Función para crear notificaciones con idioma apropiado
async function createLocalizedNotification(notificationType, options = {}) {
  try {
    const lang = await getCurrentLanguage();
    
    // Definir las notificaciones por tipo
    const notificationData = {
      protection: {
        es: {
          title: 'CookieSentinella — Protección activa',
          message: 'Sesión segura: cookies blindadas (Secure/HttpOnly/SameSite), bloqueo XSS y alerta por cambios sospechosos.\nLimpieza automática al cerrar sesión.'
        },
        en: {
          title: 'CookieSentinella — Active Protection', 
          message: 'Secure session: armored cookies (Secure/HttpOnly/SameSite), XSS blocking and suspicious change alerts.\nAutomatic cleanup on logout.'
        }
      },
      cleanup: {
        es: {
          title: 'CookieSentinella — Limpieza completada',
          message: 'Cookies de sesión limpias.'
        },
        en: {
          title: 'CookieSentinella — Cleanup Completed',
          message: 'Session cookies clean.'
        }
      },
      cookieTampering: {
        es: {
          title: 'Manipulación de Cookie Detectada',
          message: 'Cambio no autorizado en cookie MoodleSession'
        },
        en: {
          title: 'Cookie Tampering Detected',
          message: 'Unauthorized change in MoodleSession cookie'
        }
      },
      fingerprintChanged: {
        es: {
          title: 'Huella Digital del Dispositivo Cambiada',
          message: 'Se detectaron cambios significativos en la huella digital del dispositivo.'
        },
        en: {
          title: 'Device Fingerprint Changed',
          message: 'Significant changes detected in device fingerprint.'
        }
      },
      xssAttempt: {
        es: {
          title: 'Intento de XSS Detectado',
          message: 'Se bloqueó un intento de ataque XSS.'
        },
        en: {
          title: 'XSS Attempt Detected',
          message: 'An XSS attack attempt was blocked.'
        }
      }
    };

    // Obtener datos de la notificación según el tipo e idioma
    const notification = notificationData[notificationType]?.[lang];
    
    if (!notification) {
      console.error(`Tipo de notificación no encontrado: ${notificationType}`);
      return;
    }

    const notificationOptions = {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('icons/icon48.png'),
      title: notification.title,
      message: notification.message,
      priority: options.priority || 1
    };

    // Crear notificación
    if (options.id) {
      return chrome.notifications.create(options.id, notificationOptions);
    } else {
      return chrome.notifications.create(notificationOptions);
    }
  } catch (error) {
    console.error('Error creando notificación localizada:', error);
    
    // Fallback a notificación básica en español
    const fallbackNotifications = {
      protection: {
        title: 'CookieSentinella — Protección activa',
        message: 'Sesión segura: cookies blindadas (Secure/HttpOnly/SameSite), bloqueo XSS y alerta por cambios sospechosos.\nLimpieza automática al cerrar sesión.'
      },
      cleanup: {
        title: 'CookieSentinella — Limpieza completada',
        message: 'Cookies de sesión eliminadas.'
      }
    };
    
    const fallback = fallbackNotifications[notificationType];
    if (fallback) {
      return chrome.notifications.create({
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon48.png'),
        title: fallback.title,
        message: fallback.message,
        priority: options.priority || 1
      });
    }
  }
}

// Monitoreo continuo
setInterval(() => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length) checkSessionStatus(tabs[0].url);
  });
}, 5000);

// Manejar clics en notificaciones
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId.startsWith('protection_') || notificationId.startsWith('cleanup_')) {
    chrome.action.openPopup();
  }
});

// Escuchar mensajes de content scripts para eventos de seguridad
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Manejar eventos de XSS
  if (message.type === 'xss_attempt') {
    handleXSSAttempt(message);
    sendResponse({ success: true });
  }
  
  // Manejar cambios de fingerprint
  if (message.type === 'fingerprint_changed') {
    handleFingerprintChange(message);
    sendResponse({ success: true });
  }
});

// Manejar intentos de XSS
async function handleXSSAttempt(data) {
  try {
    // Guardar intento de XSS
    const result = await chrome.storage.local.get(['xss_attempts']);
    const attempts = result.xss_attempts || [];
    attempts.push({
      timestamp: new Date().toISOString(),
      url: data.url,
      details: data.details
    });
    await chrome.storage.local.set({ xss_attempts: attempts });

    // Mostrar notificación
    await createLocalizedNotification('xssAttempt', { priority: 2 });

    // Guardar evento
    await saveNotificationEvent('xss_attempt', {
      timestamp: new Date().toISOString(),
      message: `XSS bloqueado: ${data.details}`,
      type: 'warning'
    });

  } catch (error) {
    console.error('Error manejando intento de XSS:', error);
  }
}

// Manejar cambios de fingerprint
async function handleFingerprintChange(data) {
  try {
    // Guardar cambio de fingerprint
    const result = await chrome.storage.local.get(['fingerprint_changes']);
    const changes = result.fingerprint_changes || [];
    changes.push({
      timestamp: new Date().toISOString(),
      oldFingerprint: data.oldFingerprint,
      newFingerprint: data.newFingerprint
    });
    await chrome.storage.local.set({ fingerprint_changes: changes });

    // Mostrar notificación
    await createLocalizedNotification('fingerprintChanged', { priority: 1 });

    // Guardar evento
    await saveNotificationEvent('fingerprint_change', {
      timestamp: new Date().toISOString(),
      message: await getLocalizedMessage('fingerprintChanged'),
      type: 'info'
    });

  } catch (error) {
    console.error('Error manejando cambio de fingerprint:', error);
  }
}

// Inicialización al instalar/actualizar la extensión
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    console.log('CookieSentinella instalada');
    
    // Inicializar configuraciones por defecto
    await chrome.storage.local.set({
      protected_cookies_stats: 0,
      xss_attempts: [],
      fingerprint_changes: [],
      export_attempts: [],
      threat_events: [],
      notification_events: [],
      notificationLanguage: 'es'
    });
  } else if (details.reason === 'update') {
    console.log('CookieSentinella actualizada');
  }
});

// Limpiar datos al desinstalar (cleanup)
chrome.runtime.onSuspend.addListener(() => {
  console.log('CookieSentinella suspendida');
});
/**
 * ============================
 * Sistema avanzado de alertas
 * ============================
 * Detección local de amenazas sin backend.
 */
const THREAT_WINDOW_MS = 90 * 1000;
const THREAT_ALERT_COOLDOWN_MS = 45 * 1000;
const THREAT_MUTE_MS = 5 * 60 * 1000;

const threatStateByTab = new Map();
const requestState = new Map();
const trustedIssuersByHost = new Map();
const securityHeaderBaselineByHost = new Map();
const blockedNavigationByTab = new Map();
const notificationContextById = new Map();

const PROXY_HEADERS = ['via', 'x-forwarded-for', 'forwarded', 'proxy-connection', 'x-real-ip'];
const LOOPBACK_PATTERNS = ['127.0.0.1', 'localhost', '0.0.0.0', '::1'];

const ATTACK_PROFILES = {
  xss: {
    minimumScore: 55,
    requiredIndicators: ['inline_script_with_payload', 'suspicious_event_handler_payload', 'javascript_scheme_injection', 'untrusted_external_script', 'csp_blocked_inline_script']
  },
  mitm: {
    minimumScore: 60,
    requiredIndicators: ['issuer_changed_mid_session', 'tls_error', 'proxy_header_detected', 'proxy_response_header', 'cookie_protection_downgraded', 'abnormal_latency_spike', 'cookie_editor_clone_pattern']
  }
};

function getTabThreatState(tabId) {
  if (!threatStateByTab.has(tabId)) {
    threatStateByTab.set(tabId, {
      indicators: [],
      rollingLatency: {},
      lastAlertAt: 0,
      mutedUntil: 0,
      lastSeverity: null
    });
  }

  return threatStateByTab.get(tabId);
}

function trimOldIndicators(state) {
  const cutoff = Date.now() - THREAT_WINDOW_MS;
  state.indicators = state.indicators.filter((item) => item.ts >= cutoff);
}

function confidenceMultiplier(confidence = 'medium') {
  if (confidence === 'high') return 1.4;
  if (confidence === 'low') return 0.75;
  return 1;
}

function scoreIndicators(indicators, family) {
  return Math.min(100, Math.round(indicators.reduce((sum, indicator) => {
    const familyBoost = indicator.category === 'xss_injection' && family === 'xss' ? 1.2 : 1;
    const mitmBoost = ['mitm_behavior', 'suspicious_certificate', 'interceptor_tool', 'header_anomaly'].includes(indicator.category) && family === 'mitm' ? 1.2 : 1;
    return sum + ((indicator.weight || 0) * confidenceMultiplier(indicator.confidence) * familyBoost * mitmBoost);
  }, 0)));
}

function computeProfileVerdict(state) {
  trimOldIndicators(state);

  const xssIndicators = state.indicators.filter((x) => x.category === 'xss_injection');
  const mitmIndicators = state.indicators.filter((x) => ['mitm_behavior', 'suspicious_certificate', 'interceptor_tool', 'header_anomaly'].includes(x.category));

  const xssScore = scoreIndicators(xssIndicators, 'xss');
  const mitmScore = scoreIndicators(mitmIndicators, 'mitm');

  const xssRequired = ATTACK_PROFILES.xss.requiredIndicators;
  const mitmRequired = ATTACK_PROFILES.mitm.requiredIndicators;

  const xssPatternsMatched = new Set(xssIndicators.map((i) => i.indicatorType));
  const mitmPatternsMatched = new Set(mitmIndicators.map((i) => i.indicatorType));

  const xssHighConfidence = xssIndicators.filter((i) => i.confidence === 'high').length;
  const mitmHighConfidence = mitmIndicators.filter((i) => i.confidence === 'high').length;

  const xssTriggered = xssScore >= ATTACK_PROFILES.xss.minimumScore
    && xssHighConfidence >= 1
    && xssRequired.some((pattern) => xssPatternsMatched.has(pattern))
    && xssIndicators.length >= 2;

  const mitmTriggered = mitmScore >= ATTACK_PROFILES.mitm.minimumScore
    && mitmRequired.some((pattern) => mitmPatternsMatched.has(pattern))
    && mitmIndicators.length >= 2
    && (mitmHighConfidence >= 1 || mitmPatternsMatched.has('issuer_changed_mid_session') || mitmPatternsMatched.has('tls_error'));

  const multiTriggered = xssTriggered && mitmTriggered;

  let severity = 'bajo';
  const globalScore = Math.min(100, Math.round((xssScore * 0.45) + (mitmScore * 0.55)));
  if (multiTriggered || globalScore >= 90) severity = 'alto';
  else if (xssTriggered || mitmTriggered || globalScore >= 65) severity = 'medio';

  return {
    xssTriggered,
    mitmTriggered,
    multiTriggered,
    xssScore,
    mitmScore,
    globalScore,
    severity
  };
}

function getThreatMessage(state, verdict) {
  const labels = {
    inline_script_with_payload: 'script inline malicioso',
    dangerous_dom_sink_with_payload: 'payload dinámico en innerHTML',
    suspicious_event_handler_payload: 'handler inline sospechoso',
    untrusted_external_script: 'script externo no confiable',
    javascript_scheme_injection: 'inyección javascript: en atributos',
    csp_blocked_inline_script: 'CSP bloqueó script inline sospechoso',
    issuer_changed_mid_session: 'issuer de certificado cambió en sesión',
    tls_error: 'error TLS/SSL',
    proxy_header_detected: 'headers de proxy detectados',
    proxy_response_header: 'proxy reescribiendo respuesta',
    cookie_protection_downgraded: 'degradación de flags Secure/HttpOnly/SameSite',
    abnormal_latency_spike: 'latencia anómala compatible con MITM',
    cookie_editor_clone_pattern: 'patrón de clonación de cookie (Cookie-Editor)'
  };

  const recent = state.indicators.slice(-8);
  const matched = [];

  recent.forEach((item) => {
    if (labels[item.indicatorType]) matched.push(labels[item.indicatorType]);
  });

  const unique = Array.from(new Set(matched)).slice(0, 3).join(' + ');

  if (verdict.multiTriggered) {
    return `Posibles ataques múltiples (XSS + MITM): ${unique || 'patrones correlacionados de alto riesgo'}`;
  }

  if (verdict.xssTriggered) {
    return `Posible XSS activo: ${unique || 'múltiples patrones de inyección detectados'}`;
  }

  if (verdict.mitmTriggered) {
    return `Posible MITM/interceptor: ${unique || 'patrones de red y certificado sospechosos'}`;
  }

  return `Riesgo ${verdict.severity}: ${unique || 'señales correlacionadas'}`;
}

async function persistThreatEvent(payload) {
  const data = await chrome.storage.local.get(['threat_events']);
  const events = data.threat_events || [];
  events.unshift(payload);
  if (events.length > 100) events.splice(100);
  await chrome.storage.local.set({ threat_events: events });
}

async function emitThreatAlert(tabId, verdict) {
  const state = getTabThreatState(tabId);
  const now = Date.now();

  if (now < state.mutedUntil) return;
  if (now - state.lastAlertAt < THREAT_ALERT_COOLDOWN_MS && state.lastSeverity === verdict.severity) return;

  const message = getThreatMessage(state, verdict);
  const notificationId = `threat_${Date.now()}_${tabId}`;

  notificationContextById.set(notificationId, {
    tabId,
    severity: verdict.severity,
    verdict
  });

  await chrome.notifications.create(notificationId, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icons/icon48.png'),
    title: 'CookieSentinella — Alerta de amenazas',
    message,
    priority: verdict.severity === 'alto' ? 2 : 1,
    buttons: [
      { title: 'Ignorar (5 min)' },
      { title: 'Recargar pestaña' },
      { title: 'Cerrar sesión' },
      { title: 'Bloquear navegación' }
    ]
  });

  state.lastAlertAt = now;
  state.lastSeverity = verdict.severity;

  await persistThreatEvent({
    id: notificationId,
    tabId,
    timestamp: new Date(now).toISOString(),
    severity: verdict.severity,
    score: verdict.globalScore,
    xssScore: verdict.xssScore,
    mitmScore: verdict.mitmScore,
    message,
    indicators: state.indicators.slice(-8)
  });

  await saveNotificationEvent('threat_alert', {
    timestamp: new Date(now).toISOString(),
    message,
    type: verdict.severity === 'alto' ? 'error' : 'warning'
  });
}

async function registerThreatIndicator(tabId, indicator) {
  if (typeof tabId !== 'number' || tabId < 0) return;

  const state = getTabThreatState(tabId);
  state.indicators.push({ ...indicator, ts: Date.now() });

  const verdict = computeProfileVerdict(state);

  if (verdict.xssTriggered || verdict.mitmTriggered || verdict.multiTriggered) {
    await emitThreatAlert(tabId, verdict);
  }
}

function normalizeHeaders(headers = []) {
  return headers.reduce((acc, header) => {
    acc[header.name.toLowerCase()] = header.value || '';
    return acc;
  }, {});
}

function parseSetCookieFlags(setCookieValue = '') {
  const lower = setCookieValue.toLowerCase();
  return {
    secure: lower.includes('secure'),
    httpOnly: lower.includes('httponly'),
    sameSite: lower.includes('samesite')
  };
}

function updateLatencyModel(state, host, valueMs) {
  const stats = state.rollingLatency[host] || { avg: valueMs, variance: 0, count: 0 };
  stats.count += 1;

  const delta = valueMs - stats.avg;
  stats.avg += delta / stats.count;
  const delta2 = valueMs - stats.avg;
  stats.variance += delta * delta2;

  state.rollingLatency[host] = stats;

  if (stats.count < 10) return false;

  const std = Math.sqrt(stats.variance / Math.max(1, stats.count - 1));
  return valueMs > stats.avg + (3 * std) + 500;
}

function isProxyLoopback(value = '') {
  return LOOPBACK_PATTERNS.some((pattern) => String(value).includes(pattern));
}

chrome.webRequest.onBeforeSendHeaders.addListener((details) => {
  if (!details.url.includes(TARGET_DOMAIN)) return;

  const headers = normalizeHeaders(details.requestHeaders);
  requestState.set(details.requestId, {
    tabId: details.tabId,
    startedAt: Date.now(),
    url: details.url,
    requestHeaders: headers
  });

  PROXY_HEADERS.forEach((proxyHeader) => {
    if (headers[proxyHeader]) {
      registerThreatIndicator(details.tabId, {
        category: 'interceptor_tool',
        indicatorType: 'proxy_header_detected',
        confidence: 'high',
        weight: 26,
        details: { header: proxyHeader }
      });
    }
  });

  const host = new URL(details.url).host;
  const ua = headers['user-agent'];
  if (ua) {
    const baselineKey = `ua:${host}`;
    const previous = securityHeaderBaselineByHost.get(baselineKey);
    if (previous && previous !== ua) {
      registerThreatIndicator(details.tabId, {
        category: 'interceptor_tool',
        indicatorType: 'user_agent_changed',
        confidence: 'medium',
        weight: 14,
        details: { host }
      });
    }
    securityHeaderBaselineByHost.set(baselineKey, ua);
  }

  if (isProxyLoopback(details.initiator) || isProxyLoopback(details.documentId)) {
    registerThreatIndicator(details.tabId, {
      category: 'interceptor_tool',
      indicatorType: 'loopback_proxy_pattern',
      confidence: 'medium',
      weight: 16,
      details: { initiator: details.initiator || 'n/a' }
    });
  }
}, { urls: ['*://*.virtualunimayor.edu.co/*'] }, ['requestHeaders', 'extraHeaders']);

chrome.webRequest.onHeadersReceived.addListener((details) => {
  if (!details.url.includes(TARGET_DOMAIN)) return;

  const responseHeaders = normalizeHeaders(details.responseHeaders);
  const host = new URL(details.url).host;

  const setCookie = responseHeaders['set-cookie'];
  if (setCookie && /moodlesession/i.test(setCookie)) {
    const flags = parseSetCookieFlags(setCookie);
    const baseline = securityHeaderBaselineByHost.get(`cookieFlags:${host}`);

    if (baseline && (baseline.secure && !flags.secure || baseline.httpOnly && !flags.httpOnly || baseline.sameSite && !flags.sameSite)) {
      registerThreatIndicator(details.tabId, {
        category: 'header_anomaly',
        indicatorType: 'cookie_protection_downgraded',
        confidence: 'high',
        weight: 30,
        details: { host, flags }
      });
    }

    securityHeaderBaselineByHost.set(`cookieFlags:${host}`, flags);
  }

  PROXY_HEADERS.forEach((headerName) => {
    if (responseHeaders[headerName]) {
      registerThreatIndicator(details.tabId, {
        category: 'interceptor_tool',
        indicatorType: 'proxy_response_header',
        confidence: 'high',
        weight: 28,
        details: { headerName }
      });
    }
  });

  try {
    if (chrome.webRequest.getSecurityInfo) {
      chrome.webRequest.getSecurityInfo(details.requestId, { certificateChain: true }, (securityInfo) => {
        if (chrome.runtime.lastError || !securityInfo) return;

        const issuer = securityInfo.certificates?.[0]?.issuer || '';
        const trusted = trustedIssuersByHost.get(host);

        if (securityInfo.certificateTransparencyCompliance && securityInfo.certificateTransparencyCompliance !== 'compliant') {
          registerThreatIndicator(details.tabId, {
            category: 'suspicious_certificate',
            indicatorType: 'ct_non_compliant',
            confidence: 'medium',
            weight: 18,
            details: { host, compliance: securityInfo.certificateTransparencyCompliance }
          });
        }

        if (trusted && issuer && trusted !== issuer) {
          registerThreatIndicator(details.tabId, {
            category: 'suspicious_certificate',
            indicatorType: 'issuer_changed_mid_session',
            confidence: 'high',
            weight: 34,
            details: { host, issuer, trusted }
          });
        }

        if (!trusted && issuer) {
          trustedIssuersByHost.set(host, issuer);
        }
      });
    }
  } catch (error) {
    console.debug('No se pudo inspeccionar certificado:', error);
  }
}, { urls: ['*://*.virtualunimayor.edu.co/*'] }, ['responseHeaders', 'extraHeaders']);

chrome.webRequest.onCompleted.addListener((details) => {
  if (!details.url.includes(TARGET_DOMAIN)) return;

  const request = requestState.get(details.requestId);
  requestState.delete(details.requestId);

  if (!request) return;

  const elapsed = Date.now() - request.startedAt;
  const host = new URL(details.url).host;
  const state = getTabThreatState(details.tabId);

  const isAnomalousLatency = updateLatencyModel(state, host, elapsed);
  if (isAnomalousLatency) {
    registerThreatIndicator(details.tabId, {
      category: 'mitm_behavior',
      indicatorType: 'abnormal_latency_spike',
      confidence: 'medium',
      weight: 20,
      details: { host, elapsed }
    });
  }
}, { urls: ['*://*.virtualunimayor.edu.co/*'] });

chrome.webRequest.onErrorOccurred.addListener((details) => {
  if (!details.url.includes(TARGET_DOMAIN)) return;

  requestState.delete(details.requestId);

  if (/cert|ssl|secure/i.test(details.error || '')) {
    registerThreatIndicator(details.tabId, {
      category: 'suspicious_certificate',
      indicatorType: 'tls_error',
      confidence: 'high',
      weight: 34,
      details: { error: details.error }
    });
  }
}, { urls: ['*://*.virtualunimayor.edu.co/*'] });

chrome.webNavigation.onCommitted.addListener((details) => {
  const blocked = blockedNavigationByTab.get(details.tabId);
  if (!blocked) return;

  if (Date.now() > blocked.until) {
    blockedNavigationByTab.delete(details.tabId);
    return;
  }

  if (details.url.includes(TARGET_DOMAIN)) {
    chrome.tabs.update(details.tabId, { url: 'about:blank' });
  }
});

chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  if (!notificationId.startsWith('threat_')) return;

  const context = notificationContextById.get(notificationId);
  if (!context) return;

  const { tabId } = context;
  const state = getTabThreatState(tabId);

  if (buttonIndex === 0) state.mutedUntil = Date.now() + THREAT_MUTE_MS;
  if (buttonIndex === 1) chrome.tabs.reload(tabId);

  if (buttonIndex === 2) {
    await handleLogout();
    chrome.tabs.update(tabId, { url: 'https://virtualunimayor.edu.co/login/logout.php' });
  }

  if (buttonIndex === 3) {
    blockedNavigationByTab.set(tabId, { until: Date.now() + THREAT_MUTE_MS });
    chrome.tabs.update(tabId, { url: 'about:blank' });
  }

  chrome.notifications.clear(notificationId);
  notificationContextById.delete(notificationId);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== 'threat_indicator') return;

  const tabId = sender.tab?.id;
  registerThreatIndicator(tabId, {
    category: message.category || 'mitm_behavior',
    indicatorType: message.indicatorType || 'unknown_indicator',
    confidence: message.confidence || 'medium',
    weight: Math.max(8, Math.min(40, Number(message.weight) || 15)),
    details: message.details || {}
  }).then(() => sendResponse({ success: true }));

  return true;
});
