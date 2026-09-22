import webpush from "web-push";
import { IPushSubscription } from "./types";
import { dbService } from "./db";

// Fallback default VAPID keys so Web Push works unconditionally on Vercel/Cloud/Production without manual env setup
export const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
  "BHzh75OJaSOoRiQqAck0_0_j9bVyALf2Op7wUFKpQ8sAQgxI7yXnO8dQWf9ZOx6Fm3T3T9LFG34ovf2KC_gvdF0";

export const VAPID_PRIVATE_KEY =
  process.env.VAPID_PRIVATE_KEY ||
  "_iJ0hVCuJHTHaAMRObTYy10zedWCMj12yg7D0oxgahI";

export const VAPID_SUBJECT =
  process.env.VAPID_SUBJECT ||
  "mailto:admin@jari.com";

let vapidConfigured = false;
export function ensureVapidConfigured() {
  if (!vapidConfigured) {
    try {
      webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
      vapidConfigured = true;
    } catch (e) {
      console.warn("VAPID config error:", e);
    }
  }
}

export async function sendWebPushToSubscriptions(
  subscriptions: IPushSubscription[],
  payload: { title: string; body: string; url?: string; tag?: string; icon?: string }
): Promise<number> {
  if (!subscriptions || subscriptions.length === 0) return 0;
  ensureVapidConfigured();

  const payloadString = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || "/icon-192.png",
    badge: "/icon-192.png",
    url: payload.url || "/customer",
    tag: payload.tag || "jari-notif-" + Date.now(),
  });

  let sentCount = 0;
  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys.p256dh,
              auth: sub.keys.auth,
            },
          },
          payloadString,
          {
            TTL: 86400, // 24 hours queue retention if device is offline
            urgency: "high", // Immediate FCM / APNs dispatch bypassing battery-saver/doze mode
            headers: {
              Urgency: "high",
            },
          }
        );
        sentCount++;
      } catch (err: any) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          // Unregistered or expired subscription - remove from database
          await dbService.deletePushSubscription(sub.endpoint);
        } else {
          console.warn("Push delivery notice:", err.message);
        }
      }
    })
  );

  return sentCount;
}

export async function sendWebPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string; tag?: string }
): Promise<number> {
  const subs = await dbService.getPushSubscriptionsForUser(userId);
  return sendWebPushToSubscriptions(subs, payload);
}

export async function sendWebPushToAll(
  payload: { title: string; body: string; url?: string; tag?: string }
): Promise<number> {
  const subs = await dbService.getAllPushSubscriptions();
  return sendWebPushToSubscriptions(subs, payload);
}
