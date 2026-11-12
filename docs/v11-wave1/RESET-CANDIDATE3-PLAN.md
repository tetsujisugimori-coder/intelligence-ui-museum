# Third single-factor pre-registration — 2026-11-13 JST

Candidate2 fieldset display:grid still failed9/9. Computed display confirms grid applied; fieldset remains a flex item and still loses42px. Thus changing its internal layout alone does not support a fix.

Candidate3 starts from original bytes and changes only Query `[data-wave1="124"] [data-w1-controls] { display:grid; }`. Hypothesis: the fieldset's outer sizing as a flex item is the unstable boundary, rather than inline descendant layout. Grid retains vertical rows and existing gap while removing fieldset from flex sizing, scoped to Query only. Same3 observer modes ×3 runs before adoption. All prior failures retained. No source fixes until supported. If stable/pass, follow with fixed14 under lock-matched browsers and CI HTTP, and independent review/native retest.
