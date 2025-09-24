# Unused Files

This folder contains files that were moved from the main codebase during production cleanup.

## Files Moved

### Pages (Settings variants)
- `pages/page-clean.tsx` - Alternative settings page implementation
- `pages/page-new.tsx` - Another settings page variant

### Components
- `components/debug/` - Debug components for bulk upload testing
  - `bulk-upload-debugger-v2.tsx` - Debug interface for bulk uploads
- `components/analytics-view-new.tsx` - Alternative analytics view component

### Hooks (Empty/Unused)
- `hooks/use-batch-pagination.ts` - Empty pagination hook
- `hooks/use-simple-pagination-new.ts` - Empty pagination hook
- `hooks/use-simple-pagination.ts` - Empty pagination hook
- `hooks/use-smart-pagination.ts.bak` - Backup pagination hook

### Library
- `lib/debug-bulk-upload.ts` - Debug utilities for bulk upload testing
- `lib/token-encryption.ts` - Unused token encryption utility (never implemented)

### Documentation
- `docs/agent.md` - Agent analysis documentation

### Build Files
- `build-errors.log` - Build error log file

## Reason for Moving

These files were moved to clean up the codebase for production:

1. **Debug/Development Tools**: Debug components and utilities that are only needed during development
2. **Duplicate/Alternative Implementations**: Multiple page variants where only one is used
3. **Empty Files**: Placeholder hooks that were never implemented
4. **Build Artifacts**: Log files and temporary build outputs
5. **Development Documentation**: Internal documentation not needed for production

## Restoration

If any of these files are needed in the future, they can be moved back to their original locations in the main codebase.
