# AGENTS.md

## 🚨 CRITICAL PROTOCOLS

### 1. Core Standards
- **JS**: **Vanilla JS ONLY**. No jQuery, no external libraries, no CDNs.
- **CSS**: **Tailwind CSS ONLY**. You **MUST** use the `acfb-` prefix for ALL classes (e.g., `acfb-flex`, `acfb-text-red-500`). No custom CSS files.
- **HTML**: **Semantic HTML5 MANDATORY** (`nav`, `header`, `main`, `section`, `article`). No `div` soup.
- **ACF**: **MUST** use `blockVersion: 3` in `block.json`.
- **Schema**: Use ONLY for structured data (FAQ, Gallery). Control via ACF Boolean `enable_schema`.

### 2. Development & Build
- **Install**: `npm install` → `npm run tailwind:build`.
- **Dev (Windows)**: Copy to WP plugins folder → `npm run tailwind:watch`.
- **Dev (Mac/Linux)**: `npm run dev:playground`.
- **Build**: `npm run build:plugin` → Generates ZIP in root (excludes `node_modules`, `src`).
- **Versioning**: Update `package.json` AND `plugin.php` before building.

### 3. Block Structure
- **Path**: `blocks/your-block/`
- **Files**:
  - `block.json`: Config (API v3).
  - `render.php`: Template.
  - `your-block.js`: Vanilla JS (auto-enqueued).
