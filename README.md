# Shard Item Optimiser

Shard Item Optimiser is a small static web app for planning item builds for Shardbot capes.

It takes a cape's class, subclass, base stats, feats, and optional inventory paste, then searches the curated item catalog for builds that satisfy the selected stat goals and item rules. The app is intended as a practical planning tool: paste a cape, adjust priorities or constraints, and compare feasible builds.

## What It Does

- Parses `/cape` output into editable cape details.
- Parses `/inventory` output to limit results to items currently available.
- Supports manual class, subclass, stat, and Prepper input.
- Applies item capacity, slot, class restriction, stat floor, and item effect rules.
- Ranks builds against enabled stat goals in the chosen priority order.
- Shows feasible builds and optionally closest misses.
- Supports mobile, medium accordion, and full desktop layouts.

All optimisation happens client-side. There is no backend service.

## How To Use The App

1. Enter cape details in the first pane.
   - Paste `/cape` output into the Cape box and commit the field, or paste globally when no input is focused.
   - You can also choose class/subclass manually and type base stats directly.
   - Enable Prepper if the cape has the active Prepper feat.

2. Optionally paste `/inventory` output.
   - Inventory limiting only applies when the paste parses cleanly.
   - If no valid inventory paste is committed, the optimiser uses the full item catalog.

3. Configure stat goals in the middle pane.
   - Reorder stats to change ranking priority.
   - Enable or disable individual stat constraints.
   - Set minimum and maximum values for enabled goals.

4. Review builds in the output pane.
   - Select a build to compare its final stats against the base cape.
   - Use "Show closest misses" to include near-fit builds that fail strict constraints.

## Development

Install dependencies:

```bash
npm install
```

Run the local dev server:

```bash
npm run dev
```

Run tests:

```bash
npm test
```

Run type checking:

```bash
npm run lint
```

Build for production:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

## Repository Structure

```text
src/
  App.tsx                  Main application state and pane orchestration
  main.tsx                 React entry point
  styles.css               Global layout and component styling

  components/
    CapeInput.tsx          Cape, stat, Prepper, and paste input controls
    GoalControls.tsx       Stat priority, constraints, and goal controls
    FeasibilityBar.tsx     Visual range/constraint indicator
    ResultsMatrix.tsx      Build result list and selection behavior
    StepPanel.tsx          Responsive pane shell
    Modal.tsx              Shared modal dialog component

  domain/
    capeParser.ts          `/cape` paste parsing
    inventory.ts           `/inventory` paste parsing and filtering
    optimiser.ts           Build generation, filtering, and ranking
    itemRules.ts           Capacity, slot, and eligibility rules
    statMath.ts            Item effect application
    catalog.ts             Curated item catalog
    classes.ts             Class, subclass, and weapon access data
    rules.ts               Shared game constants
    stats.ts               Stat definitions and defaults
    types.ts               Shared domain types
    validateCatalog.ts     Catalog validation helpers

  test/
    fixtures/              Raw paste fixtures used by parser tests
```

Tests live next to the code they cover, using `*.test.ts` and `*.test.tsx` files.

## Tech Stack

- React
- TypeScript
- Vite
- Vitest
- Testing Library
- lucide-react for icons

The project builds to static assets in `dist/`.

## Notes

The optimizer is only as accurate as the local catalog and rule data. When Shardbot item rules or output formats change, update the domain data and paste fixtures together, then run the full test suite.
