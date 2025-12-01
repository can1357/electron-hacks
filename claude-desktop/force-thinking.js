// Legacy DOM-based approach
(function() {
   const POLL_INTERVAL_MS = 1000;
   const INITIAL_DELAY_MS = 3000;

   function tryForceThinking() {
      const btn = document.querySelector('button[aria-label="Extended thinking"]');
      if (btn && btn.getAttribute('aria-pressed') === 'false') {
         (window.requestIdleCallback || setTimeout)(() => {
            const btn = document.querySelector('button[aria-label="Extended thinking"]');
            if (btn && btn.getAttribute('aria-pressed') === 'false') {
               btn.click();
               console.log('[Thinking] Force-enabled extended thinking');
            }
         }, { timeout: 500 });
      }
   }

   setTimeout(() => {
      setInterval(tryForceThinking, POLL_INTERVAL_MS);
      console.log('[Thinking] Force-thinking active (polling mode)');
   }, INITIAL_DELAY_MS);
})();

/*
// Paprika fetch interceptor (alternative to DOM clicking)
(function() {
   const originalFetch = window.fetch;
   window.fetch = async function(url, options) {
      const urlStr = typeof url === 'string' ? url : url?.toString?.() || '';

      // Force paprika_mode on chat_conversations (PUT = toggle, POST = new chat)
      if (urlStr.includes('/chat_conversations') && (options?.method === 'PUT' || options?.method === 'POST')) {
         try {
            let body = JSON.parse(options.body);
            if (body && typeof body === 'object') {
               if (body.settings?.paprika_mode === null) {
                  body.settings.paprika_mode = 'extended';
                  options = { ...options, body: JSON.stringify(body) };
                  console.log('[Thinking] Blocked paprika_mode disable');
               }
               if (options?.method === 'POST' && body.uuid) {
                  body.settings = body.settings || {};
                  body.settings.paprika_mode = 'extended';
                  options = { ...options, body: JSON.stringify(body) };
                  console.log('[Thinking] Injected paprika_mode for new chat');
               }
            }
         } catch {}
      }

      return originalFetch.call(this, url, options);
   };
   console.log('[Thinking] Fetch interceptor active');
})();
*/
