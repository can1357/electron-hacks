// Preload script - runs before page loads
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
            console.log('[YOLO] Auto-approved:', btn.textContent?.trim());
         }
      }

      setTimeout(() => {
         hydrated = true;
         new MutationObserver(tryAutoApprove).observe(document.body, { childList: true, subtree: true });
         setInterval(tryAutoApprove, 500);
         console.log('[YOLO] Auto-approve active');
      }, HYDRATION_DELAY_MS);
   })();

   // Force extended thinking
   (function() {
      let ready = false;

      function isButtonReady() {
         const btn = document.querySelector('button[aria-label="Extended thinking"]');
         return btn && btn.offsetParent !== null && !btn.disabled; // visible and enabled
      }

      function tryForceThinking() {
         const btn = document.querySelector('button[aria-label="Extended thinking"]');
         if (btn && btn.getAttribute('aria-pressed') === 'false') {
            btn.click();
            console.log('[Thinking] Force-enabled extended thinking');
         }
      }

      function waitForReady() {
         if (isButtonReady()) {
            if (!ready) {
               ready = true;
               console.log('[Thinking] Button detected, activating');
               setTimeout(tryForceThinking, 100); // small delay after button appears
            }
            tryForceThinking();
         } else {
            ready = false;
         }
      }

      setInterval(waitForReady, 500);
   })();
});
