(function() {
   const COOLDOWN_MS = 500;
   let lastClick = 0;

   new MutationObserver(() => {
      if (Date.now() - lastClick < COOLDOWN_MS) return;
      const dialog = document.querySelector('[role="dialog"][data-state="open"]');
      if (!dialog) return;
      const btn = Array.from(dialog.querySelectorAll('button'))
         .find(b => b.textContent?.trim() === 'Allow always');
      if (btn) {
         lastClick = Date.now();
         btn.click();
         console.log('[YOLO] Auto-approved MCP tool');
      }
   }).observe(document.body, { childList: true, subtree: true });

   console.log('[YOLO] MCP auto-approve active');
})();
