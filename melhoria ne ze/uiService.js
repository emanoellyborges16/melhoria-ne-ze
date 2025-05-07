// uiService.js (adições para a garagem)

/**
 * Atualiza a exibição do status da porta na UI.
 * @param {boolean} estaAberta True se a porta está aberta, false caso contrário.
 * @param {HTMLElement} statusPortaElement Elemento span do status da porta.
 * @param {HTMLElement} btnPortaElement Elemento botão de controle da porta.
 */
export function atualizarStatusPortaUI(estaAberta, statusPortaElement, btnPortaElement) {
    if (statusPortaElement) {
        statusPortaElement.textContent = estaAberta ? 'Aberta' : 'Fechada';
        statusPortaElement.className = 'status'; // Limpa classes antigas de status
        statusPortaElement.classList.add(estaAberta ? 'status-aberta' : 'status-fechada');
    }
    if (btnPortaElement) {
        btnPortaElement.textContent = estaAberta ? 'Fechar Porta' : 'Abrir Porta';
        // Poderia adicionar ícones aqui também se quisesse mudar dinamicamente
        // btnPortaElement.innerHTML = `<i class="fas ${estaAberta ? 'fa-door-closed' : 'fa-door-open'}"></i> ${estaAberta ? 'Fechar Porta' : 'Abrir Porta'}`;
    }
}

/**
 * Atualiza a exibição do status da luz na UI.
 * @param {boolean} estaLigada True se a luz está ligada, false caso contrário.
 * @param {HTMLElement} statusLuzElement Elemento span do status da luz.
 * @param {HTMLElement} btnLuzElement Elemento botão de controle da luz.
 */
export function atualizarStatusLuzUI(estaLigada, statusLuzElement, btnLuzElement) {
    if (statusLuzElement) {
        statusLuzElement.textContent = estaLigada ? 'Ligada' : 'Desligada';
        statusLuzElement.className = 'status'; // Limpa classes antigas de status
        statusLuzElement.classList.add(estaLigada ? 'status-ligada' : 'status-desligada');
    }
    if (btnLuzElement) {
        btnLuzElement.textContent = estaLigada ? 'Desligar Luz' : 'Ligar Luz';
    }
}

// ... (resto do uiService.js com as funções de previsão) ...
// Lembre-se de exportar as funções de exibição da previsão
// export function exibirPrevisaoNaUI(previsaoDiaria, nomeCidade, resultadoContainer) { ... }
// export function limparResultadosDaUI(resultadoContainer) { ... }
// export function exibirMensagemFeedbackNaUI(mensagem, feedbackElement, isError = false) { ... }