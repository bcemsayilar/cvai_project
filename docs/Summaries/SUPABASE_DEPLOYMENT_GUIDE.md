# Supabase Function Deployment Guide

## Issue Fixed
The JSON generation in the ATS format processing was causing errors due to JavaScript-style comments (`//`) being included in the JSON output, which is invalid JSON syntax.

## Changes Made

### 1. Enhanced JSON Comment Removal
- **File**: `/supabase/functions/process-resume/index.ts`
- **Fix**: Improved regex patterns to specifically target and remove comments after string values
- **Added**: Multiple layers of JSON cleaning to ensure all comment syntax is removed

### 2. Fixed Module Import Issue
- **Problem**: Dynamic import of `latex-generator-edge.ts` was failing in Deno environment
- **Solution**: Changed from dynamic import to static import at the top of the file
- **Before**: `const { generateATSLatexResume } = await import("./latex-generator-edge.ts");`
- **After**: `import { generateATSLatexResume } from "./latex-generator-edge.ts";`

## Files Modified
1. `/supabase/functions/process-resume/index.ts`
   - Enhanced JSON cleaning logic
   - Fixed import syntax for Deno compatibility
   - Added more specific regex patterns for comment removal

## Deployment Instructions

### Option 1: Using Supabase CLI (Recommended)
If you have Supabase CLI installed:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link your project (replace with your project reference)
supabase link --project-ref your-project-ref

# Deploy the function
supabase functions deploy process-resume
```

### Option 2: Manual Deployment via Supabase Dashboard
1. Go to your Supabase Dashboard
2. Navigate to Edge Functions
3. Find the `process-resume` function
4. Replace the code with the updated version from `/supabase/functions/process-resume/index.ts`
5. Make sure to also include the `latex-generator-edge.ts` file in the same function directory
6. Deploy the function

### Option 3: Using Supabase API
You can also deploy using the Supabase REST API or SDKs if you have that set up.

## Testing the Fix

After deployment, test by:
1. Uploading a resume file
2. Selecting "ATS" format in the processing options
3. The process should now complete without JSON parsing errors

## Expected Behavior
- No more "Failed to generate JSON" errors
- Comments like `"value": "linkedin.com" // LinkedIn link not provided` will be cleaned to `"value": "linkedin.com"`
- LaTeX files will be generated successfully for ATS format

## Monitoring
Watch the Supabase function logs after deployment to ensure:
- No import errors for `latex-generator-edge.ts`
- JSON parsing succeeds
- LaTeX generation completes without errors

## Rollback Plan
If issues arise, you can revert to the previous version by:
1. Restoring the dynamic import: `const { generateATSLatexResume } = await import("./latex-generator-edge.ts");`
2. Reverting the JSON cleaning patterns to the previous version

---

**Note**: The visual editor feature in the web application will continue to work normally during this deployment as it uses different API endpoints.
