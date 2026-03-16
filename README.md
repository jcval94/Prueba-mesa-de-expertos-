# Prueba mesa de expertos (Tamales)

Implementación propuesta con:
- **Frontend** en `index.html` (interfaz elegante tipo chat/panel).
- **Backend** en `appscript.gs` para desplegar como **Web App** de Google Apps Script.
- **Modelo** de OpenAI configurado como `gpt-5.1-nano`.

## Arquitectura sugerida

```text
Usuario (navegador)
   │
   │ POST /question
   ▼
Frontend index.html (fetch)
   │
   │ POST JSON { question }
   ▼
Google Apps Script Web App (appscript.gs)
   │
   │ POST /v1/responses (OpenAI)
   ▼
OpenAI API (gpt-5.1-nano)
   │
   ▼
JSON con 4 perspectivas: experto, comelon, fitness, critico
```

### ¿Por qué así?
- Evitas exponer la API key en el cliente.
- Despliegue simple sin servidor dedicado.
- Escalable para agregar moderación, logs o caché en Apps Script.

## Cómo usar

1. Abre `appscript.gs` en un proyecto de Google Apps Script.
2. En **Project Settings > Script Properties**, crea:
   - `OPENAI_API_KEY = sk-...`
3. Despliega como **Web App** (Deploy > New deployment > Web app).
4. Copia la URL del Web App.
5. Abre `index.html` y reemplaza:
   - `APPS_SCRIPT_WEB_APP_URL = "REEMPLAZA_AQUI_TU_WEB_APP_URL"`
6. Abre `index.html` en navegador y prueba con una pregunta sobre tamales.

### Si ves el error `No se encontró la función de la secuencia de comandos: doGet`

Ese mensaje aparece al abrir la URL del Web App en el navegador cuando el proyecto no expone
la función `doGet()`. Este repositorio ya la incluye en `appscript.gs`, así que solo necesitas:

1. Guardar cambios en Apps Script.
2. Crear una **nueva implementación** (Deploy > Manage deployments > Edit > New version).
3. Volver a abrir la URL actualizada del Web App.

## Salida esperada

El frontend mostrará tarjetas con respuestas de:
- 👨‍🍳 Experto tamalero
- 😋 Comelón de tamales
- 🏋️ Persona fitness
- 🧐 Crítico de tamales

> Nota: aunque el enunciado menciona 3 versiones, también lista 4 perfiles. Esta solución respeta los 4 perfiles listados.
