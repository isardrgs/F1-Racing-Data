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
for (let ano = anoAtual; ano >= 2020; ano--) {
    const option = document.createElement('option');
    option.value = ano;
    option.textContent = ano;
    anoSelect.appendChild(option);
}

// DICIONÁRIO DE IMAGENS ESTÁTICAS (Convertido para PNG)
function obterImagemCircuito(gp) {
    const nome = gp.toLowerCase();
    if(nome.includes('bahrain')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Bahrain_International_Circuit--Grand_Prix_Layout.svg/1024px-Bahrain_International_Circuit--Grand_Prix_Layout.svg.png';
    if(nome.includes('saudi')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Jeddah_Street_Circuit_2021.svg/1024px-Jeddah_Street_Circuit_2021.svg.png';
    if(nome.includes('australian')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Melbourne_Grand_Prix_Circuit_2021.svg/1024px-Melbourne_Grand_Prix_Circuit_2021.svg.png';
    if(nome.includes('emilia')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Imola_2008.svg/1024px-Imola_2008.svg.png';
    if(nome.includes('miami')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Miami_International_Autodrome_layout.svg/1024px-Miami_International_Autodrome_layout.svg.png';
    if(nome.includes('monaco')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Monte_Carlo_Formula_1_track_map.svg/1024px-Monte_Carlo_Formula_1_track_map.svg.png';
    if(nome.includes('spanish')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Circuit_de_Catalunya_2021.svg/1024px-Circuit_de_Catalunya_2021.svg.png';
    if(nome.includes('canadian')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/Circuit_Gilles_Villeneuve_2002.svg/1024px-Circuit_Gilles_Villeneuve_2002.svg.png';
    if(nome.includes('austrian')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Red_Bull_Ring_2016.svg/1024px-Red_Bull_Ring_2016.svg.png';
    if(nome.includes('british')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/03/Silverstone_Circuit_2020.svg/1024px-Silverstone_Circuit_2020.svg.png';
    if(nome.includes('hungarian')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Hungaroring.svg/1024px-Hungaroring.svg.png';
    if(nome.includes('belgian')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Spa-Francorchamps_of_Belgium.svg/1024px-Spa-Francorchamps_of_Belgium.svg.png';
    if(nome.includes('dutch')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Zandvoort_Circuit_2020.svg/1024px-Zandvoort_Circuit_2020.svg.png';
    if(nome.includes('italian')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Monza_track_map.svg/1024px-Monza_track_map.svg.png';
    if(nome.includes('azerbaijan')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Baku_Formula_One_circuit_map.svg/1024px-Baku_Formula_One_circuit_map.svg.png';
    if(nome.includes('singapore')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/af/Singapore_Street_Circuit_2023.svg/1024px-Singapore_Street_Circuit_2023.svg.png';
    if(nome.includes('united states')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/12/Austin_circuit.svg/1024px-Austin_circuit.svg.png';
    if(nome.includes('mexican') || nome.includes('mexico')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Aut%C3%B3dromo_Hermanos_Rodr%C3%ADguez_2015.svg/1024px-Aut%C3%B3dromo_Hermanos_Rodr%C3%ADguez_2015.svg.png';
    if(nome.includes('são paulo') || nome.includes('brazilian')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Circuit_Interlagos.svg/1024px-Circuit_Interlagos.svg.png';
    if(nome.includes('las vegas')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Las_Vegas_Street_Circuit_2023.svg/1024px-Las_Vegas_Street_Circuit_2023.svg.png';
    if(nome.includes('qatar')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Losail_International_Circuit.svg/1024px-Losail_International_Circuit.svg.png';
    if(nome.includes('abu dhabi')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Yas_Marina_Circuit_2021.svg/1024px-Yas_Marina_Circuit_2021.svg.png';
    if(nome.includes('japanese')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Suzuka_circuit_map--2005.svg/1024px-Suzuka_circuit_map--2005.svg.png';
    if(nome.includes('chinese')) return 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Shanghai_International_Racing_Circuit_track_map.svg/1024px-Shanghai_International_Racing_Circuit_track_map.svg.png';
    
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

anoSelect.addEventListener('change', async () => {
    const ano = anoSelect.value;
    sessaoSelect.innerHTML = '<option value="">Aguardando GP...</option>';
    sessaoSelect.disabled = true;
    btnCarregar.disabled = true;
    if (!ano) return;

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

    // INSERÇÃO DO MAPA ESTÁTICO
    const urlImagem = obterImagemCircuito(gp);
    if (urlImagem !== '') {
        circuitoContainer.innerHTML = `<img src="${urlImagem}" alt="Traçado" class="circuit-img" style="filter: invert(1) brightness(0.8) drop-shadow(0 0 10px rgba(225, 6, 0, 0.3)); max-width: 100%; height: auto;">`;
    } else {
        circuitoContainer.innerHTML = `<p class="loading" style="font-size:0.8rem; color:#555;">Traçado indisponível.</p>`;
    }

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
    
    corpoTabela.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#ffeb3b; padding:30px;">Baixando resultados oficiais...</td></tr>`;
    btnCarregar.disabled = true;
    btnCarregar.textContent = "Carregando...";

    try {
        const resposta = await fetch(`${API_BASE_URL}/api/resultado/${ano}/${gp}/${sessao}`);
        const dados = await resposta.json();

        if (dados.sucesso) {
            if (dados.resultados && dados.resultados.length > 0) {
                renderizarTabela(dados);
            } else {
                corpoTabela.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted);">Sessão incompatível com o banco de dados esportivo no momento.</td></tr>`;
            }
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
