// config.js

// ATENÇÃO: ARMAZENAR A API KEY DIRETAMENTE NO CÓDIGO FRONTEND É INSEGURO!
// Em uma aplicação real, a chave NUNCA deve ficar exposta aqui.
// A forma correta envolve um backend (Node.js, Serverless) atuando como proxy.
// Para FINS DIDÁTICOS nesta atividade, vamos usá-la aqui temporariamente.

/**
 * Chave da API OpenWeatherMap.
 * @type {string}
 * @constant
 */
export const API_KEY = "52a34a24ea6a5f3d54f7dea9b93eb015"; // CERTIFIQUE-SE QUE ESTA É A SUA CHAVE VÁLIDA E ATIVA

/**
 * URL base para a API de previsão de 5 dias / 3 horas da OpenWeatherMap.
 * @type {string}
 * @constant
 */
export const OPENWEATHERMAP_FORECAST_BASE_URL = "https://api.openweathermap.org/data/2.5/forecast";