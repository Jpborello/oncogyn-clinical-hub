import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: NextRequest) {
  try {
    const { endpoint, keys } = await req.json();
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      return NextResponse.json({ error: 'Suscripción inválida' }, { status: 400 });
    }

    // Guardar o actualizar la suscripción con upsert basado en el endpoint único
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        endpoint,
        keys_p256dh: keys.p256dh,
        keys_auth: keys.auth
      }, { onConflict: 'endpoint' });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error registrando suscripción push:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
