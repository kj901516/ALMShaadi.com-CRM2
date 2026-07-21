*** Begin Patch
*** Update File: src/components/ProfileForm.tsx
@@
   const handleSave = async () => {
     if (!p.fullName.trim()) {
       alert('Full Name is required');
       focusField('fullName');
       return;
     }
-    // DEBUG: log photos before saving (immediately after profile creation)
-    try {
-      // eslint-disable-next-line no-console
-      console.log('DEBUG: ProfileForm.handleSave - photos before save:', p.photos?.map((ph) => ({ id: ph.id, dataUrlPreview: String(ph.dataUrl).slice(0, 100) })));
-    } catch (e) {
-      /* ignore */
-    }
-    setSaving(true);
+    // DEBUG: log photos before saving (immediately after profile creation)
+    try {
+      // eslint-disable-next-line no-console
+      console.log('DEBUG: ProfileForm.handleSave - photos BEFORE save:', p.photos?.map((ph) => ({ id: ph.id, dataUrlPreview: String(ph.dataUrl).slice(0, 120) })));
+    } catch (e) {
+      /* ignore */
+    }
+    setSaving(true);
*** End Patch