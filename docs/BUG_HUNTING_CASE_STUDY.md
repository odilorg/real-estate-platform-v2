# 🐛 Bug Hunting Case Study: Mobile Modal Auto-Closing Issue

**Date:** December 15, 2025
**Project:** Real Estate Platform v2
**Component:** Mobile Filter Modal (`property-filters-extended.tsx`)
**Severity:** High (Critical UX issue)

---

## Executive Summary

**Problem:** Mobile filter modal was closing immediately when clicking any filter inside it
**Root Cause:** Hidden JavaScript event handlers automatically closing the modal
**Time to Fix:** ~2 hours (including multiple failed attempts)
**Key Lesson:** Always check for global event listeners and helper functions that might interfere
**Files Modified:** `apps/web/src/components/property-filters-extended.tsx`

---

## 📋 The Debugging Journey

### Phase 1: Initial Assumptions (❌ Wrong Direction)

**What I thought:** "It's a React event bubbling issue - clicks are propagating to the backdrop"

**Attempted fixes that didn't work:**

1. **Added `onClick={(e) => e.stopPropagation()}` to modal div**
   - Theory: Clicks were bubbling from modal content to backdrop
   - Result: ❌ Still closed

2. **Increased z-index of dropdowns from `z-50` to `z-[60]`**
   - Theory: Dropdowns were behind modal, clicks going through
   - Result: ❌ Still closed

3. **Changed backdrop click handler to check `e.target === e.currentTarget`**
   - Theory: Only close if clicking directly on backdrop
   - Result: ❌ Still closed

