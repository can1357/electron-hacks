(function() {
   const COOLDOWN_MS = 300;
   const HYDRATION_DELAY_MS = 2000;
   let lastClick = 0;
   let hydrated = false;

   const ALLOW_PATTERNS = [
      'always allow',
      'allow always',
      'allow once',
   ];

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

   // Wait for React hydration to complete before observing
   setTimeout(() => {
      hydrated = true;
      new MutationObserver(tryAutoApprove).observe(document.body, { childList: true, subtree: true });
      setInterval(tryAutoApprove, 500);
      console.log('[YOLO] Auto-approve active');
   }, HYDRATION_DELAY_MS);

   console.log('[YOLO] Waiting for hydration...');
})();
