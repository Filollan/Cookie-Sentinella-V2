(function threatDetector() {
  'use strict';

  const TRUSTED_SCRIPT_ORIGINS = new Set([
    window.location.origin,
    'https://ajax.googleapis.com',
    'https://cdnjs.cloudflare.com',
    'https://cdn.jsdelivr.net'
  ]);

  const baseline = {
    scripts: new Set(),
    initialized: false
  };

  const ATTACK_PATTERNS = {
    xssPayload: [
      /<script[^>]*>/i,
      /javascript\s*:/i,
      /on\w+\s*=\s*["'][^"']*(alert\(|prompt\(|confirm\(|fetch\(|xmlhttprequest|document\.cookie)/i,
      /(?:document\.cookie|localStorage|sessionStorage)[\s\S]{0,80}(?:fetch|sendBeacon|XMLHttpRequest|navigator\.sendBeacon)/i,
      /(?:atob\(|fromCharCode\(|String\.raw)[\s\S]{0,120}(?:eval\(|Function\()/i,
      /\beval\s*\(/i,
      /new\s+Function\s*\(/i
    ],
    mitmPayload: [
      /<script[^>]+src=["']https?:\/\/(?![^"']*virtualunimayor\.edu\.co)[^"']+["']/i,
      /integrity\s*=\s*["'][^"']+["']/i,
      /meta\s+http-equiv=["']refresh["']/i
    ]
  };

  function matchesAnyPattern(value, patterns) {
    const normalized = String(value || '');
    return patterns.some((pattern) => pattern.test(normalized));
  }

  function report(indicatorType, category, details, weight, confidence = 'medium') {
    chrome.runtime.sendMessage({
      type: 'threat_indicator',
      indicatorType,
      category,
      details,
      weight,
      confidence,
      source: 'content'
    }).catch(() => {});
  }

  function scriptFingerprint(script) {
    if (script.src) {
      try {
        return new URL(script.src, location.href).href;
      } catch {
        return script.src;
      }
    }

    const inline = (script.textContent || '').replace(/\s+/g, ' ').trim();
    return `inline:${inline.slice(0, 160)}`;
  }

  function isTrustedScript(scriptEl) {
    if (!scriptEl.src) return false;

    try {
      const scriptUrl = new URL(scriptEl.src, location.href);
      return TRUSTED_SCRIPT_ORIGINS.has(scriptUrl.origin);
    } catch {
      return false;
    }
  }

  function captureBaselineScripts() {
    document.querySelectorAll('script').forEach((script) => {
      baseline.scripts.add(scriptFingerprint(script));
    });

    baseline.initialized = true;
  }

  function inspectScriptElement(scriptEl, origin = 'dom_mutation') {
    const fingerprint = scriptFingerprint(scriptEl);
    const isKnown = baseline.scripts.has(fingerprint);
    const trusted = isTrustedScript(scriptEl);

    if (isKnown) return;

    if (scriptEl.src && !trusted) {
      report('untrusted_external_script', 'xss_injection', {
        origin,
        src: scriptEl.src
      }, 28, 'high');
      return;
    }

    if (!scriptEl.src) {
      const content = scriptEl.textContent || '';
      if (matchesAnyPattern(content, ATTACK_PATTERNS.xssPayload)) {
        report('inline_script_with_payload', 'xss_injection', {
          origin,
          sample: content.slice(0, 220)
        }, 32, 'high');
      }

      if (matchesAnyPattern(content, ATTACK_PATTERNS.mitmPayload)) {
        report('suspicious_inline_rewrite', 'mitm_behavior', {
          origin,
          sample: content.slice(0, 220)
        }, 26, 'medium');
      }
    }
  }

  function inspectElementAttributes(el) {
    Array.from(el.attributes || []).forEach((attr) => {
      const attrName = attr.name.toLowerCase();
      const attrValue = attr.value || '';

      if (attrName.startsWith('on') && matchesAnyPattern(attrValue, ATTACK_PATTERNS.xssPayload)) {
        report('suspicious_event_handler_payload', 'xss_injection', {
          attribute: attrName,
          sample: attrValue.slice(0, 180)
        }, 24, 'high');
      }

      if ((attrName === 'src' || attrName === 'href') && /^javascript:/i.test(attrValue)) {
        report('javascript_scheme_injection', 'xss_injection', {
          attribute: attrName,
          sample: attrValue.slice(0, 180)
        }, 26, 'high');
      }
    });
  }

  function observeMutations() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;

          if (node.tagName === 'SCRIPT') {
            inspectScriptElement(node, 'direct_script_addition');
          }

          node.querySelectorAll?.('script').forEach((script) => inspectScriptElement(script, 'nested_script_addition'));

          inspectElementAttributes(node);
          node.querySelectorAll?.('*').forEach(inspectElementAttributes);
        }
      }
    });

    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: false
    });
  }

  function observeCspViolations() {
    window.addEventListener('securitypolicyviolation', (event) => {
      const isInlineBlocked = event.violatedDirective?.includes('script-src')
        && event.blockedURI === 'inline';

      if (!isInlineBlocked) return;

      report('csp_blocked_inline_script', 'xss_injection', {
        directive: event.violatedDirective,
        sourceFile: event.sourceFile || 'inline',
        sample: `line ${event.lineNumber || 0}`
      }, 30, 'high');
    });
  }

  function init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        captureBaselineScripts();
      }, { once: true });
    } else {
      captureBaselineScripts();
    }

    observeMutations();
    observeCspViolations();
  }

  init();
})();