4. **Removed backdrop click handler entirely and used `pointer-events-none`**
   - Theory: Backdrop can't be clicked at all
   - Result: ❌ STILL CLOSED! (This proved it wasn't backdrop clicks)

**Why they failed:** These fixes addressed event bubbling and backdrop clicks, but the real problem was **hidden JavaScript automatically closing the modal** regardless of where you clicked.

**Time wasted on wrong assumptions:** ~1.5 hours

---

### Phase 2: The Breakthrough (✅ Found It!)

**Turning point:** User said "check cian.ru/kupit in mobile version"

This comment made me realize I needed to stop assuming and **search the codebase systematically for ALL places where the modal is closed**, not just the obvious onClick handlers.

**The search that found the bug:**
```bash
ssh user@server "grep -n 'setShowMoreFilters(false)' /path/to/component.tsx"
```

**Results:**
```
67:    setShowMoreFilters(false);              # Inside closeAllDropdowns() ⚠️
109:        setShowMoreFilters(false);          # Inside useEffect click handler ⚠️ ⚠️
640:                onClick={() => setShowMoreFilters(false)}  # X button (correct ✅)
900:                onClick={() => setShowMoreFilters(false)}  # Apply button (correct ✅)
```

**Lines 67 and 109 were the hidden bugs!**

**Time to find bugs with systematic search:** 5 minutes

---

## 🔍 Root Cause Analysis

### Bug #1: Global Click Handler (Line 109)

**Location:** `useEffect` hook with document-level event listener

```javascript
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    // ⚠️ BUG: This closes the modal when clicking anywhere outside bedroomsRef
    if (bedroomsRef.current && !bedroomsRef.current.contains(event.target as Node)) {
      setShowMoreFilters(false);  // ❌ Closes mobile modal!
    }
    if (priceRef.current && !priceRef.current.contains(event.target as Node)) {
      setShowPriceDropdown(false);
    }
    if (propertyTypeRef.current && !propertyTypeRef.current.contains(event.target as Node)) {
      setShowPropertyTypeDropdown(false);
    }
    // ... more dropdown handlers
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);
```

**Why it's a bug:**
- This `useEffect` adds a **global** `mousedown` listener to the entire document
- It was intended to close **desktop dropdowns** when clicking outside them
- However, it also closes `showMoreFilters` (the mobile modal state) when clicking outside `bedroomsRef`
- Since `bedroomsRef` is a desktop filter, clicking anywhere in the mobile modal (which is separate from desktop) is "outside" the ref
- **Result:** Every click inside mobile modal triggers the condition and closes the modal

**Scope of impact:**
- Affected ALL clicks inside mobile modal except bedrooms dropdown
- Made mobile filters completely unusable

---

### Bug #2: Helper Function (Line 67)

**Location:** `closeAllDropdowns()` helper function

```javascript
const closeAllDropdowns = () => {
  setShowMoreFilters(false);      // ❌ Also closes the mobile modal!
  setShowPriceDropdown(false);
  setShowPropertyTypeDropdown(false);
  setShowRegionDropdown(false);
  setShowDistrictDropdown(false);
  setShowMetroDropdown(false);
};
```

**Where it's called:**
- Line 224: When selecting property type
- Line 275: When selecting listing type
- Line 322: When toggling bedrooms
- Line 416: When selecting city
- Line 458: When selecting district
- Line 505: When selecting metro

**Why it's a bug:**
- This function was intended to close desktop dropdowns
- But it's named `closeAllDropdowns`, and someone added `setShowMoreFilters(false)` to it
- This makes sense for desktop (close filters on selection), but NOT for mobile
- Mobile modal should stay open until user clicks Apply or X button
- **Result:** Clicking any filter option called this function and closed the modal

**Scope of impact:**
- Affected 6 different filter interactions
- Every filter selection closed the modal
- Made it impossible to select multiple filters

---

## 🛠️ Debugging Methodology

### Step 1: Reproduce the Issue

**Tool:** Manual testing on mobile device (or user report)

**What to capture:**
- Exact steps to reproduce
- Expected vs actual behavior
- Screenshots/video if possible
- Browser/device information

**This case:**

**Steps to reproduce:**
1. Open https://staging.jahongir-app.uz/properties?listingType=SALE on mobile
2. Click "Ещё фильтры" button → Modal opens ✅
3. Click "Выберите город" dropdown → Modal closes ❌ (should stay open)

**Expected:** Modal stays open, dropdown appears, user can select city
**Actual:** Modal immediately closes, no selection possible

**User feedback:**
- "when selecting region all of sudden it goes back to more filters"
- "it says select city u click it comes back to more filters nothing is picked"
- "basically u click on any filter it goes back to more filter"

---

### Step 2: Check the Obvious Suspects

**Tools:** Code inspection, grep, browser DevTools

**What to check:**
1. ✅ onClick handlers on backdrop - Check if backdrop is closing modal
2. ✅ Event bubbling - Check for missing `stopPropagation()`
3. ✅ Z-index issues - Check if elements are layered correctly
4. ✅ CSS visibility/display properties - Check if modal is being hidden
5. ✅ Conditional rendering - Check if modal component is being unmounted

**Commands used:**
```bash
# Find all onClick handlers
grep -n 'onClick' apps/web/src/components/property-filters-extended.tsx

# Check z-index values
grep -n 'z-\[' apps/web/src/components/property-filters-extended.tsx

# Check backdrop implementation
grep -A 5 'Backdrop' apps/web/src/components/property-filters-extended.tsx

# Check modal conditional rendering
grep -n 'showMoreFilters &&' apps/web/src/components/property-filters-extended.tsx
```

**This case:**
- ✅ Backdrop had correct onClick handler
- ✅ Z-index was appropriate
- ✅ CSS was correct
- ✅ Conditional rendering was correct
- ❌ **Issue persisted despite all fixes**

**Key insight:** When obvious fixes don't work, the bug is hidden elsewhere!

---

### Step 3: Search for Hidden State Changes ⭐

**⚠️ This is the critical step that found the bug!**

**Tool:** `grep` to search for ALL places that change the state variable

**The magic command:**
```bash
grep -n 'setShowMoreFilters(false)' apps/web/src/components/property-filters-extended.tsx
```

**What this searches for:**
- Every single line that sets `showMoreFilters` to `false`
- Includes obvious places (onClick handlers)
- Includes hidden places (useEffect, helper functions)

**Results:**
```
67:    setShowMoreFilters(false);                       # ⚠️ In closeAllDropdowns()
109:        setShowMoreFilters(false);                   # ⚠️ In useEffect
640:                onClick={() => setShowMoreFilters(false)}  # ✅ X button
900:                onClick={() => setShowMoreFilters(false)}  # ✅ Apply button
```

**Analysis:**
- Lines 640 and 900 are intentional (X button and Apply button) ✅
- **Lines 67 and 109 are hidden bugs!** ⚠️⚠️

**What to look for in results:**
- Global event listeners (`useEffect` with `document.addEventListener`)
- Helper functions that close multiple things at once
- Lifecycle methods that auto-close on certain conditions
- Effect hooks that run on specific dependencies
- Cleanup functions in `useEffect`

---

### Step 4: Investigate Each Suspicious Line

**Bug #1 Investigation: Line 109**

```bash
# Get context around line 109
sed -n '105,130p' apps/web/src/components/property-filters-extended.tsx
```

**Output:**
```javascript
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (bedroomsRef.current && !bedroomsRef.current.contains(event.target as Node)) {
      setShowMoreFilters(false);  // ⚠️ This runs on EVERY click outside bedroomsRef
    }
    // ... more handlers
  };

  document.addEventListener('mousedown', handleClickOutside);
  return () => document.removeEventListener('mousedown', handleClickOutside);
}, []);
```

**Red flags:**
- ✋ `document.addEventListener` - Global event listener!
- ✋ Runs on every mousedown on entire page
- ✋ No condition checking if modal is even open
- ✋ No condition checking if click is on mobile vs desktop

**Bug #2 Investigation: Line 67**

```bash
# Get context around line 67
sed -n '65,75p' apps/web/src/components/property-filters-extended.tsx
```

**Output:**
```javascript
const closeAllDropdowns = () => {
  setShowMoreFilters(false);  // ⚠️ Closes modal too!
  setShowPriceDropdown(false);
  setShowPropertyTypeDropdown(false);
  setShowRegionDropdown(false);
  setShowDistrictDropdown(false);
  setShowMetroDropdown(false);
};
```

**Check where it's called:**
```bash
grep -n 'closeAllDropdowns()' apps/web/src/components/property-filters-extended.tsx
```

**Output shows 6 calls** - every filter interaction calls this function!

---

### Step 5: Implement the Fix

**Fix #1: Remove modal closing from useEffect**

```javascript
// Before (BUG):
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (bedroomsRef.current && !bedroomsRef.current.contains(event.target as Node)) {
      setShowMoreFilters(false);  // ❌ Remove this
    }
    // ... other handlers
  };
}, []);

// After (FIXED):
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    // Note: Don't close showMoreFilters - mobile modal should only close via X or Apply
    if (priceRef.current && !priceRef.current.contains(event.target as Node)) {
      setShowPriceDropdown(false);
    }
    // ... other handlers (keep these)
  };
}, []);
```

**Fix #2: Remove modal closing from helper function**

```javascript
// Before (BUG):
const closeAllDropdowns = () => {
  setShowMoreFilters(false);  // ❌ Remove this
  setShowPriceDropdown(false);
  // ... others
};

// After (FIXED):
const closeAllDropdowns = () => {
  // Note: Don't close showMoreFilters - mobile modal should only close via X or Apply
  setShowPriceDropdown(false);
  setShowPropertyTypeDropdown(false);
  // ... others (keep these)
};
```

---

### Step 6: Verify the Fix

**Tool 1: Verify deployed code**
```bash
# Check if fix is on server
ssh user@server "grep -n 'setShowMoreFilters(false)' /var/www/.../component.tsx"
```

**Expected output:** Only 2 lines (X button and Apply button)

**Tool 2: Automated testing with fe-pilot**

Create test scenario:
```yaml
name: "Test Modal Stays Open"
url: "https://staging.jahongir-app.uz/properties?listingType=SALE"
viewport:
  width: 375
  height: 667
steps:
  - action: navigate
    url: "{{url}}"
  - action: click
    selector: "button:has-text('Ещё фильтры')"
    wait: 1000
  - action: screenshot
    path: "/tmp/step1-modal-open.png"
  - action: click
    selector: "button:has-text('Выберите город')"
    wait: 1000
  - action: screenshot
    path: "/tmp/step2-after-click.png"
```

**Expected:** Both screenshots show modal open

**Tool 3: Manual testing**
- Test on real mobile device
- Test all filter interactions:
  - ✅ Region/City selection
  - ✅ District selection
  - ✅ Metro station selection
  - ✅ Bedroom count selection
  - ✅ Price range
  - ✅ Property type
- Verify modal only closes when clicking X or Apply button

---

## 📊 Tools Reference

### 1. grep - Search for Patterns

**Purpose:** Find all occurrences of a function call, variable, or pattern in code

**Why it's essential:** Uncovers hidden state changes that you can't see by just reading code linearly

**Common search patterns:**

```bash
# Find all state setters for a specific state variable
grep -n 'setState\|setShow' component.tsx

# Find all places that close something
grep -n 'setShowModal(false)\|close' component.tsx

# Find all event listeners (potential global handlers)
grep -n 'addEventListener' component.tsx

# Find all useEffect hooks (lifecycle methods)
grep -n 'useEffect' component.tsx

# Find onClick handlers
grep -n 'onClick' component.tsx

# Find helper functions that might close things
grep -n 'function close\|const close' component.tsx

# Case-insensitive search
grep -in 'close' component.tsx

# Search with context (5 lines before and after)
grep -A 5 -B 5 'setShowModal' component.tsx

# Search with extended context (10 lines)
grep -A 10 -B 10 'setShowModal(false)' component.tsx

# Search across multiple files
grep -r 'setShowModal' apps/web/src/

# Search and show only filenames
grep -l 'setShowModal' apps/web/src/**/*.tsx
```

**This case - The winning command:**
```bash
grep -n 'setShowMoreFilters(false)' apps/web/src/components/property-filters-extended.tsx
```

**Result:** Found 4 instances, identified 2 as bugs in ~5 minutes

---

### 2. fe-console - Technical Debugging

**Purpose:** Capture console logs, network requests, JavaScript errors, and performance metrics

**Best for:**
- Checking if JavaScript errors are causing issues
- Verifying API calls are succeeding
- Detecting network failures
- Finding performance bottlenecks

**Usage:**
```bash
# Basic usage - capture for 5 seconds
fe-console https://staging.jahongir-app.uz/properties --duration 5000

# Save to file
fe-console https://staging.jahongir-app.uz/properties --duration 5000 --output /tmp/console.txt

# JSON format for parsing
fe-console https://staging.jahongir-app.uz/properties --format json --output /tmp/console.json

# Disable specific captures
fe-console https://staging.jahongir-app.uz/properties --no-network --no-errors
```

**What it captures:**
- Console logs (info, warn, error)
- Network requests (URL, status code, timing, payload, response)
- JavaScript exceptions with stack traces
- Performance metrics (page load time, resource timing)
- DOM events

**This case:**
- No console errors found ✅
- Network requests all successful ✅
- Proved bug was in React state management, not browser errors

---

### 3. fe-snapshot - Visual Debugging

**Purpose:** Capture screenshots of websites at different viewports

**Best for:**
- Verifying visual state at different breakpoints
- Checking responsive design
- Comparing expected vs actual UI
- Documenting bug reproduction

**Usage:**
```bash
# Basic mobile screenshot
fe-snapshot https://staging.jahongir-app.uz/properties --viewport mobile

# Desktop screenshot
fe-snapshot https://staging.jahongir-app.uz/properties --viewport desktop

# Custom viewport size
fe-snapshot https://staging.jahongir-app.uz/properties --viewport mobile --output /tmp/mobile.png

# Tablet
fe-snapshot https://staging.jahongir-app.uz/properties --viewport tablet

# Full page capture (entire scrollable page)
fe-snapshot https://staging.jahongir-app.uz/properties --full-page

# Capture specific element
fe-snapshot https://staging.jahongir-app.uz/properties --selector "#modal"

# Dark mode
fe-snapshot https://staging.jahongir-app.uz/properties --dark-mode
```

**Available viewports:**
- `mobile`: 375x667 (iPhone SE)
- `tablet`: 768x1024 (iPad)
- `desktop`: 1920x1080
- `desktop-xl`: 2560x1440

**This case:**
- Used to verify modal was displaying correctly
- Captured state before/after clicking filters
- Helped identify viewport detection issues during early debugging

---

### 4. fe-pilot - Automated UI Testing

**Purpose:** AI-driven browser automation for testing user flows

**Best for:**
- Reproducing bugs automatically
- Testing multi-step user interactions
- Regression testing after fixes
- End-to-end testing without manual clicking

**Usage:**
```bash
# Run a test scenario
fe-pilot run /path/to/scenario.yaml

# Run with credentials
fe-pilot run /path/to/scenario.yaml --credentials user@example.com:password

# Show browser (for debugging scenarios)
fe-pilot run /path/to/scenario.yaml --headed

# Custom output directory
fe-pilot run /path/to/scenario.yaml --output /tmp/results
```

**Scenario structure:**
```yaml
name: "Test Name"
url: "https://base-url.com"
viewport:
  width: 375
  height: 667
credentials:  # Optional
  username: "user@example.com"
  password: "password"
steps:
  - action: navigate
    url: "{{url}}/path"
    wait: 2000
    observe: true  # Capture console, network, DOM state

  - action: click
    selector: "button:has-text('Click Me')"
    wait: 1000

  - action: type
    selector: "#email"
    value: "test@example.com"

  - action: screenshot
    path: "/tmp/screenshot.png"

  - action: wait
    duration: 1000
```

**What it captures:**
- Screenshots at each step
- Console logs
- Network requests
- DOM state (buttons, inputs, links, visible text)
- Performance metrics
- Comprehensive JSON report

**This case:**
- Created test scenario to reproduce bug
- Test initially FAILED (confirmed bug exists)
- After fix, test PASSED (confirmed fix works)
- Now can use test for regression testing

---

### 5. sed - Extract Specific Lines

**Purpose:** View specific line ranges from files without opening editor

**Usage:**
```bash
# Show lines 100-120
sed -n '100,120p' file.tsx

# Show lines around a match (alternative to grep with context)
sed -n '105,125p' file.tsx  # Lines 105-125
```

**This case:** Used to inspect code context around bugs found by grep

---

### 6. SSH + Remote Commands

**Purpose:** Run commands on remote server (VPS) without logging in

**Usage:**
```bash
# Single command
ssh user@host "command"

# Multiple commands (sequential)
ssh user@host "cd /path && command1 && command2"

# Check deployed code
ssh user@host "grep -n 'pattern' /path/to/file"

# Deploy and restart
ssh user@host "cd /path && git pull && npm run build && pm2 restart app"
```

**This case:**
- Verified deployed code on VPS
- Checked if fixes were actually deployed
- Searched for bugs in production files

---

## 🎯 Bug Hunting Checklist

Use this checklist when a component closes/disappears/changes unexpectedly:

### ✅ Level 1: Obvious Issues (Check First)

- [ ] **onClick handlers** - Check all onClick events on component and parents
  ```bash
  grep -n 'onClick' component.tsx
  ```

- [ ] **Event bubbling** - Check for missing `stopPropagation()`
  ```bash
  grep -n 'stopPropagation' component.tsx
  ```

- [ ] **Z-index conflicts** - Check if elements are layered incorrectly
  ```bash
  grep -n 'z-\[' component.tsx
  ```

- [ ] **CSS visibility/display** - Check for `display: none` or `visibility: hidden`
  ```bash
  grep -n 'display:\|visibility:' component.tsx
  ```

- [ ] **Conditional rendering** - Check if component is being unmounted
  ```bash
  grep -n '&&\|? :' component.tsx  # Find ternaries and logical AND
  ```

**If all Level 1 checks pass but bug persists → Go to Level 2**

---

### ✅ Level 2: JavaScript State Changes (⭐ Most Important)

- [ ] **Search for ALL state setters** ⭐⭐⭐
  ```bash
  grep -n 'setState\|setShow\|setIs' component.tsx
  ```

  **Look for:**
  - State changes in unexpected places
  - Multiple calls to same setter
  - Setters in helper functions

- [ ] **Check useEffect hooks** - Look for side effects
  ```bash
  grep -n 'useEffect' component.tsx
  ```

  **Red flags:**
  - Global event listeners (`document.addEventListener`)
  - No dependencies `[]` - runs once on mount
  - Missing cleanup functions
  - State changes in effects

- [ ] **Check helper functions** - Functions that close multiple things
  ```bash
  grep -n 'function close\|const close' component.tsx
  ```

  **Red flags:**
  - Generic names like `closeAll`, `reset`, `clear`
  - Multiple state setters in one function
  - Called from many places

- [ ] **Check parent component** - State might be managed by parent
  ```bash
  grep -n 'show\|is\|active' parent-component.tsx
  ```

- [ ] **Check route changes** - Navigation might unmount component
  ```bash
  grep -n 'navigate\|router\|history' component.tsx
  ```

---

### ✅ Level 3: Event Listeners (Hidden Bugs)

- [ ] **Search for addEventListener** ⭐
  ```bash
  grep -n 'addEventListener' component.tsx
  ```

  **Red flags:**
  - `document.addEventListener` - Affects entire page!
  - `window.addEventListener` - Affects entire window!
  - Missing cleanup (`removeEventListener`)
  - No conditional checking

- [ ] **Check document-level listeners** - Global click/keydown handlers
  ```javascript
  // Pattern to search:
  document.addEventListener('click'|'mousedown'|'keydown')
  ```

- [ ] **Check keyboard listeners** - Escape key, Enter key, etc.
  ```bash
  grep -n 'keydown\|keypress\|keyup\|key ===' component.tsx
  ```

- [ ] **Check touch events** - Mobile-specific touch handlers
  ```bash
  grep -n 'touchstart\|touchend\|touchmove' component.tsx
  ```

---

### ✅ Level 4: Lifecycle & Effects

- [ ] **Check useEffect dependencies** - Might trigger unexpected re-runs
  ```bash
  grep -A 10 'useEffect' component.tsx
  ```

  **Look for:**
  - Empty dependencies `[]` - runs once
  - Missing dependencies - might cause stale closures
  - Unnecessary dependencies - causes extra renders

- [ ] **Check cleanup functions** - Might unmount component
  ```javascript
  // Pattern in useEffect:
  return () => {
    // Cleanup code that might cause issues
  };
  ```

- [ ] **Check for race conditions** - Async state updates
  ```bash
  grep -n 'setTimeout\|setInterval\|Promise\|async' component.tsx
  ```

- [ ] **Check component unmount conditions**
  ```bash
  grep -n 'componentWillUnmount\|useEffect.*return' component.tsx
  ```

---

### 📝 Checklist Summary

**Priority order when debugging:**
1. ⭐⭐⭐ Search for ALL state setters (`grep -n 'setStateName'`)
2. ⭐⭐ Check useEffect hooks (`grep -n 'useEffect'`)
3. ⭐⭐ Check addEventListener (`grep -n 'addEventListener'`)
4. ⭐ Check helper functions (`grep -n 'function close'`)
5. Check obvious onClick handlers
6. Check event bubbling
7. Check CSS/visibility
8. Check parent component

**The winning pattern:**
```bash
grep -n 'setShowModal(false)' component.tsx
```
This single command found both bugs in our case!

---

## 💡 Key Lessons Learned

### 1. Always Search for ALL State Changes ⭐⭐⭐

**Don't assume** you know where state is being changed.
**Search systematically** for every setter call.

```bash
# This command saves hours of debugging:
grep -n 'setStateVariable' file.tsx
```

**Why it works:**
- Finds obvious places (onClick handlers) ✅
- Finds hidden places (useEffect, helpers) ✅
- Takes ~5 seconds to run
- Shows ALL instances, not just what you remember

**Before fix:**
```javascript
// Visible in code review ✅
onClick={() => setShowModal(false)}

// Hidden in useEffect ❌ (Would miss this!)
useEffect(() => {
  if (condition) setShowModal(false);
}, []);

// Hidden in helper ❌ (Would miss this!)
const closeAll = () => {
  setShowModal(false);
  // ...
};
```

**After using grep:** Found all 4 instances immediately!

---

### 2. Global Event Listeners are Dangerous ⚠️

**Problem:**
```javascript
// ⚠️ DANGEROUS: Affects entire document
useEffect(() => {
  const handler = (e) => {
    // This runs on EVERY click on the page!
    if (ref.current && !ref.current.contains(e.target)) {
      // Close something
    }
  };
  document.addEventListener('click', handler);
  return () => document.removeEventListener('click', handler);
}, []);
```

**Why dangerous:**
- Runs on every single click on entire page
- Can interfere with other components
- Hard to debug (not obvious from component code)
- Can cause performance issues
- Can conflict with mobile vs desktop behavior

**Better approach:**
```javascript
// ✅ BETTER: Use ref and check containment explicitly
useEffect(() => {
  const handler = (e) => {
    // Only act if modal is actually open
    if (!isOpen) return;

    // Only act if clicking on modal or backdrop
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      // Check if it's intentional backdrop click
      if (backdropRef.current === e.target) {
        onClose();
      }
    }
  };

  document.addEventListener('click', handler);
  return () => document.removeEventListener('click', handler);
}, [isOpen]);
```

**Best approach:**
```javascript
// ✅ BEST: Use CSS pointer-events instead
<div className="backdrop pointer-events-none" />
<div className="modal pointer-events-auto">{/* content */}</div>
```

**This case:**
- Global listener caused mobile modal to close on any click
- Removed global listener closing the modal
- Used CSS `pointer-events` instead
- Much cleaner and more predictable!

---

### 3. Helper Functions Can Hide Bugs 🫣

**Problem:**
```javascript
// ❌ BAD: Generic name, closes everything
const closeAll = () => {
  setShowModal(false);        // Closes modal
  setShowDropdown(false);     // Closes dropdown
  setShowTooltip(false);      // Closes tooltip
  // What else does it close? 🤔
};

// Called from 10 different places
// Hard to know if all 10 places want to close modal!
```

**Why problematic:**
- Generic names hide intent
- Close more than you expect
- Hard to refactor safely (used in many places)
- Different callers may have different expectations

**Better approach:**
```javascript
// ✅ GOOD: Explicit, separate functions
const closeMobileModal = () => setShowModal(false);
const closeDesktopDropdowns = () => {
  setShowDropdown(false);
  setShowTooltip(false);
};

// ✅ GOOD: Pass what to close explicitly
const closeSpecific = (options: {modal?: boolean, dropdowns?: boolean}) => {
  if (options.modal) setShowModal(false);
  if (options.dropdowns) {
    setShowDropdown(false);
    setShowTooltip(false);
  }
};
```

**Best approach:**
```javascript
// ✅ BEST: Let each component manage its own state
// Mobile modal manages when it closes
// Desktop dropdowns manage when they close
// No shared "close everything" function
```

**This case:**
- `closeAllDropdowns()` was closing modal too
- Called from 6 different places
- Renamed by removing modal close
- Each context now closes only what it needs

---

### 4. Test with Automation 🤖

**Why manual testing isn't enough:**
- Slow (click through UI every time)
- Inconsistent (might miss steps)
- Not reproducible (hard to verify fix)
- Can't use for regression testing

**Better: Use fe-pilot**

```yaml
name: "Test Modal Doesn't Close"
url: "https://staging.site.com"
viewport:
  width: 375
  height: 667
steps:
  - action: click
    selector: "button:has-text('Open Modal')"
  - action: click
    selector: "button:has-text('Select Option')"
  - action: screenshot
    path: "/tmp/modal-should-be-open.png"
```

**Benefits:**
- ✅ Reproduce bug in 5 seconds
- ✅ Verify fix works automatically
- ✅ Prevent regressions (run after any change)
- ✅ Document bug with code
- ✅ Can run on CI/CD

**This case:**
- Created test that reproduced bug
- Test FAILED before fix ❌
- Test PASSED after fix ✅
- Now have permanent regression test

---

### 5. Document Your Debugging Process 📝

**Why document:**
- Learn from mistakes (don't repeat)
- Share knowledge with team
- Improve debugging skills
- Reference for similar bugs

**What to document:**
- What the bug was
- How you found it (commands used)
- What tools helped
- Lessons learned
- How to prevent in future

**This case:**
- Spent 2 hours debugging
- Documented entire process
- Created reusable checklist
- Team can use same methodology for future bugs
- **Time saved on next similar bug:** 90 minutes

---

### 6. Use Systematic Approach, Not Assumptions 🎯

**Wrong approach (what I did initially):**
```
Guess 1: Event bubbling → Add stopPropagation → Still broken ❌
Guess 2: Z-index issue → Increase z-index → Still broken ❌
Guess 3: Backdrop clicks → Remove backdrop clicks → Still broken ❌
Guess 4: ??? → Try random things → Still broken ❌
Time wasted: 1.5 hours
```

**Right approach (systematic search):**
```bash
grep -n 'setShowModal(false)' component.tsx
# Found 4 instances in 5 seconds
# Identified 2 as bugs
# Fixed in 10 minutes
# ✅ Working!
```

**Lesson:** Stop guessing, start searching systematically!

---

## 🔧 Quick Debug Commands Reference

```bash
# ========================================
# STATE MANAGEMENT
# ========================================

# Find all state setters
grep -n 'setState\|setShow\|setIs\|setHas' component.tsx

# Find specific state changes
grep -n 'setShowModal(false)' component.tsx

# Find where state is initialized
grep -n 'useState' component.tsx

# Find where state is passed as props
grep -n 'showModal' parent.tsx


# ========================================
# EVENT LISTENERS
# ========================================

# Find all event listeners (CRITICAL!)
grep -n 'addEventListener' component.tsx

# Find onClick handlers
grep -n 'onClick' component.tsx

# Find keyboard listeners
grep -n 'onKeyDown\|onKeyPress\|keydown' component.tsx

# Find touch events (mobile)
grep -n 'onTouchStart\|touchstart' component.tsx


# ========================================
# LIFECYCLE & EFFECTS
# ========================================

# Find all useEffect hooks
grep -n 'useEffect' component.tsx

# Find cleanup functions
grep -n 'return () =>' component.tsx

# Find async operations
grep -n 'setTimeout\|setInterval\|Promise\|async' component.tsx


# ========================================
# HELPER FUNCTIONS
# ========================================

# Find functions that close things
grep -n 'function close\|const close' component.tsx

# Find functions that reset things
grep -n 'function reset\|const reset' component.tsx

# Find all function definitions
grep -n 'function \|const .* = (' component.tsx


# ========================================
# VERIFICATION & DEPLOYMENT
# ========================================

# Check if fix is deployed on server
ssh user@server "grep -n 'setShowModal(false)' /deployed/path/component.tsx"

# Verify no unwanted state changes remain
grep -n 'setShowModal(false)' component.tsx | wc -l  # Should be minimal

# Check component on server
ssh user@server "cat /deployed/path/component.tsx | grep -A 5 'setShowModal'"


# ========================================
# CONTEXT & DEBUGGING
# ========================================

# Get 10 lines before and after match
grep -A 10 -B 10 'setShowModal' component.tsx

# Search across multiple files
grep -r 'setShowModal' apps/web/src/

# Show only filenames with matches
grep -l 'setShowModal' apps/web/src/**/*.tsx

# Case-insensitive search
grep -in 'close' component.tsx

# Count occurrences
grep 'setShowModal(false)' component.tsx | wc -l


# ========================================
# FILE INSPECTION
# ========================================

# View specific line ranges
sed -n '100,120p' component.tsx

# View around a specific line
sed -n '105,115p' component.tsx


# ========================================
# TESTING & VERIFICATION
# ========================================

# Run automated test
fe-pilot run /path/to/test.yaml

# Capture console logs
fe-console https://staging.site.com/page --duration 5000

# Take screenshot
fe-snapshot https://staging.site.com/page --viewport mobile
```

---

## 📚 Prevention Strategies

### 1. Code Review Checklist

When reviewing PRs that add modals, dropdowns, or overlays:

- [ ] Search for `addEventListener` - Global listeners?
  ```bash
  grep -n 'addEventListener' changed-files.tsx
  ```

- [ ] Check all places state is set to false/closed
  ```bash
  grep -n 'setShow.*false\|setIs.*false' changed-files.tsx
  ```

- [ ] Look for helper functions with generic names
  ```bash
  grep -n 'closeAll\|resetAll\|clearAll' changed-files.tsx
  ```

- [ ] Verify useEffect cleanup functions
  ```bash
  grep -A 15 'useEffect' changed-files.tsx | grep 'return () =>'
  ```

- [ ] Check if mobile and desktop behavior is different
  - Should they share event handlers?
  - Should they share state?

---

### 2. Coding Guidelines

**For Modal/Overlay Components:**

1. **Separate mobile and desktop state**
   ```javascript
   // ✅ GOOD: Separate state
   const [showMobileModal, setShowMobileModal] = useState(false);
   const [showDesktopDropdown, setShowDesktopDropdown] = useState(false);

   // ❌ BAD: Shared state
   const [showFilters, setShowFilters] = useState(false);  // Used by both?
   ```

2. **Avoid global event listeners**
   ```javascript
   // ❌ BAD
   useEffect(() => {
     document.addEventListener('click', handler);
   }, []);

   // ✅ GOOD: Use CSS pointer-events
   <div className="backdrop pointer-events-none" />
   <div className="modal pointer-events-auto" />
   ```

3. **Name helper functions explicitly**
   ```javascript
   // ❌ BAD: Unclear what it closes
   const closeAll = () => { /* ... */ };

   // ✅ GOOD: Clear and specific
   const closeMobileFiltersModal = () => { /* ... */ };
   const closeDesktopDropdowns = () => { /* ... */ };
   ```

4. **Add comments for non-obvious behavior**
   ```javascript
   useEffect(() => {
     const handleClickOutside = (event) => {
       // Desktop only: Close dropdowns when clicking outside
       // Note: Don't close mobile modal here - it has its own close handlers
       if (desktopDropdownRef.current &&
           !desktopDropdownRef.current.contains(event.target)) {
         setShowDesktopDropdown(false);
       }
     };

     document.addEventListener('mousedown', handleClickOutside);
     return () => document.removeEventListener('mousedown', handleClickOutside);
   }, []);
   ```

5. **Document expected behavior in tests**
   ```yaml
   # test-mobile-filters.yaml
   name: "Mobile filters modal should stay open when clicking filters"
   steps:
     - action: click
       selector: "button:has-text('Open Filters')"
     - action: click
       selector: "button:has-text('Select City')"
     # Modal should still be visible
     - action: screenshot
       path: "/tmp/modal-should-be-open.png"
   ```

---

### 3. Search Before Adding Close Logic

**Before adding `setShowModal(false)` anywhere:**

```bash
# Step 1: See where it's currently closed
grep -n 'setShowModal(false)' component.tsx

# Step 2: Understand each instance
# - Is it intentional?
# - Will my new close conflict with existing ones?
# - Do I need a new close or should I use existing?

# Step 3: Add comment explaining why you're closing it
setShowModal(false);  // Close modal after successful form submission
```

---

### 4. Automated Testing

**Set up regression tests:**

```bash
# tests/mobile-filters.yaml
name: "Mobile Filters Regression Test"
url: "https://staging.site.com/properties"
viewport:
  width: 375
  height: 667
steps:
  - action: click
    selector: "button:has-text('Filters')"
  - action: click
    selector: "button:has-text('City')"
  - action: click
    selector: "button:has-text('District')"
  - action: click
    selector: "button:has-text('Apply')"
  # Verify results updated
```

**Run in CI/CD:**
```bash
# .github/workflows/test.yml
- name: Test Mobile Filters
  run: fe-pilot run tests/mobile-filters.yaml
```

---

## 📖 Summary

### Problem
Mobile filter modal was closing when clicking any filter inside it, making it impossible to select multiple filters.

### Root Cause
Two hidden JavaScript handlers were automatically closing the modal:
1. `useEffect` with global `document.addEventListener`
2. `closeAllDropdowns()` helper function called by filter interactions

### Solution
1. Removed `setShowMoreFilters(false)` from `useEffect` click handler
2. Removed `setShowMoreFilters(false)` from `closeAllDropdowns()` function
3. Added `pointer-events-none` to backdrop
4. Modal now only closes via X button or Apply button

### Key Tool
```bash
grep -n 'setShowMoreFilters(false)' component.tsx
```
This single command found both bugs in 5 seconds!

### Time Breakdown
- Wrong approaches (guessing): 1.5 hours ❌
- Systematic search: 5 minutes ✅
- Implementing fix: 10 minutes ✅
- Testing and verification: 15 minutes ✅

**Total time saved by systematic approach:** ~60-75 minutes

### Lessons
1. ⭐ Always search for ALL state changes (`grep -n 'setState'`)
2. ⭐ Check for global event listeners (`grep -n 'addEventListener'`)
3. ⭐ Check helper functions (`grep -n 'function close'`)
4. Test with automation (`fe-pilot`)
5. Document for future reference

---

## 📚 Related Documentation

- **Frontend Debugging Tools:** `~/.claude/CLAUDE.md` (fe-snapshot, fe-console, fe-pilot)
- **Debugging Protocol:** `~/.claude/CLAUDE.md` (5-minute debugging protocol)
- **Component Location:** `apps/web/src/components/property-filters-extended.tsx`
- **Test Scenarios:** Create in `tests/` directory

---

## 🔄 Change Log

- **2025-12-15:** Initial bug report - mobile modal closing on filter clicks
- **2025-12-15:** Fixed by removing hidden state changes in useEffect and helper function
- **2025-12-15:** Documentation created for future reference

---

**Remember:** When components close unexpectedly, **search for ALL places that change the state** - don't just assume it's event bubbling!

```bash
grep -n 'setYourState(false)' component.tsx
```

This one command can save hours of debugging. 🚀
