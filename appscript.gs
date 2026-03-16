/**
 * Backend para desplegar como Web App en Google Apps Script.
 *
 * Requisitos:
 * 1) Configurar Script Property OPENAI_API_KEY.
 * 2) Desplegar como Web App con acceso para quien deba consumirlo.
 * 3) Copiar la URL pública y pegarla en index.html.
 */

const OPENAI_BASE_URL = 'https://api.openai.com/v1/responses';
const MODEL_NAME = 'gpt-5.1-nano';

function doGet() {
  try {
    return HtmlService
      .createHtmlOutput(getHtmlTemplateByName())
      .setTitle('Mesa de Expertos Tamalísticos')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    return jsonResponse({
      error: 'No se encontró el archivo HTML de la interfaz.',
      details: String(err),
      tip: 'Crea un archivo HTML llamado index.html o Tamales.html en Apps Script.'
    }, 500);
  }
}

function getHtmlTemplateByName() {
  const htmlCandidates = ['index', 'Tamales'];
  for (let i = 0; i < htmlCandidates.length; i += 1) {
    try {
      return HtmlService.createTemplateFromFile(htmlCandidates[i]).evaluate().getContent();
    } catch (err) {
      // Intentar con el siguiente nombre candidato.
    }
  }

  throw new Error('No existe un archivo HTML compatible (index o Tamales).');
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents || '{}');
    const question = (body.question || '').trim();

    if (!question) {
      return jsonResponse({ error: 'La pregunta es obligatoria.' }, 400);
    }

    const apiKey = PropertiesService.getScriptProperties().getProperty('OPENAI_API_KEY');
    if (!apiKey) {
      return jsonResponse({ error: 'Falta configurar OPENAI_API_KEY en Script Properties.' }, 500);
    }

    const prompt = buildPrompt(question);
    const aiResult = callOpenAI(apiKey, prompt);

    return jsonResponse(aiResult, 200);
  } catch (err) {
    return jsonResponse({
      error: 'Error inesperado en el backend.',
      details: String(err)
    }, 500);
  }
}

function buildPrompt(question) {
  return [
    'Responde en JSON válido y sin texto extra con esta estructura exacta:',
    '{"experto":"...","comelon":"...","fitness":"...","critico":"..."}',
    'Contexto: el usuario pregunta sobre tamales.',
    'Rol experto: enfoque técnico de preparación.',
    'Rol comelón: enfoque de sabor y disfrute.',
    'Rol fitness: opciones más balanceadas.',
    'Rol crítico: evaluación exigente y argumentada.',
    'Pregunta del usuario:',
    question
  ].join('\n');
}

function callOpenAI(apiKey, prompt) {
  const payload = {
    model: MODEL_NAME,
    input: prompt,
    text: {
      format: {
        type: 'json_schema',
        name: 'mesa_tamales',
        schema: {
          type: 'object',
          properties: {
            experto: { type: 'string' },
            comelon: { type: 'string' },
            fitness: { type: 'string' },
            critico: { type: 'string' }
          },
          required: ['experto', 'comelon', 'fitness', 'critico'],
          additionalProperties: false
        }
      }
    }
  };

  const response = UrlFetchApp.fetch(OPENAI_BASE_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      Authorization: 'Bearer ' + apiKey
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const status = response.getResponseCode();
  const raw = response.getContentText();

  if (status < 200 || status >= 300) {
    throw new Error('OpenAI HTTP ' + status + ': ' + raw);
  }

  const parsed = JSON.parse(raw);
  const text = parsed.output_text;

  if (!text) {
    throw new Error('No se recibió output_text desde OpenAI. Respuesta: ' + raw);
  }

  return JSON.parse(text);
}

function jsonResponse(obj, statusCode) {
  // Apps Script no permite definir status code directamente en ContentService,
  // así que devolvemos el JSON y el frontend puede leer "error" si aplica.
  return ContentService
    .createTextOutput(JSON.stringify({ ...obj, _status: statusCode }))
    .setMimeType(ContentService.MimeType.JSON);
}
