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
const CHAVE_STORAGE_PORTA = 'garagemEstadoPorta_v2'; // Adicionado _v2 para evitar conflito com versões antigas
const CHAVE_STORAGE_LUZ = 'garagemEstadoLuz_v2';
const CHAVE_STORAGE_ULTIMA_CIDADE = 'garagemUltimaCidadePrevisao_v2';

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
function processarDadosForecastDiario(apiData) {
    if (!apiData || !apiData.list || apiData.list.length === 0) {
        // console.warn("processarDadosForecastDiario: Dados da API inválidos ou vazios.", apiData); // Descomente para debug
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
        if (item.weather && item.weather.length > 0) {
            const descricao = item.weather[0].description;
            const icone = item.weather[0].icon;
            previsoesAgrupadasPorDia[diaString].descricoesContador[descricao] = (previsoesAgrupadasPorDia[diaString].descricoesContador[descricao] || 0) + 1;
            previsoesAgrupadasPorDia[diaString].iconesContador[icone] = (previsoesAgrupadasPorDia[diaString].iconesContador[icone] || 0) + 1;
        }
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

        let descricaoPrincipal = 'Condição indisponível';
        if (Object.keys(dadosDoDia.descricoesContador).length > 0) {
            descricaoPrincipal = Object.keys(dadosDoDia.descricoesContador).reduce((a, b) =>
                dadosDoDia.descricoesContador[a] > dadosDoDia.descricoesContador[b] ? a : b);
        }

        let iconePrincipal = '01d'; // Ícone padrão (céu limpo, dia)
        if (Object.keys(dadosDoDia.iconesContador).length > 0) {
            let maxCountIconeGeral = 0;
            let iconeMaisFrequenteGeral = '';
            for (const icone in dadosDoDia.iconesContador) {
                if (dadosDoDia.iconesContador[icone] > maxCountIconeGeral) {
                    maxCountIconeGeral = dadosDoDia.iconesContador[icone];
                    iconeMaisFrequenteGeral = icone;
                }
            }
            // Tenta pegar o ícone do meio-dia (ou próximo) se disponível e representativo
            // A API de forecast retorna dados de 3 em 3h. O item das 12:00 ou 15:00 pode ser bom.
            // Para simplificar, pegamos o mais frequente, mas priorizando os "d" (diurnos)
            let iconeDiurnoFrequente = '';
            let maxCountDiurno = 0;
            for(const icone in dadosDoDia.iconesContador){
                if(icone.endsWith('d') && dadosDoDia.iconesContador[icone] > maxCountDiurno){
                    maxCountDiurno = dadosDoDia.iconesContador[icone];
                    iconeDiurnoFrequente = icone;
                }
            }
            iconePrincipal = iconeDiurnoFrequente || iconeMaisFrequenteGeral || '01d';
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
    
    resultadoDiarioArray.sort((a, b) => new Date(a.data) - new Date(b.data));

    if (resultadoDiarioArray.length === 0) {
        // console.warn("processarDadosForecastDiario: Nenhum dia processado."); // Descomente para debug
        exibirMensagemFeedbackNaUI('Não foi possível processar os dados da previsão em formato diário.', feedbackUsuarioElement, true);
        return null;
    }
    // console.log("processarDadosForecastDiario: Previsão processada:", resultadoDiarioArray); // Descomente para debug
    return resultadoDiarioArray;
}

async function handleVerificarClima() {
    if (!cidadeInputElement || !feedbackUsuarioElement || !previsaoResultadoContainer) {
        console.error("ERRO FATAL: Elementos da UI para previsão do tempo não foram encontrados no DOM!");
        alert("Erro crítico: Elementos da página não encontrados. Verifique o console.");
        return;
    }
    const cidade = cidadeInputElement.value.trim();

    limparResultadosPrevisaoUI(previsaoResultadoContainer);
    exibirMensagemFeedbackNaUI('', feedbackUsuarioElement); // Limpa mensagens anteriores

    if (!cidade) {
        exibirMensagemFeedbackNaUI('Por favor, digite o nome de uma cidade.', feedbackUsuarioElement, true);
        return;
    }

    localStorage.setItem(CHAVE_STORAGE_ULTIMA_CIDADE, cidade);
    // console.log(`Buscando previsão para: ${cidade}`); // Descomente para debug

    const dadosBrutosDaAPI = await buscarPrevisaoDetalhadaAPI(cidade, feedbackUsuarioElement);

    if (dadosBrutosDaAPI && dadosBrutosDaAPI.cod === "200") {
        const previsaoProcessada = processarDadosForecastDiario(dadosBrutosDaAPI);
        if (previsaoProcessada && previsaoProcessada.length > 0) {
            exibirPrevisaoNaUI(previsaoProcessada, dadosBrutosDaAPI.city.name, previsaoResultadoContainer);
            exibirMensagemFeedbackNaUI(`Previsão para ${dadosBrutosDaAPI.city.name} carregada.`, feedbackUsuarioElement);
        } else {
            if (!feedbackUsuarioElement.textContent.includes('Erro') && !feedbackUsuarioElement.textContent.includes('Buscando')) {
                 exibirMensagemFeedbackNaUI('Não há dados de previsão suficientes para exibir após o processamento.', feedbackUsuarioElement, true);
            }
        }
    } else if (dadosBrutosDaAPI) {
        // A mensagem de erro já deve ter sido exibida pelo feedbackElement em buscarPrevisaoDetalhadaAPI
        console.error("handleVerificarClima: API retornou erro:", dadosBrutosDaAPI.message || `cod: ${dadosBrutosDaAPI.cod}`);
    } else {
        // Se buscarPrevisaoDetalhadaAPI retornou null, a mensagem de erro já deve ter sido exibida lá.
        // Apenas garantimos que o feedback não fique preso em "buscando" se algo muito errado acontecer antes.
        if (feedbackUsuarioElement.textContent.includes('Buscando')) {
             exibirMensagemFeedbackNaUI('Falha ao buscar dados. Verifique o console para mais detalhes.', feedbackUsuarioElement, true);
        }
        console.error("handleVerificarClima: buscarPrevisaoDetalhadaAPI retornou null ou falhou.");
    }
}

// --- Inicialização e Event Listeners ---
function inicializarAplicacao() {
    if (statusPortaElement && btnAlternarPorta) {
        atualizarStatusPortaUI(portaEstaAberta, statusPortaElement, btnAlternarPorta);
        btnAlternarPorta.addEventListener('click', handleAlternarPorta);
    }
    if (statusLuzElement && btnAlternarLuz) {
        atualizarStatusLuzUI(luzEstaLigada, statusLuzElement, btnAlternarLuz);
        btnAlternarLuz.addEventListener('click', handleAlternarLuz);
    }

    if (cidadeInputElement) {
        cidadeInputElement.value = ultimaCidadePesquisada;
        cidadeInputElement.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                handleVerificarClima();
            }
        });
    } else {
        console.warn("Elemento #cidade-input não encontrado durante inicialização.");
    }

    if (verificarClimaButton) {
        verificarClimaButton.addEventListener('click', handleVerificarClima);
    } else {
        console.warn("Elemento #verificar-clima-btn não encontrado durante inicialização.");
    }
}

document.addEventListener('DOMContentLoaded', inicializarAplicacao);