import 'dotenv/config'
import { serve } from '@hono/node-server'
import app from './app'

// Load environment variables from .dev.vars for Node.js
// For development, you can use a local PostgreSQL or a cloud database
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://localhost:5432/zerocancer_dev'
process.env.JWT_TOKEN_SECRET = process.env.JWT_TOKEN_SECRET || 'placeholder_secret_key_change_in_production'
process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'
process.env.ENV_MODE = process.env.ENV_MODE || 'development'

const port = 8787

console.log(`🚀 Starting ZeroCancer backend on port ${port}...`)
console.log(`📁 Database: ${process.env.DATABASE_URL}`)
console.log(`🌐 Frontend: ${process.env.FRONTEND_URL}`)

serve({
  fetch: app.fetch,
  port
})

console.log(`✅ Server running at http://localhost:${port}`)
console.log(`📊 Health check: http://localhost:${port}/api/v1/healthz`)

