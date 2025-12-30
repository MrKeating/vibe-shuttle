# AI Studio Bridge

This folder contains code synced from Google AI Studio via the VibeBridge tool.

## How It Works

1. **Pull/Import**: When you sync from AI Studio, files are copied into this folder
2. **Auto-Export**: The `index.ts` file is auto-generated with exports for all synced modules
3. **Path Aliases**: Use `@ai/*` or `@/ai` to import synced code

## Importing AI Studio Code

### Option 1: Import from the bridge entrypoint
```typescript
import { AI_STUDIO_VERSION, AI_STUDIO_SYNCED_AT } from "@/ai";
```

### Option 2: Import specific modules directly
```typescript
import { myFunction } from "@ai/utils/myFunction";
import { MyComponent } from "@ai/components/MyComponent";
```

### Option 3: Import from the ai-studio folder
```typescript
import { something } from "@/ai-studio/something";
```

## Folder Structure

```
src/ai-studio/
├── index.ts          # Auto-generated exports (updated on each sync)
├── README.md         # This file
└── [synced files]    # Files from AI Studio
```

## After Syncing

After each pull/import from AI Studio:

1. The `index.ts` file is automatically regenerated
2. All `.ts`, `.tsx`, `.js`, `.jsx` files are exported
3. The commit message includes `[AI-STUDIO-SYNC]` marker
4. Synced modules are immediately available via imports

## Best Practices

- **Don't manually edit `index.ts`** - it's auto-generated on each sync
- **Use path aliases** - prefer `@ai/*` over relative paths
- **Keep AI Studio code modular** - export functions/components that can be imported
- **Test after sync** - verify imports work after pulling new code

## Troubleshooting

### Module not found
- Check that the file was synced (look in the sync preview)
- Verify the file has a `.ts`, `.tsx`, `.js`, or `.jsx` extension
- Check `index.ts` to see if the export was generated

### TypeScript errors
- The `@ai` alias works in Vite but TypeScript uses `@/ai-studio`
- For full TypeScript support, import from `@/ai` or `@/ai-studio`

## Version Tracking

Each sync updates these constants in `index.ts`:
- `AI_STUDIO_VERSION` - Version string
- `AI_STUDIO_SYNCED_AT` - ISO timestamp of last sync
