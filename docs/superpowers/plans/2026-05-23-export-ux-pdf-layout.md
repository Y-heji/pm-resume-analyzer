# Export UX + PDF Layout Optimization

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Export shows clear format choice (PDF/Word) before downloading; PDF layout is professionally optimized for AI PM resumes.

**Architecture:** Preview page top-bar gets a single "Export" button that reveals PDF/Word options on click. PDF document typography and spacing refined for professional resume feel.

**Tech Stack:** @react-pdf/renderer, docx

---

### Task 1: Export Button UX — Show Choices Before Download

**Files:**
- Modify: `app/rewrite/[id]/preview/page.tsx`

- [ ] **Step 1: Add export menu state**

Add a `showExportMenu` state. When user clicks "Export", toggle the menu open. Menu shows two buttons: "PDF" and "Word (.docx)". Clicking either triggers the download.

```tsx
const [showExportMenu, setShowExportMenu] = useState(false);
```

- [ ] **Step 2: Replace button area with menu**

Replace the two-button layout with a single "Export" button that toggles a dropdown:

```tsx
<div className="relative">
  <button onClick={() => setShowExportMenu(!showExportMenu)}
    className="px-3.5 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-md hover:bg-gray-800 flex items-center gap-1.5">
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
    Export
  </button>
  {showExportMenu && (
    <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
      <button onClick={() => { exportFile("pdf"); setShowExportMenu(false); }}
        className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2">
        PDF
      </button>
      <button onClick={() => { exportFile("word"); setShowExportMenu(false); }}
        className="w-full text-left px-3 py-2 text-xs hover:bg-gray-50 flex items-center gap-2">
        Word (.docx)
      </button>
    </div>
  )}
</div>
```

- [ ] **Step 3: Click outside to close menu**

Add a useEffect that closes the menu when clicking outside:

```tsx
useEffect(() => {
  if (!showExportMenu) return;
  const handler = () => setShowExportMenu(false);
  document.addEventListener("click", handler);
  return () => document.removeEventListener("click", handler);
}, [showExportMenu]);
```

### Task 2: PDF Layout — Typography & Spacing Refinement

**Files:**
- Modify: `lib/resume-templates.ts`
- Modify: `components/resume-pdf-document.tsx`

- [ ] **Step 1: Tighten spacing for higher density**

Current AI PM template: `sectionGap: 5, entryGap: 6`. Reduce to `sectionGap: 3, entryGap: 4`.

- [ ] **Step 2: Refine typography hierarchy**

Section titles: `fontWeight: 500` (was 600), `letterSpacing: 0.5` (was 0.8). Subtler sections.

Entry titles: Add `marginBottom: 1` for tighter attachment to subtitle.

Contact row: `lineHeight: 1.3` (was 1.4).

- [ ] **Step 3: Bullet format — cleaner spacing**

Bullet items: `marginLeft: 8, textIndent: -8` (was 10/-10). Closer to left edge.

- [ ] **Step 4: Summary — slightly larger**

Summary font: Use same size as body but `lineHeight: 1.5` for better readability.
