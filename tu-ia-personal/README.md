# Tu IA personal — versión independiente

Prototipo de asistente de IA personalizado con:
- Chat de texto
- Entrada por voz (micrófono, Web Speech API)
- Salida por voz (la IA te lee las respuestas)
- **Login de usuarios y memoria guardada en base de datos** (Supabase),
  ya no en el navegador — cada usuario tiene su propia cuenta y su
  propia memoria, accesible desde cualquier dispositivo.

## 1. Crear el proyecto en Supabase (gratis)

1. Ve a https://supabase.com → crea una cuenta → "New project".
2. Cuando esté listo, ve a **SQL Editor** → "New query", pega el
   contenido de `supabase-schema.sql` (incluido en este proyecto) y
   pulsa "Run". Esto crea la tabla `memories` donde vive la memoria
   de cada usuario, protegida para que nadie pueda leer la de otro.
3. Ve a **Authentication → Providers** y confirma que "Email" está
   activado (lo está por defecto).
   - Opcional: en **Authentication → Settings**, puedes desactivar
     "Confirm email" mientras pruebas, para no tener que confirmar
     cada cuenta nueva por correo.
4. Ve a **Settings → API** y copia tres valores, los necesitarás
   ahora:
   - `Project URL`
   - `anon public` key
   - `service_role` key (¡mantenla secreta, nunca la pongas en el frontend!)

## 2. Configurar el frontend

Abre `public/index.html`, busca esta parte cerca del final:

```js
const SUPABASE_URL = 'https://TU-PROYECTO.supabase.co';
const SUPABASE_ANON_KEY = 'TU-ANON-KEY';
```

Sustituye ambos valores por tu `Project URL` y tu clave `anon public`
de Supabase (paso 1.4). Estos dos valores son públicos y seguros de
tener en el navegador.

## 3. Variables de entorno del servidor

Además de `ANTHROPIC_API_KEY` (de https://console.anthropic.com/),
añade estas dos en tu hosting (Vercel → Settings → Environment
Variables):

```
SUPABASE_URL=https://TU-PROYECTO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

La `service_role` key es privada — solo debe vivir en el servidor,
nunca en `index.html` ni en ningún archivo que llegue al navegador.

## 4. Desplegar en Vercel

1. `npm i -g vercel` (si no lo tienes ya)
2. Desde esta carpeta: `vercel`
3. Añade las tres variables de entorno de arriba en el panel de Vercel.
4. `vercel --prod`
5. Abre tu URL, regístrate con un email, y ya tienes tu cuenta con
   memoria persistente en base de datos.

## Cómo funciona ahora

- `public/index.html`: pantalla de login/registro + chat, usando el
  SDK de Supabase (cargado desde CDN) para autenticar al usuario.
- `api/chat.js` y `api/extract-facts.js`: comprueban el token de
  sesión de Supabase antes de llamar a la IA.
- `api/memory.js`: lee y guarda `facts` (datos personales recordados)
  e `history` (últimos mensajes) en la tabla `memories`, filtrado
  siempre por el usuario autenticado.
- `supabase-schema.sql`: la tabla y las reglas de seguridad (row
  level security) que garantizan que cada usuario solo ve su propia
  memoria.

## Siguientes pasos para convertirlo en producto

- Añadir login social (Google, Apple) desde Supabase Authentication
  si quieres reducir la fricción de registro.
- Cuando el software esté validado, pasar a la fase de hardware
  (Raspberry Pi + micrófono array como prototipo físico).
