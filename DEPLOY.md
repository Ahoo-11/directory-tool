# Deploying to Dokploy on Hetzner VPS

This guide walks you through deploying the Directory Tool to your Hetzner VPS using Dokploy.

## Prerequisites

1. **Hetzner VPS** with Dokploy installed and running
2. **Git repository** (GitHub, GitLab, Bitbucket, or self-hosted)
3. **Convex account** with a production deployment created
4. **Stack Auth account** (if using authentication)

## Step 1: Prepare Your Git Repository

Ensure your code is pushed to a Git repository that Dokploy can access.

```bash
git add .
git commit -m "Add Docker configuration for Dokploy deployment"
git push origin main
```

## Step 2: Set Up Convex Production Deployment

1. Go to [Convex Dashboard](https://dashboard.convex.dev)
2. Select your project or create a new one
3. Navigate to **Settings** → **Deploy Keys**
4. Create a new **Production Deploy Key**
5. Copy the deploy key (you'll need it later)
6. Copy your **Deployment URL** from the dashboard (looks like `https://xxxxx.convex.cloud`)

## Step 3: Set Up Stack Auth (if applicable)

1. Go to [Stack Auth Dashboard](https://app.stack-auth.com)
2. Create or select your project
3. Copy the following values:
   - **Project ID** (`NEXT_PUBLIC_STACK_PROJECT_ID`)
   - **Publishable Client Key** (`NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY`)
   - **Secret Server Key** (`STACK_SECRET_SERVER_KEY`)

## Step 4: Create Application in Dokploy

1. Log in to your Dokploy dashboard (usually at `https://your-vps-ip:3000` or your custom domain)

2. Click **"Create Application"** or go to **Applications** → **New**

3. Configure the application:
   - **Name**: `directory-tool` (or your preferred name)
   - **Source**: Select **Git**
   - **Repository URL**: Your Git repository URL
   - **Branch**: `main` (or your production branch)
   - **Build Type**: **Dockerfile**
   - **Dockerfile Path**: `Dockerfile` (root of the repo)

## Step 5: Configure Environment Variables

In your Dokploy application settings, navigate to **Environment Variables** and add:

### Build-Time Variables (Build Args)

These are needed during the Docker build:

| Variable | Value | Description |
|----------|-------|-------------|
| `CONVEX_DEPLOY_KEY` | `prod:your-key-here` | Convex production deploy key |
| `NEXT_PUBLIC_CONVEX_URL` | `https://xxxx.convex.cloud` | Your Convex deployment URL |

### Runtime Environment Variables

These are needed when the app runs:

| Variable | Value | Description |
|----------|-------|-------------|
| `NEXT_PUBLIC_CONVEX_URL` | `https://xxxx.convex.cloud` | Your Convex deployment URL |
| `NEXT_PUBLIC_STACK_PROJECT_ID` | `your-project-id` | Stack Auth project ID |
| `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY` | `pk_xxxxx` | Stack Auth publishable key |
| `STACK_SECRET_SERVER_KEY` | `sk_xxxxx` | Stack Auth secret key |

> **Note:** In Dokploy, you may need to add build args separately under "Build Arguments" section.

## Step 6: Configure Networking

1. **Port**: Set to `3000` (the app exposes this port)

2. **Domain**: (Optional) Configure a custom domain
   - Add your domain in the **Domains** section
   - Dokploy will automatically configure SSL with Let's Encrypt

3. **Health Check**: (Optional but recommended)
   - Path: `/`
   - Protocol: `HTTP`
   - Port: `3000`

## Step 7: Deploy

1. Click **Deploy** or **Trigger Build**
2. Monitor the build logs for any errors
3. Once complete, your app should be accessible at your configured domain

## Step 8: Verify Deployment

1. Visit your application URL
2. Check that the page loads correctly
3. Verify authentication works (if using Stack Auth)
4. Test creating/viewing tools to ensure Convex is connected

## Troubleshooting

### Build Fails - Convex Deploy Error

**Error**: `CONVEX_DEPLOY_KEY is not set` or Convex deployment fails

**Solution**: Ensure `CONVEX_DEPLOY_KEY` is set as a build argument, not just an environment variable.

### App Won't Start - Missing Environment Variables

**Error**: App crashes on startup with environment variable errors

**Solution**: Make sure all `NEXT_PUBLIC_*` variables are set in runtime environment variables.

### Can't Connect to Convex

**Error**: "Unable to connect to Convex" or similar

**Solution**: 
1. Verify `NEXT_PUBLIC_CONVEX_URL` is correct
2. Check that your Convex deployment is active (not paused)
3. Ensure the deploy key matches your production deployment

### Stack Auth Not Working

**Error**: Authentication redirects fail or "Invalid project ID"

**Solution**:
1. Verify all Stack Auth environment variables are set
2. Add your Dokploy domain to Stack Auth's allowed domains
3. In Stack Auth dashboard → Settings → Domains, add your production domain

## Alternative: Using Docker Compose

If you prefer using Docker Compose with Dokploy, create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        - CONVEX_DEPLOY_KEY=${CONVEX_DEPLOY_KEY}
        - NEXT_PUBLIC_CONVEX_URL=${NEXT_PUBLIC_CONVEX_URL}
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_CONVEX_URL=${NEXT_PUBLIC_CONVEX_URL}
      - NEXT_PUBLIC_STACK_PROJECT_ID=${NEXT_PUBLIC_STACK_PROJECT_ID}
      - NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY=${NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY}
      - STACK_SECRET_SERVER_KEY=${STACK_SECRET_SERVER_KEY}
    restart: unless-stopped
```

Then in Dokploy, select **Docker Compose** as the build type instead of Dockerfile.

## Updating Your Deployment

For subsequent deployments:

1. Push your changes to Git
2. In Dokploy, click **Redeploy** or enable **Auto Deploy** for automatic deployments on push

---

## Quick Reference: Required Environment Variables

| Variable | Type | Required |
|----------|------|----------|
| `NEXT_PUBLIC_CONVEX_URL` | Build + Runtime | ✅ Yes |
| `CONVEX_DEPLOY_KEY` | Build Only | ✅ Yes |
| `NEXT_PUBLIC_STACK_PROJECT_ID` | Runtime | ✅ If using auth |
| `NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY` | Runtime | ✅ If using auth |
| `STACK_SECRET_SERVER_KEY` | Runtime | ✅ If using auth |
