import { httpRouter } from 'convex/server';
import { internal } from './_generated/api';
import { httpAction } from './_generated/server';
import { auth } from './auth';

const http = httpRouter();

// הגדרת נתיבי HTTP עבור אימות (Convex Auth)
// זה מאפשר ביצוע פעולות אימות דרך HTTP Endpoints
auth.addHttpRoutes(http);

// ==========================================================================
// Webhook של RevenueCat — מקור האמת היחיד לרכישות. חובה להגדיר ב-Convex
// Dashboard (Settings → Environment Variables) משתנה REVENUECAT_WEBHOOK_SECRET,
// ואת אותו הערך בדיוק להדביק בהגדרת ה-Webhook בדשבורד של RevenueCat
// (Integrations → Webhooks → Authorization header).
// ==========================================================================
http.route({
  path: '/revenuecat-webhook',
  method: 'POST',
  handler: httpAction(async (ctx, request) => {
    const expected = process.env.REVENUECAT_WEBHOOK_SECRET;
    const received = request.headers.get('Authorization');
    if (!expected || received !== expected) {
      return new Response('Unauthorized', { status: 401 });
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response('Bad Request', { status: 400 });
    }

    const event = (body as { event?: Record<string, unknown> })?.event;
    if (!event) {
      return new Response('Bad Request', { status: 400 });
    }
    const appUserId =
      typeof event.app_user_id === 'string' ? event.app_user_id : null;
    const eventType = typeof event.type === 'string' ? event.type : null;
    if (!(appUserId && eventType)) {
      return new Response('Bad Request', { status: 400 });
    }

    await ctx.runMutation(internal.purchases.applyWebhookEvent, {
      appUserId,
      eventType,
      productId: typeof event.product_id === 'string' ? event.product_id : '',
      store: typeof event.store === 'string' ? event.store : undefined,
    });

    // תמיד 200 מהר — RevenueCat מנסה שוב (עד 5 פעמים) על כל תשובה אחרת
    return new Response('OK', { status: 200 });
  }),
});

export default http;
