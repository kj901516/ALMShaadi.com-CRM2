*** Begin Patch
*** Update File: src/lib/shareCard.ts
@@
 async function loadImage(dataUrl: string): Promise<HTMLImageElement> {
   return new Promise((resolve, reject) => {
     const img = new Image();
-    // Allow cross-origin images to be loaded for drawing into canvas when the
-    // remote host provides the appropriate CORS headers. This fixes a bug
-    // where images uploaded as data URLs work immediately after creation but
-    // fail when re-loaded from Supabase public URLs (canvas becomes tainted)
-    // because the Image element wasn't set to request CORS-enabled resources.
-    img.crossOrigin = 'anonymous';
+    // Allow cross-origin images to be loaded for drawing into canvas when the
+    // remote host provides the appropriate CORS headers. This fixes a bug
+    // where images uploaded as data URLs work immediately after creation but
+    // fail when re-loaded from Supabase public URLs (canvas becomes tainted)
+    // because the Image element wasn't set to request CORS-enabled resources.
+    img.crossOrigin = 'anonymous';
     img.onload = () => resolve(img);
     img.onerror = reject;
     img.src = dataUrl;
   });
 }
*** End Patch