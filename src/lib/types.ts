*** Begin Patch
*** Update File: src/lib/types.ts
@@
   prefMaritalStatus: string[];
-  prefDisabilityStatus: DisabilityStatus;
+  prefDisabilityStatus: DisabilityStatus;
+  prefLocalMuhajir?: string;
@@
-  prefMaritalStatus: [],
-  prefDisabilityStatus: '',
+  prefMaritalStatus: [],
+  prefDisabilityStatus: 'None',
+  prefLocalMuhajir: 'Any',
*** End Patch