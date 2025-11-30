(function() {
   const COOLDOWN_MS = 300;
   let lastClick = 0;

   const ALLOW_PATTERNS = [
      'always allow',
      'allow always',
      'allow once',
   ];

   function findAllowButton() {
      // Try multiple dialog selectors
      const dialogs = document.querySelectorAll('[role="dialog"], [data-state="open"], .modal, [class*="dialog"], [class*="Dialog"]');
      for (const dialog of dialogs) {
         const buttons = Array.from(dialog.querySelectorAll('button'));
         for (const pattern of ALLOW_PATTERNS) {
            const btn = buttons.find(b => b.textContent?.toLowerCase().includes(pattern));
            if (btn) return btn;
         }
      }
      // Fallback: search all buttons on page
      const allButtons = Array.from(document.querySelectorAll('button'));
      for (const pattern of ALLOW_PATTERNS) {
         const btn = allButtons.find(b => b.textContent?.toLowerCase().includes(pattern));
         if (btn) return btn;
      }
      return null;
   }

   function tryAutoApprove() {
      if (Date.now() - lastClick < COOLDOWN_MS) return;
      const btn = findAllowButton();
      if (btn) {
         lastClick = Date.now();
         btn.click();
         console.log('[YOLO] Auto-approved:', btn.textContent?.trim());
      }
   }

   // MutationObserver for immediate response
   new MutationObserver(tryAutoApprove).observe(document.body, { childList: true, subtree: true });

   // Interval fallback
   setInterval(tryAutoApprove, 200);

   console.log('[YOLO] Auto-approve active');
})();
