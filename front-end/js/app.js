// CONFIGURAÇÃO DE PRODUÇÃO: Quando hospedar no Render, mude o endereço abaixo
const API_BASE_URL = 'http://127.0.0.1:8000';

const anoSelect = document.getElementById('ano-select');
const corridaSelect = document.getElementById('corrida-select');
const sessaoSelect = document.getElementById('sessao-select');
const btnCarregar = document.getElementById('btn-carregar');
const corpoTabela = document.getElementById('tabela-corpo');
const circuitoContainer = document.getElementById('circuito-container');
const gpName = document.getElementById('gp-name');
const sessionNameSubtitle = document.getElementById('session-name');

// 1. Popula os Anos
const anoAtual = new Date().getFullYear();
for (let ano = anoAtual; ano >= 2018; ano--) {
    const option = document.createElement('option');
    option.value = ano;
    option.textContent = ano;
    anoSelect.appendChild(option);
}

// 2. Quando seleciona o ANO -> Busca os GPs
anoSelect.addEventListener('change', async () => {
    const ano = anoSelect.value;
    
    sessaoSelect.innerHTML = '<option value="">Aguardando GP...</option>';
    sessaoSelect.disabled = true;
    btnCarregar.disabled = true;
    
    if (!ano) {
        corridaSelect.innerHTML = '<option value="">Aguardando ano...</option>';
        corridaSelect.disabled = true;
        return;
    }

    corridaSelect.innerHTML = '<option value="">Buscando calendário...</option>';
    corridaSelect.disabled = true;

    try {
        const resposta = await fetch(`${API_BASE_URL}/api/corridas/${ano}`);
        const dados = await resposta.json();

        corridaSelect.innerHTML = '<option value="">Selecione o GP</option>';
        dados.corridas.forEach(corrida => {
            const option = document.createElement('option');
            option.value = corrida;
            option.textContent = corrida;
            corridaSelect.appendChild(option);
        });

        corridaSelect.disabled = false;
    } catch (erro) {
        console.error(erro);
        corridaSelect.innerHTML = '<option value="">Erro ao carregar</option>';
    }
});

// 3. Quando seleciona o GP -> Busca as Sessões (Treino 1, Qualy, Sprint, Race...)
corridaSelect.addEventListener('change', async () => {
    const ano = anoSelect.value;
    const gp = corridaSelect.value;

    btnCarregar.disabled = true;

    if (!gp) {
        sessaoSelect.innerHTML = '<option value="">Aguardando GP...</option>';
        sessaoSelect.disabled = true;
        return;
    }

    sessaoSelect.innerHTML = '<option value="">Buscando sessões...</option>';
    sessaoSelect.disabled = true;

    try {
        const resposta = await fetch(`${API_BASE_URL}/api/sessoes/${ano}/${gp}`);
        const dados = await resposta.json();

        if(dados.sucesso) {
            sessaoSelect.innerHTML = '<option value="">Selecione a Sessão</option>';
            dados.sessoes.forEach(sessao => {
                const option = document.createElement('option');
                option.value = sessao;
                option.textContent = sessao;
                sessaoSelect.appendChild(option);
            });
            sessaoSelect.disabled = false;
        }
    } catch (erro) {
        console.error(erro);
        sessaoSelect.innerHTML = '<option value="">Erro ao buscar sessões</option>';
    }
});

// 4. Quando seleciona a Sessão -> Libera o botão de carregar
sessaoSelect.addEventListener('change', () => {
    btnCarregar.disabled = !sessaoSelect.value;
});

// 5. Clica no Botão -> Processa a Telemetria
btnCarregar.addEventListener('click', async () => {
    const ano = anoSelect.value;
    const gp = corridaSelect.value;
    const sessao = sessaoSelect.value;

    gpName.textContent = gp.toUpperCase();
    sessionNameSubtitle.textContent = `| ${sessao.toUpperCase()} RESULTS & TRACK LAYOUT`;
    
    corpoTabela.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#ffeb3b; padding:30px;">Processando telemetria...<br><span style="font-size:0.8rem">(O carregamento pode demorar alguns segundos se a sessão ainda não estiver no cache)</span></td></tr>`;
    circuitoContainer.innerHTML = `<p class="loading">Gerando o traçado...</p>`;
    
    btnCarregar.disabled = true;
    btnCarregar.textContent = "Carregando...";

    try {
        // Envia a sessão específica na URL
        const resposta = await fetch(`${API_BASE_URL}/api/resultado/${ano}/${gp}/${sessao}`);
        const dados = await resposta.json();

        if (dados.sucesso) {
            corpoTabela.innerHTML = ''; 

            dados.resultados.forEach(linha => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="font-weight: bold; color: var(--text-muted);">${linha.pos}</td>
                    <td class="driver-name">${linha.driver}</td>
                    <td>${linha.team}</td>
                    <td>
                        <span class="compound-indicator" style="background-color: ${linha.color}; box-shadow: 0 0 6px ${linha.color};"></span>
                    </td>
                    <td style="font-family: monospace; font-size: 1.1rem; font-weight: bold;">${linha.time}</td>
                `;
                corpoTabela.appendChild(tr);
            });

            if(dados.circuito_base64) {
                circuitoContainer.innerHTML = `<img src="${dados.circuito_base64}" alt="Traçado do Circuito" class="circuit-img">`;
            } else {
                circuitoContainer.innerHTML = `<p class="loading">Traçado indisponível para esta sessão.</p>`;
            }
        } else {
            throw new Error(dados.erro);
        }
    } catch (erro) {
        console.error("Erro ao buscar resultados:", erro);
        corpoTabela.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #e10600;">Erro ao processar dados da corrida.</td></tr>`;
        circuitoContainer.innerHTML = `<p style="color: #e10600;">Não foi possível carregar o traçado.</p>`;
    } finally {
        btnCarregar.disabled = false;
        btnCarregar.textContent = "Carregar Dados";
    }
});