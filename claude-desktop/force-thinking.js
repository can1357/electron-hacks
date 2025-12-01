(function() {
   const COOLDOWN_MS = 500;
   const HYDRATION_DELAY_MS = 2000;
   let lastClick = 0;
   let hydrated = false;

   function findThinkingButton() {
      return document.querySelector('button[aria-label="Extended thinking"]');
   }

   function tryForceThinking() {
      if (!hydrated) return;
      if (Date.now() - lastClick < COOLDOWN_MS) return;
      const btn = findThinkingButton();
      if (btn && btn.getAttribute('aria-pressed') === 'false') {
         lastClick = Date.now();
         btn.click();
         console.log('[Thinking] Force-enabled extended thinking');
      }
   }

   // Wait for React hydration to complete before observing
   setTimeout(() => {
      hydrated = true;
      new MutationObserver(tryForceThinking).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-pressed'] });
      setInterval(tryForceThinking, 500);
      tryForceThinking();
      console.log('[Thinking] Force-thinking active');
   }, HYDRATION_DELAY_MS);

   console.log('[Thinking] Waiting for hydration...');
})();
