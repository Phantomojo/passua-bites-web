/**
 * Vercel serverless entry point
 * Serves the Vite-built frontend + Express + tRPC backend
 */
import "dotenv/config";
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import { createExpressMiddleware } from '@trpc/server/adapters/express';
import { registerOAuthRoutes } from './server/_core/oauth';
import { appRouter } from './server/routers';
import { createContext } from './server/_core/context';
import { serveStatic, setupVite } from './server/_core/vite';
import { getDb } from './server/db';
import { orders, mpesaTransactions } from './drizzle/schema';
import { eq } from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);
  
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));
  
  // OAuth routes
  app.get('/api/oauth/callback', async (req: any, res: any) => {
    const { OAuthHttpClient } = await import('./server/_core/sdk');
    const oauth = new OAuthHttpClient();
    const code = req.query.code as string;
    const state = req.query.state as string;
    
    if (!code || !state) {
      res.status(400).json({ error: 'code and state are required' });
      return;
    }
    
    try {
      const tokenResponse = await oauth.exchangeCodeForToken(code, state);
      const userInfo = await oauth.getUserInfo(tokenResponse.accessToken);
      
      if (!userInfo.openId) {
        res.status(400).json({ error: 'openId missing' });
        return;
      }
      
      const { upsertUser } = await import('./server/db');
      await upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date()
      });
      
      const { createSessionToken } = await import('./server/_core/sdk');
      const sessionToken = await createSessionToken(userInfo.openId, { name: userInfo.name || '' });
      
      res.cookie('app_session_id', sessionToken, {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        maxAge: 365 * 24 * 60 * 60 * 1000
      });
      
      res.redirect(302, '/');
    } catch (error) {
      console.error('[OAuth] Callback failed', error);
      res.status(500).json({ error: 'OAuth callback failed' });
    }
  });
  
  // M-Pesa callback
  app.post('/api/mpesa/callback', async (req, res) => {
    res.status(200).json({ ResultCode: 0, ResultDesc: 'Accepted' });
    
    try {
      const { Body } = req.body;
      if (!Body || !Body.stkCallback) return;
      
      const { stkCallback } = Body;
      const { ResultCode, CheckoutRequestID, CallbackMetadata } = stkCallback;
      
      const db = await getDb();
      if (!db) return;
      
      const tx = await db
        .select()
        .from(mpesaTransactions)
        .where(eq(mpesaTransactions.checkoutRequestID, CheckoutRequestID))
        .limit(1)
        .execute();
      
      if (tx.length === 0) return;
      
      if (ResultCode !== 0) {
        await db
          .update(mpesaTransactions)
          .set({ status: ResultCode === 1032 ? 'cancelled' : 'failed' })
          .where(eq(mpesaTransactions.checkoutRequestID, CheckoutRequestID));
        return;
      }
      
      const metadata: Record<string, any> = {};
      CallbackMetadata?.Item?.forEach((item: any) => {
        metadata[item.Name] = item.Value;
      });
      
      await db
        .update(mpesaTransactions)
        .set({
          status: 'completed',
          mpesaReceiptNumber: metadata.MpesaReceiptNumber || null
        })
        .where(eq(mpesaTransactions.checkoutRequestID, CheckoutRequestID));
      
      await db
        .update(orders)
        .set({
          paymentStatus: 'completed',
          status: 'confirmed'
        })
        .where(eq(orders.id, tx[0].orderId));
    } catch (error) {
      console.error('[M-Pesa] Callback error:', error);
    }
  });
  
  // Health
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
  
  // tRPC
  app.use('/api/trpc', createExpressMiddleware({
    router: appRouter,
    createContext
  }));
  
  // Serve static frontend
  app.use(express.static(path.join(__dirname, 'dist/public')));
  
  // SPA fallback
  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist/public/index.html'));
  });
  
  return app;
}

export default startServer;