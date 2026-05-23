const API_BASE_URL = 'https://f1-racing-data.onrender.com';

const anoSelect = document.getElementById('ano-select');
const corridaSelect = document.getElementById('corrida-select');
const sessaoSelect = document.getElementById('sessao-select');
const btnCarregar = document.getElementById('btn-carregar');
const corpoTabela = document.getElementById('tabela-corpo');
const circuitoContainer = document.getElementById('circuito-container');
const gpName = document.getElementById('gp-name');
const sessionNameSubtitle = document.getElementById('session-name');

const anoAtual = new Date().getFullYear();
for (let ano = anoAtual; ano >= 2018; ano--) {
    const option = document.createElement('option');
    option.value = ano;
    option.textContent = ano;
    anoSelect.appendChild(option);
}

// Função para renderizar os dados na tela (separada para reuso)
function renderizarTabela(dados) {
    corpoTabela.innerHTML = ''; 
    dados.resultados.forEach(linha => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td style="font-weight: bold; color: var(--text-muted);">${linha.pos}</td>
            <td class="driver-name">${linha.driver}</td>
            <td>${linha.team}</td>
            <td><span class="compound-indicator" style="background-color: ${linha.color}; box-shadow: 0 0 6px ${linha.color};"></span></td>
            <td style="font-family: monospace; font-size: 1.1rem; font-weight: bold;">${linha.time}</td>
        `;
        corpoTabela.appendChild(tr);
    });

    if(dados.circuito_base64) {
        circuitoContainer.innerHTML = `<img src="${dados.circuito_base64}" alt="Traçado do Circuito" class="circuit-img">`;
    } else {
        circuitoContainer.innerHTML = `<p class="loading">Traçado indisponível para esta sessão.</p>`;
    }
}

// O Pré-load: Baixa os dados silenciosamente e salva no cache do navegador
async function preloadSessao(ano, gp, sessao) {
    const cacheKey = `f1_${ano}_${gp}_${sessao}`;
    if (!localStorage.getItem(cacheKey)) {
        try {
            const resposta = await fetch(`${API_BASE_URL}/api/resultado/${ano}/${gp}/${sessao}`);
            const dados = await resposta.json();
            if (dados.sucesso) {
                localStorage.setItem(cacheKey, JSON.stringify(dados));
            }
        } catch (e) {
            console.log("Preload falhou, tentará novamente no clique.");
        }
    }
}

anoSelect.addEventListener('change', async () => {
    const ano = anoSelect.value;
    sessaoSelect.innerHTML = '<option value="">Aguardando GP...</option>';
    sessaoSelect.disabled = true;
    btnCarregar.disabled = true;
    
    if (!ano) return;

    corridaSelect.innerHTML = '<option value="">Buscando calendário...</option>';
    corridaSelect.disabled = true;

    try {
        // Usa cache pro calendário também!
        const cacheKey = `calendario_${ano}`;
        let dados;
        if (localStorage.getItem(cacheKey)) {
            dados = JSON.parse(localStorage.getItem(cacheKey));
        } else {
            const resposta = await fetch(`${API_BASE_URL}/api/corridas/${ano}`);
            dados = await resposta.json();
            localStorage.setItem(cacheKey, JSON.stringify(dados));
        }

        corridaSelect.innerHTML = '<option value="">Selecione o GP</option>';
        dados.corridas.forEach(corrida => {
            const option = document.createElement('option');
            option.value = corrida;
            option.textContent = corrida;
            corridaSelect.appendChild(option);
        });
        corridaSelect.disabled = false;
    } catch (erro) {
        corridaSelect.innerHTML = '<option value="">Erro ao carregar</option>';
    }
});

corridaSelect.addEventListener('change', async () => {
    const ano = anoSelect.value;
    const gp = corridaSelect.value;
    btnCarregar.disabled = true;
    if (!gp) return;

    sessaoSelect.innerHTML = '<option value="">Buscando sessões...</option>';
    sessaoSelect.disabled = true;

    try {
        const cacheKey = `sessoes_${ano}_${gp}`;
        let dados;
        if (localStorage.getItem(cacheKey)) {
            dados = JSON.parse(localStorage.getItem(cacheKey));
        } else {
            const resposta = await fetch(`${API_BASE_URL}/api/sessoes/${ano}/${gp}`);
            dados = await resposta.json();
            if (dados.sucesso) localStorage.setItem(cacheKey, JSON.stringify(dados));
        }

        if(dados.sucesso) {
            sessaoSelect.innerHTML = '<option value="">Selecione a Sessão</option>';
            dados.sessoes.forEach(sessao => {
                const option = document.createElement('option');
                option.value = sessao;
                option.textContent = sessao;
                sessaoSelect.appendChild(option);
            });
            sessaoSelect.disabled = false;
            
            // Dispara o pré-load da sessão Race automaticamente
            if (dados.sessoes.includes("Race")) {
                preloadSessao(ano, gp, "Race");
            }
        }
    } catch (erro) {
        sessaoSelect.innerHTML = '<option value="">Erro ao buscar</option>';
    }
});

sessaoSelect.addEventListener('change', () => {
    btnCarregar.disabled = !sessaoSelect.value;
});

btnCarregar.addEventListener('click', async () => {
    const ano = anoSelect.value;
    const gp = corridaSelect.value;
    const sessao = sessaoSelect.value;

    gpName.textContent = gp.toUpperCase();
    sessionNameSubtitle.textContent = `| ${sessao.toUpperCase()} RESULTS & TRACK LAYOUT`;
    
    // VERIFICAÇÃO DO CACHE LOCAL
    const cacheKey = `f1_${ano}_${gp}_${sessao}`;
    const cacheSalvo = localStorage.getItem(cacheKey);

    if (cacheSalvo) {
        // Se já tem no navegador, exibe na mesma hora
        renderizarTabela(JSON.parse(cacheSalvo));
        return;
    }

    // Se não tem no cache, pede pro Render
    corpoTabela.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#ffeb3b; padding:30px;">Processando telemetria...</td></tr>`;
    circuitoContainer.innerHTML = `<p class="loading">Gerando o traçado...</p>`;
    btnCarregar.disabled = true;
    btnCarregar.textContent = "Carregando...";

    try {
        const resposta = await fetch(`${API_BASE_URL}/api/resultado/${ano}/${gp}/${sessao}`);
        const dados = await resposta.json();

        if (dados.sucesso) {
            localStorage.setItem(cacheKey, JSON.stringify(dados)); // Salva para a próxima
            renderizarTabela(dados);
        } else {
            throw new Error(dados.erro);
        }
    } catch (erro) {
        corpoTabela.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #e10600;">Erro ao processar dados da corrida.</td></tr>`;
        circuitoContainer.innerHTML = `<p style="color: #e10600;">Não foi possível carregar o traçado.</p>`;
    } finally {
        btnCarregar.disabled = false;
        btnCarregar.textContent = "Carregar Dados";
    }
});
