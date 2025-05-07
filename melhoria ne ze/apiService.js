// apiService.js
import { API_KEY, OPENWEATHERMAP_FORECAST_BASE_URL } from './config.js';

/**
 * Busca os dados de previsão do tempo detalhada para uma cidade.
 * @async
 * @param {string} cidade O nome da cidade.
 * @param {HTMLElement} feedbackElement Elemento para exibir feedback de carregamento/erro.
 * @returns {Promise<Object|null>} Objeto com dados da API ou null em caso de erro.
 */
export async function buscarPrevisaoDetalhadaAPI(cidade, feedbackElement) {
    if (!API_KEY || API_KEY === "SUA_CHAVE_OPENWEATHERMAP_AQUI" || API_KEY.length < 20) { // Verificação básica
        const msgErroKey = "Chave da API não configurada ou inválida em config.js.";
        console.error(msgErroKey);
        if (feedbackElement) feedbackElement.textContent = msgErroKey;
        return null;
    }

    const url = `${OPENWEATHERMAP_FORECAST_BASE_URL}?q=${encodeURIComponent(cidade)}&appid=${API_KEY}&units=metric&lang=pt_br`;
    console.log("URL da API:", url); // Para debug

    if (feedbackElement) feedbackElement.textContent = 'Buscando previsão...';

    try {
        const response = await fetch(url);
        console.log("Resposta da API (status):", response.status, response.statusText); // Para debug

        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
                console.error("Dados do erro da API:", errorData); // Para debug
            } catch (e) {
                // Se não conseguir parsear o JSON do erro, usa o statusText
                throw new Error(response.statusText || `Erro HTTP ${response.status}`);
            }
            throw new Error(errorData.message || `Erro ${response.status} ao buscar dados.`);
        }
        const data = await response.json();
        console.log("Dados recebidos da API:", data); // Para debug
        if (feedbackElement) feedbackElement.textContent = ''; // Limpa feedback de carregamento
        return data;
    } catch (error) {
        console.error("Erro em buscarPrevisaoDetalhadaAPI:", error);
        if (feedbackElement) feedbackElement.textContent = `Erro: ${error.message}`;
        return null;
    }
}