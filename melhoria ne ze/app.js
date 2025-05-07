// app.js
import { buscarPrevisaoDetalhadaAPI } from './apiService.js';
import {
    exibirPrevisaoNaUI,
    limparResultadosPrevisaoUI,
    exibirMensagemFeedbackNaUI,
    atualizarStatusPortaUI,
    atualizarStatusLuzUI
} from './uiService.js';

// --- Seletores do DOM ---
const statusPortaElement = document.getElementById('status-porta');
const btnAlternarPorta = document.getElementById('btn-alternar-porta');
const statusLuzElement = document.getElementById('status-luz');
const btnAlternarLuz = document.getElementById('btn-alternar-luz');
const cidadeInputElement = document.getElementById('cidade-input');
const verificarClimaButton = document.getElementById('verificar-clima-btn');
const previsaoResultadoContainer = document.getElementById('previsao-tempo-resultado');
const feedbackUsuarioElement = document.getElementById('feedback-usuario');

// --- Chaves para localStorage ---
const CHAVE_STORAGE_PORTA = 'garagemEstadoPorta';
const CHAVE_STORAGE_LUZ = 'garagemEstadoLuz';
const CHAVE_STORAGE_ULTIMA_CIDADE = 'garagemUltimaCidadePrevisao';

// --- Estado da Aplicação ---
let portaEstaAberta = JSON.parse(localStorage.getItem(CHAVE_STORAGE_PORTA)) || false;
let luzEstaLigada = JSON.parse(localStorage.getItem(CHAVE_STORAGE_LUZ)) || false;
let ultimaCidadePesquisada = localStorage.getItem(CHAVE_STORAGE_ULTIMA_CIDADE) || "";

// --- Lógica da Garagem ---
function handleAlternarPorta() {
    portaEstaAberta = !portaEstaAberta;
    atualizarStatusPortaUI(portaEstaAberta, statusPortaElement, btnAlternarPorta);
    localStorage.setItem(CHAVE_STORAGE_PORTA, JSON.stringify(portaEstaAberta));
}

function handleAlternarLuz() {
    luzEstaLigada = !luzEstaLigada;
    atualizarStatusLuzUI(luzEstaLigada, statusLuzElement, btnAlternarLuz);
    localStorage.setItem(CHAVE_STORAGE_LUZ, JSON.stringify(luzEstaLigada));
}

// --- Lógica da Previsão do Tempo ---
/**
 * Processa os dados brutos da API OpenWeatherMap Forecast para um formato resumido por dia.
 * @param {Object} apiData Os dados completos retornados pela API.
 * @returns {Array<Object>|null} Um array de objetos com a previsão diária ou null.
 */
function processarDadosForecastDiario(apiData) {
    if (!apiData || !apiData.list || apiData.list.length === 0) {
        console.warn("processarDadosForecastDiario: Dados da API inválidos ou vazios.", apiData);
        exibirMensagemFeedbackNaUI('Dados de previsão recebidos incompletos ou vazios.', feedbackUsuarioElement, true);
        return null;
    }

    const previsoesAgrupadasPorDia = {};

    apiData.list.forEach(item => {
        const dataHora = new Date(item.dt * 1000);
        const diaString = dataHora.toISOString().split('T')[0];

        if (!previsoesAgrupadasPorDia[diaString]) {
            previsoesAgrupadasPorDia[diaString] = {
                temps: [],
                descricoesContador: {},
                iconesContador: {},
                umidades: [],
                velocidadesVento: [],
                dataCompletaObj: dataHora
            };
        }
        previsoesAgrupadasPorDia[diaString].temps.push(item.main.temp);
        previsoesAgrupadasPorDia[diaString].umidades.push(item.main.humidity);
        previsoesAgrupadasPorDia[diaString].velocidadesVento.push(item.wind.speed);
        const descricao = item.weather[0].description;
        const icone = item.weather[0].icon;
        previsoesAgrupadasPorDia[diaString].descricoesContador[descricao] = (previsoesAgrupadasPorDia[diaString].descricoesContador[descricao] || 0) + 1;
        previsoesAgrupadasPorDia[diaString].iconesContador[icone] = (previsoesAgrupadasPorDia[diaString].iconesContador[icone] || 0) + 1;
    });

    const resultadoDiarioArray = [];
    for (const diaStr in previsoesAgrupadasPorDia) {
        const dadosDoDia = previsoesAgrupadasPorDia[diaStr];
        if (dadosDoDia.temps.length === 0) continue;

        const temp_min = Math.min(...dadosDoDia.temps);
        const temp_max = Math.max(...dadosDoDia.temps);
        const umidade_media = dadosDoDia.umidades.reduce((a, b) => a + b, 0) / dadosDoDia.umidades.length;
        const vento_medio_mps = dadosDoDia.velocidadesVento.reduce((a, b) => a + b, 0) / dadosDoDia.velocidadesVento.length;
        const vento_medio_kmh = vento_medio_mps * 3.6;

        let descricaoPrincipal = Object.keys(dadosDoDia.descricoesContador).length > 0 ?
            Object.keys(dadosDoDia.descricoesContador).reduce((a, b) => dadosDoDia.descricoesContador[a] > dadosDoDia.descricoesContador[b] ? a : b)
            : 'N/A';

        let iconePrincipal = '01d'; // Ícone padrão
        if (Object.keys(dadosDoDia.iconesContador).length > 0) {
            let maxCountIcone = 0;
            let melhorIconeDiurno = '';
            let maxCountIconeDiurno = 0;
            for (const icone in dadosDoDia.iconesContador) {
                const count = dadosDoDia.iconesContador[icone];
                if (icone.endsWith('d')) {
                    if (count > maxCountIconeDiurno) { maxCountIconeDiurno = count; melhorIconeDiurno = icone; }
                }
                if (count > maxCountIcone) { maxCountIcone = count; iconePrincipal = icone; }
            }
            if (melhorIconeDiurno) iconePrincipal = melhorIconeDiurno;
        }
        
        resultadoDiarioArray.push({
            data: diaStr,
            dataCompleta: dadosDoDia.dataCompletaObj,
            temp_min: parseFloat(temp_min.toFixed(1)),
            temp_max: parseFloat(temp_max.toFixed(1)),
            descricao: descricaoPrincipal,
            icone: iconePrincipal,
            umidade_media: parseFloat(umidade_media.toFixed(1)),
            vento_medio_kmh: parseFloat(vento_medio_kmh.toFixed(1))
        });
    }
    
    resultadoDiarioArray.sort((a, b) => a.dataCompleta - b.dataCompleta);

    if (resultadoDiarioArray.length === 0) {
        console.warn("processarDadosForecastDiario: Nenhum dia processado.");
        exibirMensagemFeedbackNaUI('Não foi possível processar os dados da previsão em formato diário.', feedbackUsuarioElement, true);
        return null;
    }
    console.log("processarDadosForecastDiario: Previsão processada:", resultadoDiarioArray);
    return resultadoDiarioArray;
}


