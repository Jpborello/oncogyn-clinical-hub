import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

// Configuración de VAPID (con fallback a las llaves autogeneradas para funcionamiento inmediato)
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BC1zOSRYoHMs4tGkmurDaSioDNV4NeEw42aw3lQGR7g-rjFFUxYzcU-RzxFTwiMJWmXpvKK-dqWRfLo_jQLC_D4';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'mblu-m0NPIq55E1juf5lklzWIINb-UHrgVafR2rJW2Y';
const VAPID_SUBJECT = 'mailto:jpborello@gmail.com';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''; // Service role para operar sin trabas de RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const { titulo, cuerpo } = await req.json();
    if (!titulo || !cuerpo) {
      return NextResponse.json({ error: 'Faltan parámetros titulo o cuerpo' }, { status: 400 });
    }

    // Obtener todas las suscripciones push activas registradas en la base de datos
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (error) throw error;
    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ message: 'No hay dispositivos suscritos' });
    }

    const payload = JSON.stringify({ titulo, cuerpo });

    const promesas = subscriptions.map(async (sub) => {
      const pushSub = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.keys_p256dh,
          auth: sub.keys_auth
        }
      };

      try {
        await webpush.sendNotification(pushSub, payload);
      } catch (err: any) {
        console.error('Error al enviar push a', sub.endpoint, err);
        // Si el cliente ya no es válido (desinstaló la app, expiró, etc.), limpiamos el registro
        if (err.statusCode === 410 || err.statusCode === 404) {
          await supabase.from('push_subscriptions').delete().eq('id', sub.id);
        }
      }
    });

    await Promise.all(promesas);
    return NextResponse.json({ success: true, count: subscriptions.length });
  } catch (err: any) {
    console.error('Error en API push route:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
