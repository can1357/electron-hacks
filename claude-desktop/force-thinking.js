(function() {
   const COOLDOWN_MS = 500;
   let lastClick = 0;

   function findThinkingButton() {
      return document.querySelector('button[aria-label="Extended thinking"]');
   }

   function tryForceThinking() {
      if (Date.now() - lastClick < COOLDOWN_MS) return;
      const btn = findThinkingButton();
      if (btn && btn.getAttribute('aria-pressed') === 'false') {
         lastClick = Date.now();
         btn.click();
         console.log('[Thinking] Force-enabled extended thinking');
      }
   }

   new MutationObserver(tryForceThinking).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-pressed'] });

   setInterval(tryForceThinking, 500);

   console.log('[Thinking] Force-thinking active');
})();
