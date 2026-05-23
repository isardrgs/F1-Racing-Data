const API_BASE_URL = 'https://f1-racing-data.onrender.com';

const anoSelect = document.getElementById('ano-select');
const corridaSelect = document.getElementById('corrida-select');
const sessaoSelect = document.getElementById('sessao-select');
const btnCarregar = document.getElementById('btn-carregar');
const corpoTabela = document.getElementById('tabela-corpo');
const circuitoContainer = document.getElementById('circuito-container');
const gpName = document.getElementById('gp-name');
const sessionNameSubtitle = document.getElementById('session-name');

// 1. LIMITAÇÃO DE ANO (De 2020 até o ano atual)
const anoAtual = new Date().getFullYear();
for (let ano = anoAtual; ano >= 2020; ano--) {
    const option = document.createElement('option');
    option.value = ano;
    option.textContent = ano;
    anoSelect.appendChild(option);
}

// 2. DICIONÁRIO DE IMAGENS ESTÁTICAS (Processamento ZERO)
function obterImagemCircuito(gp) {
    const nome = gp.toLowerCase();
    if(nome.includes('bahrain')) return 'https://upload.wikimedia.org/wikipedia/commons/2/29/Bahrain_International_Circuit--Grand_Prix_Layout.svg';
    if(nome.includes('saudi')) return 'https://upload.wikimedia.org/wikipedia/commons/2/20/Jeddah_Street_Circuit_2021.svg';
    if(nome.includes('australian')) return 'https://upload.wikimedia.org/wikipedia/commons/5/5a/Melbourne_Grand_Prix_Circuit_2021.svg';
    if(nome.includes('emilia')) return 'https://upload.wikimedia.org/wikipedia/commons/1/13/Imola_2008.svg';
    if(nome.includes('miami')) return 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Miami_International_Autodrome_layout.svg';
    if(nome.includes('monaco')) return 'https://upload.wikimedia.org/wikipedia/commons/3/36/Monte_Carlo_Formula_1_track_map.svg';
    if(nome.includes('spanish')) return 'https://upload.wikimedia.org/wikipedia/commons/0/07/Circuit_de_Catalunya_2021.svg';
    if(nome.includes('canadian')) return 'https://upload.wikimedia.org/wikipedia/commons/2/21/Circuit_Gilles_Villeneuve_2002.svg';
    if(nome.includes('austrian')) return 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Red_Bull_Ring_2016.svg';
    if(nome.includes('british')) return 'https://upload.wikimedia.org/wikipedia/commons/0/03/Silverstone_Circuit_2020.svg';
    if(nome.includes('hungarian')) return 'https://upload.wikimedia.org/wikipedia/commons/9/91/Hungaroring.svg';
    if(nome.includes('belgian')) return 'https://upload.wikimedia.org/wikipedia/commons/5/54/Spa-Francorchamps_of_Belgium.svg';
    if(nome.includes('dutch')) return 'https://upload.wikimedia.org/wikipedia/commons/e/e3/Zandvoort_Circuit_2020.svg';
    if(nome.includes('italian')) return 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Monza_track_map.svg';
    if(nome.includes('azerbaijan')) return 'https://upload.wikimedia.org/wikipedia/commons/8/87/Baku_Formula_One_circuit_map.svg';
    if(nome.includes('singapore')) return 'https://upload.wikimedia.org/wikipedia/commons/a/af/Singapore_Street_Circuit_2023.svg';
    if(nome.includes('united states')) return 'https://upload.wikimedia.org/wikipedia/commons/1/12/Austin_circuit.svg';
    if(nome.includes('mexican') || nome.includes('mexico')) return 'https://upload.wikimedia.org/wikipedia/commons/8/86/Aut%C3%B3dromo_Hermanos_Rodr%C3%ADguez_2015.svg';
    if(nome.includes('são paulo') || nome.includes('brazilian')) return 'https://upload.wikimedia.org/wikipedia/commons/5/5c/Circuit_Interlagos.svg';
    if(nome.includes('las vegas')) return 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Las_Vegas_Street_Circuit_2023.svg';
    if(nome.includes('qatar')) return 'https://upload.wikimedia.org/wikipedia/commons/3/36/Losail_International_Circuit.svg';
    if(nome.includes('abu dhabi')) return 'https://upload.wikimedia.org/wikipedia/commons/d/d4/Yas_Marina_Circuit_2021.svg';
    if(nome.includes('japanese')) return 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Suzuka_circuit_map--2005.svg';
    if(nome.includes('chinese')) return 'https://upload.wikimedia.org/wikipedia/commons/9/95/Shanghai_International_Racing_Circuit_track_map.svg';
    
    // Fallback: Se não achar, coloca uma arte abstrata de Fórmula 1 ou texto vazio
    return ''; 
}

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
}

async function preloadSessao(ano, gp, sessao) {
    const cacheKey = `f1_${ano}_${gp}_${sessao}`;
    if (!localStorage.getItem(cacheKey)) {
        try {
            const resposta = await fetch(`${API_BASE_URL}/api/resultado/${ano}/${gp}/${sessao}`);
            const dados = await resposta.json();
            if (dados.sucesso) localStorage.setItem(cacheKey, JSON.stringify(dados));
        } catch (e) {}
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

    // INSERÇÃO IMEDIATA DO MAPA ESTÁTICO (Rápido e limpo)
    const urlImagem = obterImagemCircuito(gp);
    if (urlImagem !== '') {
        // Usa um filtro para deixar as imagens SVG com aspecto branco/cinza claro, combinando com seu layout escuro
        circuitoContainer.innerHTML = `<img src="${urlImagem}" alt="Traçado" class="circuit-img" style="filter: invert(1) brightness(0.8) drop-shadow(0 0 10px rgba(225, 6, 0, 0.3));">`;
    } else {
        circuitoContainer.innerHTML = `<p class="loading" style="font-size:0.8rem; color:#555;">Traçado indisponível.</p>`;
    }

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
            
            if (dados.sessoes.includes("Race")) preloadSessao(ano, gp, "Race");
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
    sessionNameSubtitle.textContent = `| ${sessao.toUpperCase()} RESULTS`;
    
    const cacheKey = `f1_${ano}_${gp}_${sessao}`;
    const cacheSalvo = localStorage.getItem(cacheKey);

    if (cacheSalvo) {
        renderizarTabela(JSON.parse(cacheSalvo));
        return;
    }

    corpoTabela.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#ffeb3b; padding:30px;">Baixando resultados oficiais...</td></tr>`;
    btnCarregar.disabled = true;
    btnCarregar.textContent = "Carregando...";

    try {
        const resposta = await fetch(`${API_BASE_URL}/api/resultado/${ano}/${gp}/${sessao}`);
        const dados = await resposta.json();

        if (dados.sucesso) {
            localStorage.setItem(cacheKey, JSON.stringify(dados));
            renderizarTabela(dados);
        } else {
            throw new Error(dados.erro);
        }
    } catch (erro) {
        corpoTabela.innerHTML = `<tr><td colspan="5" style="text-align: center; color: #e10600;">Ocorreu um erro na conexão com o banco de dados esportivo.</td></tr>`;
    } finally {
        btnCarregar.disabled = false;
        btnCarregar.textContent = "Carregar Dados";
    }
});
