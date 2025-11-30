(function() {
   const COOLDOWN_MS = 500;
   let lastClick = 0;

   const ALLOW_PATTERNS = [
      'allow always',
      'always allow',
      'allow once',
   ];

   function findButton(buttons, pattern) {
      return buttons.find(b => b.textContent?.toLowerCase().includes(pattern));
   }

   new MutationObserver(() => {
      if (Date.now() - lastClick < COOLDOWN_MS) return;
      const dialog = document.querySelector('[role="dialog"][data-state="open"]');
      if (!dialog) return;
      const buttons = Array.from(dialog.querySelectorAll('button'));
      for (const pattern of ALLOW_PATTERNS) {
         const btn = findButton(buttons, pattern);
         if (btn) {
            lastClick = Date.now();
            btn.click();
            console.log('[YOLO] Auto-approved:', btn.textContent?.trim());
            return;
         }
      }
   }).observe(document.body, { childList: true, subtree: true });

   console.log('[YOLO] Auto-approve active');
})();
