/**
 * Client-side validation for API responses to catch issues early.
 */

const TELEMETRY_SCHEMA = {
  frames: 'array',
  driver_colors: 'object',
  total_laps: 'number',
  event_name: 'string',
  country_code: 'string',
  date: 'string',
  track_map: 'array',
  weather: 'object',
};

const PREDICTION_SCHEMA = {
  year: 'number',
  round: 'number',
  race_name: 'string',
  fastf1_name: 'string',
  model: 'string',
  has_sprint: 'boolean',
  predictions: 'array',
};

const EVENTS_SCHEMA = {
  round: 'number',
  date: 'string',
  name: 'string',
  country_code: 'string',
  has_sprint: 'boolean',
};

function validateSchema(data, schema, context = 'response') {
  if (!data || typeof data !== 'object') {
    throw new Error(`${context}: expected object, got ${typeof data}`);
  }

  for (const [key, expectedType] of Object.entries(schema)) {
    if (!(key in data)) {
      throw new Error(`${context}: missing required field "${key}"`);
    }
    const actualType = Array.isArray(data[key]) ? 'array' : typeof data[key];
    if (actualType !== expectedType) {
      throw new Error(
        `${context}: field "${key}" has type "${actualType}", expected "${expectedType}"`
      );
    }
  }

  return data;
}

export function validateTelemetry(data) {
  return validateSchema(data, TELEMETRY_SCHEMA, 'Telemetry');
}

export function validatePredictions(data) {
  return validateSchema(data, PREDICTION_SCHEMA, 'Predictions');
}

export function validateEvents(data) {
  if (!Array.isArray(data)) {
    throw new Error('Events: expected array');
  }
  return data.map((item, idx) => validateSchema(item, EVENTS_SCHEMA, `Events[${idx}]`));
}
