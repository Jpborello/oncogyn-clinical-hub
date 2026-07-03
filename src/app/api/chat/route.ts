import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: Request) {
  try {
    const { message, contextData, model, userApiKey } = await req.json();

    // Preferir la API Key ingresada por el médico en la UI; si no está, usar la del .env de respaldo
    const apiKey = userApiKey || process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ 
        role: 'assistant', 
        text: 'Error: OPENROUTER_API_KEY no provista. Ingrese su API Key en el menú de configuración (icono de engranaje).' 
      });
    }

    // Inicializar dinámicamente con la API Key correspondiente
    const openrouter = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: apiKey,
      defaultHeaders: {
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'OncoGyn Clinical Hub',
      }
    });

    const systemPrompt = `Sos el asistente inteligente clínico de OncoGyn, una plataforma para un cirujano oncoginecológico.
Tenés acceso en tiempo real a los siguientes datos del consultorio y hospital del médico:
${JSON.stringify(contextData, null, 2)}

Instrucciones:
1. Respondé de manera concisa, sumamente formal y profesional.
2. Si el médico te pide los postoperatorios de hoy, consultá los datos y resumí las pacientes que están en estado "internación" (mostrando habitación, nombre, temperatura y estado de drenaje/pendientes).
3. Si te pide preparar una evolución para una paciente, generá una plantilla formal de evolución médica basada en los datos provistos.
4. Si te pide cuánto facturó este mes, sumá el total de ingresos registrados en finanzas y detalla el saldo pendiente.
5. El médico prefiere respuestas directas sin rodeos innecesarios.`;

    const selectedModel = model || 'meta-llama/llama-3.1-8b-instruct:free';

    const response = await openrouter.chat.completions.create({
      model: selectedModel,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      temperature: 0.3
    });

    const replyText = response.choices[0]?.message?.content || 'No obtuve respuesta del modelo.';

    return NextResponse.json({ role: 'assistant', text: replyText });

  } catch (error: any) {
    console.error('Error en OpenRouter API Call:', error);
    return NextResponse.json({ 
      role: 'assistant', 
      text: `Error de comunicación con el motor de IA: ${error.message || error}`
    }, { status: 500 });
  }
}
