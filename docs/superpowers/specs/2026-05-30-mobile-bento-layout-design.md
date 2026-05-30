# Mobile Bento Box Layout Design

## 1. Overview
The goal of this design is to revamp the mobile experience of the personal website by transitioning from a stacked "waterfall" layout to a highly compact, modern "Bento Box" grid. This design better fits the cyberpunk/brutalist aesthetic, ensuring a dense, data-dashboard feel on mobile devices.

## 2. Architecture & Approach
We will utilize CSS Grid (`grid-cols-2`) for screens `< 768px` in `Home.vue`. 
Desktop layout remains unchanged, keeping the current responsive classes (e.g., `md:grid-cols-12`).

### 2.1 Headings and Navigation
- **Top NavBar (`NavBar.vue`)**: Hidden entirely on mobile screens (`hidden md:block` or similar).
- **Mobile Menu**: Introduce a sleek floating action button (FAB) in the bottom-left corner for global navigation. Clicking the FAB triggers a full-screen blurred cyber-menu.
- **Hero Section (`Home.vue`)**: The large `ParticleText` and hero typography will be condensed into a smaller, sticky "Banner Block" at the top of the mobile Bento grid, showing the site title and system status.

### 2.2 Bento Grid Layout (`Home.vue`)
The main content will be organized into a dense `grid-cols-2` grid with tight gaps (e.g., `gap-3` or `gap-4`).

- **MeCard**: `col-span-2`. A horizontal, compact profile block.
- **ClockCard & CalendarCard**: Each `col-span-1`. They will sit side-by-side perfectly.
- **Works**: `col-span-2`. Prominent entry point.
- **Projects & Articles**: Each `col-span-1`.
- **Games**: `col-span-2`.
- **Pinned Nodes & Recent Logs**: Fill the remaining space dynamically, taking `col-span-2`.

### 2.3 Visual & Interactive Details
- Cards will have consistent `cyber-glass` styling with slightly reduced padding on mobile to save space.
- The AI Companion (`LanPet`) will remain in the bottom-right but scaled down (`scale-75` or similar on mobile) and adjusted for transparency to avoid blocking the Bento content.

## 3. Implementation Scope
- `src/components/NavBar.vue`: Update visibility and add the Mobile FAB menu logic.
- `src/views/Home.vue`: Refactor the layout wrapping the cards. Change flex/stack to grid classes specific to mobile (`grid grid-cols-2 gap-3`).
- Adjust `MeCard.vue`, `ClockCard.vue`, `CalendarCard.vue` padding/font sizes using `md:` breakpoints to ensure they fit nicely in small grid cells.

## 4. Potential Risks
- Text overflow in smaller 1-column blocks (e.g., ClockCard, Projects). We must ensure `truncate` or responsive typography is applied.
- Conflicting touch events between the fluid cursor / ripples and the new Bento tiles. (Current ripples logic works globally, so it should be fine).
