# Backend Options for Demo

## 🚨 Current Issue

The frontend is trying to connect to `app.go54.com` for the API, but that URL is serving a frontend application (HTML), not the backend API (JSON).

## 🎯 Quick Solutions for Demo

### **Option 1: Deploy Backend to Cloudflare Workers (Recommended)**

Since you have the backend code configured for Cloudflare Workers, deploy it:

1. **Deploy the backend:**
   ```bash
   cd apps/backend
   npx wrangler deploy
   ```

2. **Update frontend configuration:**
   - Use the Workers URL (e.g., `https://zerocancer.your-subdomain.workers.dev`)
   - Or configure a custom domain

### **Option 2: Use Local Backend for Demo**

Run the backend locally and use ngrok to expose it:

1. **Start local backend:**
   ```bash
   cd apps/backend
   npm run dev
   ```

2. **Expose with ngrok:**
   ```bash
   ngrok http 8787
   ```

3. **Update frontend config with ngrok URL**

### **Option 3: Mock Backend (Fastest)**

Create a simple mock API that returns test data for demo purposes.

### **Option 4: Frontend-Only Demo**

Show the UI with static data and explain the backend functionality.

## 🔧 Current Configuration

**Frontend Environment:**
```env
VITE_ENV_MODE=production
VITE_DEV_API_BASE_URL=https://app.go54.com
```

**Netlify Redirects:**
```toml
[[redirects]]
  from = "/api/*"
  to = "https://app.go54.com/api/:splat"
  status = 200
```

## 🚀 Recommended Action

**For immediate demo:** Use Option 1 (Deploy to Cloudflare Workers)

1. The backend is already configured for Workers
2. You have `wrangler.jsonc` set up
3. It will give you a proper API endpoint
4. Takes 5-10 minutes to deploy

**Command to deploy:**
```bash
cd apps/backend
npx wrangler login
npx wrangler deploy
```

This will give you a URL like `https://zerocancer.your-account.workers.dev` that you can use as the backend.

## 📋 Test Accounts Ready

Once the backend is deployed, these accounts will work:

- **Centers:** `center1@zerocancer.org` / `centerpass`
- **Patients:** `testpatient1@example.com` / `password123`  
- **Donors:** `testdonor1@example.com` / `password123`
- **Admins:** `ttaiwo4910@gmail.com` / `fake.password`

## 🎬 Demo Flow

1. Deploy backend to get API URL
2. Update frontend configuration with new URL
3. Test login with any test account
4. Run through demo scenarios

Would you like me to help you deploy the backend to Cloudflare Workers?