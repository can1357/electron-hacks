// Preload script - runs before page loads
const _log = console.log.bind(console);
const _fetch = window.fetch.bind(window);

// Block telemetry at fetch level
const BLOCKED_HOSTS = ['a-api.anthropic.com', 'sentry.io'];
window.fetch = function(url, opts) {
   try {
      const u = new URL(url, location.href);
      if (BLOCKED_HOSTS.some(h => u.hostname.endsWith(h)) || u.pathname.startsWith('/sentry')) {
         return Promise.resolve(new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }));
      }
   } catch {}
   return _fetch(url, opts);
};

window.addEventListener('DOMContentLoaded', () => {
   if (!location.href.includes('claude.ai')) return;

   // Auto-approve (YOLO mode)
   (function() {
      const COOLDOWN_MS = 500;
      const HYDRATION_DELAY_MS = 2000;
      let lastClick = 0;
      let hydrated = false;

      const ALLOW_PATTERNS = ['always allow', 'allow always', 'allow once'];

      function findAllowButton() {
         const dialogs = document.querySelectorAll('[role="dialog"], [data-state="open"], .modal, [class*="dialog"], [class*="Dialog"]');
         for (const dialog of dialogs) {
            const buttons = Array.from(dialog.querySelectorAll('button'));
            for (const pattern of ALLOW_PATTERNS) {
               const btn = buttons.find(b => b.textContent?.toLowerCase().includes(pattern));
               if (btn) return btn;
            }
         }
         const allButtons = Array.from(document.querySelectorAll('button'));
         for (const pattern of ALLOW_PATTERNS) {
            const btn = allButtons.find(b => b.textContent?.toLowerCase().includes(pattern));
            if (btn) return btn;
         }
         return null;
      }

      function tryAutoApprove() {
         if (!hydrated) return;
         if (Date.now() - lastClick < COOLDOWN_MS) return;
         const btn = findAllowButton();
         if (btn) {
            lastClick = Date.now();
            btn.click();
            _log('[YOLO] Auto-approved:', btn.textContent?.trim());
         }
      }

      setTimeout(() => {
         hydrated = true;
         new MutationObserver(tryAutoApprove).observe(document.body, { childList: true, subtree: true });
         setInterval(tryAutoApprove, 500);
         _log('[YOLO] Auto-approve active');
      }, HYDRATION_DELAY_MS);
   })();

   // Force extended thinking (only when user is typing)
   (function() {
      function canSend() {
         const sendBtn = document.querySelector('button[aria-label="Send message"]');
         return sendBtn && !sendBtn.disabled;
      }

      function tick() {
         if (!canSend()) return;
         const btn = document.querySelector('button[aria-label="Extended thinking"]');
         if (btn && btn.offsetParent !== null && !btn.disabled && btn.getAttribute('aria-pressed') === 'false') {
            btn.click();
            _log('[Thinking] Force-enabled extended thinking');
         }
      }
      setInterval(tick, 500);
   })();
});
