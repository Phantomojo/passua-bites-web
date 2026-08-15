#!/bin/bash
# Deploy to Railway - run this locally after installing Railway CLI

# 1. Login interactively
railway login

# 2. Link to project (select your existing project when prompted)
railway link

# 3. Set environment variables  
railway vars set DATABASE_URL="$NEON_DATABASE_URL"
railway vars set JWT_SECRET="your-secure-secret"
railway vars set ADMIN_PASSWORD="passua2026"
railway vars set MPESA_CONSUMER_KEY="$MPESA_KEY"
railway vars set MPESA_CONSUMER_SECRET="$MPESA_SECRET"
railway vars set MPESA_SHORTCODE="$MPESA_SHORTCODE"
railway vars set MPESA_PASSKEY="$MPESA_PASSKEY"

# 4. Deploy
railway up

# 5. Get the URL
railway domain