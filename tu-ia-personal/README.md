# Tu IA personal — versión independiente

Prototipo de asistente de IA personalizado con:
- Chat de texto
- Entrada por voz (micrófono, Web Speech API)
- Salida por voz (la IA te lee las respuestas)
- Memoria persistente en el navegador (localStorage) entre sesiones

A diferencia del prototipo dentro de Claude, aquí el micrófono funciona
sin restricciones porque la página se sirve fuera de cualquier iframe:
el propio navegador te pedirá permiso directamente.

## Cómo funciona

- `public/index.html`: toda la interfaz (frontend). Vive en tu navegador.
- `api/chat.js`: función serverless que llama a la API de Anthropic
  con tu clave, para que esta nunca se exponga en el navegador.
- `api/extract-facts.js`: función que, cada pocos mensajes, resume
  datos personales duraderos del usuario para la memoria.

## Desplegar en Vercel (gratis, recomendado, 5 minutos)

1. Instala Vercel CLI si no la tienes: `npm i -g vercel`
2. Desde esta carpeta, ejecuta: `vercel`
3. Sigue las instrucciones (crea cuenta gratuita si no tienes).
4. En el panel de Vercel de tu proyecto → **Settings → Environment
   Variables**, añade `ANTHROPIC_API_KEY` con tu clave de
   https://console.anthropic.com/
5. Vuelve a desplegar: `vercel --prod`
6. Abre la URL que te da Vercel — ya funciona con micrófono real.

### Probarlo en local antes de desplegar

```
npm install -g vercel
vercel dev
```

Esto levanta el frontend y las funciones serverless en tu máquina
(por ejemplo en `http://localhost:3000`), leyendo `ANTHROPIC_API_KEY`
de un archivo `.env` que crees a partir de `.env.example`.

> Nota: en `localhost` algunos navegadores permiten el micrófono
> incluso sin HTTPS; en producción (Vercel) siempre es HTTPS, así que
> no tendrás problema.

## Siguientes pasos para convertirlo en producto  

- Sustituir `localStorage` por una base de datos real (p. ej.
  Supabase, Postgres) si quieres memoria por usuario con login.
- Añadir autenticación de usuarios.
- Cuando el software esté validado, pasar a la fase de hardware
  (Raspberry Pi + micrófono array como prototipo físico).
