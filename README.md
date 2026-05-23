# 🏎️ F1 Racing Data Dashboard

Um painel interativo e responsivo que fornece dados em tempo real e históricos sobre as temporadas de Fórmula 1. Este projeto une o processamento de dados esportivos no Back-End com uma interface Front-End focada em identidade visual, usabilidade e alta performance.

## ✨ Destaques e Funcionalidades

* **Dados Dinâmicos:** Consulta de calendários, circuitos e resultados de sessões (Qualifying, Sprint e Race) a partir de 2020.
* **Resiliência e Fallback:** Sistema inteligente no Back-End que lida com bloqueios de firewall da API oficial da F1, redirecionando silenciosamente para bancos de dados de backup (Ergast) sem quebrar a experiência do usuário.
* **Identidade Visual Garantida:** Dicionário de cores embutido que preserva a identidade visual (hexadecimais oficiais) das escuderias mesmo quando a API falha.
* **Mapas Otimizados:** Renderização de traçados dos circuitos via imagens estáticas SVG/PNG otimizadas, poupando a memória do servidor e garantindo carregamento instantâneo.
* **Client-Side Caching:** Uso de `localStorage` no JavaScript para salvar dados das sessões consultadas, reduzindo requisições ao servidor e zerando o tempo de espera do usuário em acessos repetidos.
* **Design Responsivo Avançado:** Utilização de CSS Grid para transformar as tabelas clássicas em elegantes *Cards* em dispositivos móveis, sem alterar o layout focado em telas de computador.

## 🛠️ Tecnologias Utilizadas

**Front-End (Foco em UI/UX):**
* HTML5 & CSS3 (Flexbox & CSS Grid)
* JavaScript puro (Vanilla JS)
* Caching via `localStorage` e manipulação assíncrona (`fetch`, `async/await`)

**Back-End (Processamento de Dados):**
* Python 3
* FastAPI (Criação das rotas da API)
* FastF1 & Pandas (Extração e tratamento de dados telemétricos)
* *Deploy:* Hospedado no Render

## 🚀 Como a Arquitetura Funciona

Para contornar o alto consumo de RAM e os bloqueios de IP (*Akamai Firewall*) em servidores gratuitos na nuvem, o projeto foi arquitetado separando responsabilidades:
1. O **Front-End** é inteligente: ele injeta os mapas dos circuitos nativamente (sem depender do servidor) e faz requisições cirúrgicas para o back-end.
2. O **Back-End** baixa apenas as tabelas de voltas cruas (`laps=True, telemetry=False`), formata os tempos, corrige inconsistências do banco de dados e devolve um JSON enxuto para a interface.

## 📱 Acesso

O Front-End está hospedado no GitHub Pages e consome o Back-End hospedado no Render.
👉 **[Acessar o Projeto (Coloque o link do seu site aqui)](#)**
