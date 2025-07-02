// ===================================================================================
// PARTE 1: LÓGICA DOS BOTÕES "F" (O CÓDIGO QUE VOCÊ JÁ TEM E FUNCIONA)
// ===================================================================================

console.log(">>> Extensão v6 (Botões + Voz) está ativa e procurando pela tabela #planilha... <<<");

/**
 * Função principal que adiciona os botões de falta.
 */
function adicionarBotoesDeFalta() {
    const aTabela = document.getElementById('planilha');
    if (!aTabela) return;

    const thead = aTabela.querySelector('thead');
    if (!thead) return;
    
    const cabecalhoDosDias = thead.querySelectorAll('tr')[1];
    if (!cabecalhoDosDias) return;
    
    if (document.getElementById("botoes-falta-container")) {
        return;
    }

    const buttonRow = document.createElement('tr');
    buttonRow.id = "botoes-falta-container";

    buttonRow.appendChild(document.createElement('th'));
    buttonRow.appendChild(document.createElement('th'));

    const dateHeaders = cabecalhoDosDias.querySelectorAll('th[class]');

    dateHeaders.forEach(header => {
        const buttonCell = document.createElement('th');

        if (header.classList.contains('feriado')) {
            // Célula vazia para feriados
        } else {
            const button = document.createElement('button');
            button.className = 'botao-falta';
            button.textContent = 'F';

            button.onclick = function() {
                const columnIndexClass = `aula_${header.classList[0]}`;
                console.log(`Botão 'F' clicado. Preenchendo a coluna '${columnIndexClass}' com faltas (valor 2).`);
                
                const cellsInColumn = aTabela.querySelectorAll(`td.${columnIndexClass}`);
                
                cellsInColumn.forEach(cell => {
                    if (cell.textContent !== 'T') { 
                        cell.textContent = '2'; // Define o valor como 2
                        cell.click(); // Simula o clique para o SIGAA registrar a alteração
                    }
                });
                
                document.body.click(); // Simula clique fora para salvar
            };

            buttonCell.appendChild(button);
        }
        
        buttonRow.appendChild(buttonCell);
    });
    
    buttonRow.appendChild(document.createElement('th'));
    buttonRow.appendChild(document.createElement('th'));

    thead.insertBefore(buttonRow, cabecalhoDosDias);
    
    console.log("%c>>> SUCESSO! Botões de falta foram adicionados, ignorando feriados. <<<", "color: green; font-size: 1.2em; font-weight: bold;");
}

/**
 * "Vigia" que espera a tabela dos botões aparecer.
 */
const vigiaBotoes = setInterval(function() {
    const tabelaVisivel = document.getElementById('planilha');

    if (tabelaVisivel) {
        console.log(">>> Tabela #planilha encontrada! Executando a função de adicionar botões... <<<");
        adicionarBotoesDeFalta();
        clearInterval(vigiaBotoes);
    }
}, 500);

setTimeout(() => { clearInterval(vigiaBotoes); }, 20000);


// ===================================================================================
// PARTE 2: NOVA LÓGICA DE RECONHECIMENTO DE VOZ
// ===================================================================================

// Verifica se o navegador suporta a API de Voz
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition;

if (SpeechRecognition) {
    console.log("API de Reconhecimento de Voz suportada.");
    recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR'; // Define o idioma para Português do Brasil
    recognition.continuous = true; // Continua ouvindo
    recognition.interimResults = false; // Não queremos resultados parciais

    // Evento chamado quando uma fala é reconhecida com sucesso
    recognition.onresult = function(event) {
        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                const transcript = event.results[i][0].transcript.trim().toLowerCase();
                console.log('Texto reconhecido pela voz:', transcript);
                findAndHighlightName(transcript);
            }
        }
    };

    recognition.onerror = function(event) {
        console.error('Erro no reconhecimento de voz:', event.error);
    };

    recognition.onend = function() {
        console.log('Reconhecimento de voz parado.');
    };

} else {
    console.error("Este navegador não suporta a Web Speech API.");
}

// Função para "limpar" os nomes (remover acentos, etc.) para uma comparação mais fácil
function normalizeString(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Função para procurar o nome na tabela e destacar a linha
function findAndHighlightName(recognizedName) {
    const normalizedRecognizedName = normalizeString(recognizedName);
    const studentRows = document.querySelectorAll('#planilha tbody tr');

    let found = false;
    studentRows.forEach(row => {
        const nameCell = row.querySelector('td:nth-child(2)'); // A segunda coluna <td> é a do nome
        if (nameCell) {
            const studentName = nameCell.textContent.trim();
            const normalizedStudentName = normalizeString(studentName);

            // Verifica se o nome que falamos está INCLUÍDO no nome completo do aluno na lista
            if (normalizedStudentName.includes(normalizedRecognizedName)) {
                found = true;
                console.log(`Nome correspondente encontrado: ${studentName}`);
                
                // Adiciona a classe de CSS para o destaque
                row.classList.add('highlight-row');
                
                // Agenda a remoção do destaque após 5 segundos
                setTimeout(() => {
                    row.classList.remove('highlight-row');
                }, 5000); // 5000 milissegundos = 5 segundos
            }
        }
    });

    if (!found) {
        console.log(`Nenhum aluno encontrado para o nome: "${recognizedName}"`);
    }
}

// Ouve as mensagens que vêm do popup (quando clicamos em "Iniciar" ou "Parar")
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (!recognition) return;

    if (request.command === 'start_listening') {
        console.log("Comando para INICIAR a escuta recebido.");
        recognition.start();
        sendResponse({status: "escutando"});
    } else if (request.command === 'stop_listening') {
        console.log("Comando para PARAR a escuta recebido.");
        recognition.stop();
        sendResponse({status: "parado"});
    }
    return true; // Necessário para respostas assíncronas
});