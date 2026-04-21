# Vercel Project Naming Issue Fix

## Issue
You're getting the error: `Project "zero-cancer-backend" already exists, please use a new name.`

## Why This Happens
- Vercel tries to create separate projects for different parts of a monorepo
- There might be an existing project with a similar name
- The project name is being auto-generated from the repository structure

## Solutions

### Option 1: Use Custom Project Name (Recommended)
I've added a `name` property to `vercel.json` to specify a unique project name:

```json
{
  "name": "zerocancer-app",
  // ... rest of config
}
```

### Option 2: Deploy with Custom Name via CLI
If you're using Vercel CLI, you can specify a custom name:

```bash
npx vercel --name zerocancer-app-unique
```

### Option 3: Deploy via Vercel Dashboard (Easiest)
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import your GitHub repository
4. **Change the project name** in the import dialog to something unique like:
   - `zerocancer-app-[your-name]`
   - `zerocancer-platform`
   - `zero-cancer-fullstack`
   - `zerocancer-v2`

### Option 4: Delete Existing Project (If You Own It)
If you have an existing project with that name:
1. Go to Vercel Dashboard
2. Find the existing "zero-cancer-backend" project
3. Go to Settings → General → Delete Project
4. Then try deploying again

## Recommended Project Names
Choose one of these unique names:
- `zerocancer-platform`
- `zerocancer-fullstack`
- `zero-cancer-app`
- `zerocancer-v2024`
- `zerocancer-production`

## Updated Configuration
The `vercel.json` now includes:
```json
{
  "name": "zerocancer-app",
  // This ensures a single project deployment
}
```

## Next Steps
1. Try deploying again - the naming conflict should be resolved
2. If you still get the error, use Option 3 (Dashboard deployment) and manually set a unique name
3. Make sure to set all environment variables after successful deployment

The configuration has been updated to prevent this naming conflict in the future.