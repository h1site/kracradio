// Supabase Edge Function pour inscription newsletter via Brevo
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const BREVO_API_KEY = Deno.env.get('BREVO_API_KEY') || '';
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { email, lang = 'fr' } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Messages de bienvenue selon la langue
    const welcomeMessages = {
      fr: {
        subject: 'Bienvenue sur KracRadio!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #E50914;">Bienvenue sur KracRadio! 🎵</h1>
            <p>Merci de vous être abonné à notre newsletter!</p>
            <p>Vous recevrez désormais les dernières nouveautés du rap québécois, nos podcasts exclusifs et bien plus encore.</p>
            <p style="margin-top: 30px;">
              <a href="https://kracradio.com" style="background-color: #E50914; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Visiter KracRadio</a>
            </p>
            <p style="margin-top: 30px; color: #666; font-size: 12px;">
              KracRadio - La meilleure musique rap québécois 24/7
            </p>
          </div>
        `
      },
      en: {
        subject: 'Welcome to KracRadio!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #E50914;">Welcome to KracRadio! 🎵</h1>
            <p>Thank you for subscribing to our newsletter!</p>
            <p>You will now receive the latest Quebec rap news, our exclusive podcasts, and much more.</p>
            <p style="margin-top: 30px;">
              <a href="https://kracradio.com" style="background-color: #E50914; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Visit KracRadio</a>
            </p>
            <p style="margin-top: 30px; color: #666; font-size: 12px;">
              KracRadio - The best Quebec rap music 24/7
            </p>
          </div>
        `
      },
      es: {
        subject: '¡Bienvenido a KracRadio!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #E50914;">¡Bienvenido a KracRadio! 🎵</h1>
            <p>¡Gracias por suscribirte a nuestro boletín!</p>
            <p>Ahora recibirás las últimas noticias del rap quebequense, nuestros podcasts exclusivos y mucho más.</p>
            <p style="margin-top: 30px;">
              <a href="https://kracradio.com" style="background-color: #E50914; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Visitar KracRadio</a>
            </p>
            <p style="margin-top: 30px; color: #666; font-size: 12px;">
              KracRadio - La mejor música rap quebequense 24/7
            </p>
          </div>
        `
      }
    };

    const message = welcomeMessages[lang] || welcomeMessages.fr;

    // Envoyer l'email via Brevo
    const brevoResponse = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'KracRadio',
          email: 'info@kracradio.com'
        },
        to: [
          {
            email: email,
            name: email.split('@')[0]
          }
        ],
        subject: message.subject,
        htmlContent: message.html
      }),
    });

    if (!brevoResponse.ok) {
      const errorText = await brevoResponse.text();
      console.error('Brevo API error:', errorText);
      throw new Error('Failed to send email via Brevo');
    }

    const result = await brevoResponse.json();
    console.log('Email sent successfully:', result);

    return new Response(
      JSON.stringify({ success: true, message: 'Newsletter subscription successful' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
