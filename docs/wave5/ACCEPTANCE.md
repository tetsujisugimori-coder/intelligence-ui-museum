# Wave 5 fixed acceptance (2026-11-15 JST)
Baseline main 62a66d1140e79b72ae6e6d3ad7867ded1db673cd, tree d733de6a4ffeb6fd41dfb7b2f04cda2a0489fac7. Issue #56. Preserve previous 135 dataset entries and all v09/v10/SDK/lock bytes.

136: three stable nodes a,b,c and initial a→b. Move selected node by 10 logical units using buttons/arrow keys, bounds x=0..240 y=0..160. Add/delete directed edges by IDs. Reject self, duplicate and path-closing cycle without state changes. Undo/redo immutable snapshots; new edit discards redo; Reset restores initial graph. Native controls; after edit focus returns to initiating control, Reset to node selector. SVG edges derive endpoints from stable node IDs, not ordering.
137: fixed records a1,a2 in group A and b1 in group B; Overview aggregate 3, Group lists selected group's members, Detail displays selected record. Level 0..2, zoom clamp at endpoints; record identity retained between levels; group change selects its first record. Reset level0/groupA/recorda1. Buttons/selects support keyboard; focus retained after redraw.
138: initial h0 value0, +/-1 create immutable child snapshots with stable monotonic IDs and parent IDs. Selecting any past node restores without deletion; creating a child preserves siblings. Compare selected history with another node using value difference. Reset recreates h0 only. Max100 history nodes and values -100..100; refuse limits unchanged. Focus retained after redraw; Reset to operation button.

All are educational reproductions with fictional in-memory data, no dependencies/network. Gallery redraw resets demos. Native keyboard Tab/Enter/Space; 136 arrows on move control. Accessible status, selected labels, focus outlines and internal canvas scroll, no document overflow.

Fixed browser matrix: Chromium/WebKit ×375/390/1280×light/dark (12), each375dark reduced-motion + measured actual text2x (2). Verify all operations/negative boundaries/restoration/focus/console/pageerror and resource response bytes with same-context HAR; do not equate emulation to Safari/VoiceOver/physical touch/OS font zoom.

Negative controls:136 cycle,duplicate,edge endpoint offset,undo mismatch;137 selection loss,level/data mismatch,level overflow,text2x obstruction;138 history deletion,wrong restored value,parent corruption,Reset stale reference. Each paired with normal control and explicit semantic rejection, not timeout/syntax/startup error. Missing description and missing resource must fail.

Separate technical/CI/evidence/merge judgments. Independent reviewer checks false acceptance and protected data. Original ZIP save/refetch independent SHA/CRC/manifest; access/retention UNKNOWN unless verified. Stage3 HOLD/v10 NO/PR46 SUSPENDED, no merge/release/deploy.

Independent review amendment before final verification: edge arrow endpoints stop at node rectangle boundaries instead of hidden centers. Moves that would bring node rectangles within10 logical units are rejected unchanged. SVG node labels are included in actual measured text2x. Prior center-based diagnostic and missed-label font audit retained as failed evidence, not silently treated as acceptance.

Focus boundary clarification (before P2 re-verification): 137 upper Detail endpoint moves focus to enabled out, lower Overview endpoint to enabled in. 136 exhausted Undo moves to Redo, exhausted Redo to Undo. Otherwise initiating enabled control retains focus. Reset targets remain unchanged. These continuation targets replace the unintended Reset fallback; no state or limit changes.