/**
 * Manipulador principal para buscar e exibir a previsão do tempo.
 * @async
 */
async function handleVerificarClima() {
    if (!cidadeInputElement || !feedbackUsuarioElement || !previsaoResultadoContainer) {
        console.error("Elementos da UI para previsão do tempo não encontrados!");
        return;
    }
    const cidade = cidadeInputElement.value.trim();

    limparResultadosPrevisaoUI(previsaoResultadoContainer);
    exibirMensagemFeedbackNaUI('', feedbackUsuarioElement);

    if (!cidade) {
        exibirMensagemFeedbackNaUI('Por favor, digite o nome de uma cidade.', feedbackUsuarioElement, true);
        return;
    }

    localStorage.setItem(CHAVE_STORAGE_ULTIMA_CIDADE, cidade);
    console.log(`Buscando previsão para: ${cidade}`);

    const dadosBrutosDaAPI = await buscarPrevisaoDetalhadaAPI(cidade, feedbackUsuarioElement);

    if (dadosBrutosDaAPI && dadosBrutosDaAPI.cod === "200") { // Sucesso da API
        const previsaoProcessada = processarDadosForecastDiario(dadosBrutosDaAPI);
        if (previsaoProcessada && previsaoProcessada.length > 0) {
            exibirPrevisaoNaUI(previsaoProcessada, dadosBrutosDaAPI.city.name, previsaoResultadoContainer);
            exibirMensagemFeedbackNaUI(`Previsão para ${dadosBrutosDaAPI.city.name} carregada.`, feedbackUsuarioElement);
        } else {
            // A mensagem de erro já deve ter sido exibida por processarDadosForecastDiario
            // ou o feedback de "buscando" ainda está lá se a API retornou mas o processamento não deu certo.
            if (!feedbackUsuarioElement.textContent.includes('Erro') && !feedbackUsuarioElement.textContent.includes('Buscando')) {
                 exibirMensagemFeedbackNaUI('Não há dados de previsão suficientes para exibir após o processamento.', feedbackUsuarioElement, true);
            }
            limparResultadosPrevisaoUI(previsaoResultadoContainer);
        }
    } else if (dadosBrutosDaAPI) { // A API retornou algo, mas não foi sucesso (ex: {cod: "404", message: "city not found"})
        // A mensagem de erro já foi definida por buscarPrevisaoDetalhadaAPI no feedbackElement
        console.error("handleVerificarClima: API retornou erro:", dadosBrutosDaAPI.message || `cod: ${dadosBrutosDaAPI.cod}`);
        limparResultadosPrevisaoUI(previsaoResultadoContainer);
    } else { // buscarPrevisaoDetalhadaAPI retornou null (erro de fetch, rede, ou API key não configurada)
        // A mensagem de erro já foi definida por buscarPrevisaoDetalhadaAPI
        console.error("handleVerificarClima: buscarPrevisaoDetalhadaAPI retornou null.");
        if (!feedbackUsuarioElement.textContent.includes('Erro') && !feedbackUsuarioElement.textContent.includes('Buscando')) {
            exibirMensagemFeedbackNaUI('Falha ao buscar dados. Verifique console para detalhes.', feedbackUsuarioElement, true);
        }
        limparResultadosPrevisaoUI(previsaoResultadoContainer);
    }
}

// --- Inicialização e Event Listeners ---
function inicializarAplicacao() {
    if (statusPortaElement && btnAlternarPorta) {
        atualizarStatusPortaUI(portaEstaAberta, statusPortaElement, btnAlternarPorta);
    }
    if (statusLuzElement && btnAlternarLuz) {
        atualizarStatusLuzUI(luzEstaLigada, statusLuzElement, btnAlternarLuz);
    }
    if (cidadeInputElement && ultimaCidadePesquisada) {
        cidadeInputElement.value = ultimaCidadePesquisada;
    }
    // Adiciona listeners apenas se os elementos existirem
    if (btnAlternarPorta) btnAlternarPorta.addEventListener('click', handleAlternarPorta);
    if (btnAlternarLuz) btnAlternarLuz.addEventListener('click', handleAlternarLuz);
    if (verificarClimaButton) verificarClimaButton.addEventListener('click', handleVerificarClima);
    if (cidadeInputElement) {
        cidadeInputElement.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                handleVerificarClima();
            }
        });
    } else {
        console.warn("Elemento #cidade-input não encontrado.");
    }
}

document.addEventListener('DOMContentLoaded', inicializarAplicacao);