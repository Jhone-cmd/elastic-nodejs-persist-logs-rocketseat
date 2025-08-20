# 🚀 Conversor de Criptomoedas

Este projeto é uma aplicação de conversão de criptomoedas, desenvolvida como parte do conteúdo da plataforma [Rocketseat](https://www.rocketseat.com.br/). Ele integra uma interface web simples com um backend Node.js que consome a API da Binance para fornecer taxas de câmbio em tempo real. Além disso, utiliza Docker Compose para orquestrar serviços de Elasticsearch e Kibana para registro e visualização de logs.

---

## 💻 Tecnologias Utilizadas

- **Node.js:** Ambiente de execução JavaScript para o backend.
- **Express.js:** Framework web para o servidor Node.js.
- **Axios:** Cliente HTTP para consumir a API da Binance.
- **@elastic/elasticsearch:** Cliente oficial do Elasticsearch para Node.js.
- **Docker e Docker Compose:** Conteinerização e orquestração dos serviços.
- **Elasticsearch:** Banco de dados NoSQL para armazenar logs da aplicação.
- **Kibana:** Visualização e exploração de dados do Elasticsearch.
- **HTML, CSS e JavaScript:** Interface de usuário, com Bootstrap para estilização.

---

## ⚙️ Estrutura do Projeto

```
.vscode/
node_modules/
root/
├── .gitignore
├── biome.jsonc
├── docker-compose.yml
├── index.js
├── package.json
└── root/
    └── index.html
```

- [`index.js`](index.js): Servidor Node.js, lógica de backend, rotas e integração com o Elasticsearch.
- [`biome.jsonc`](biome.jsonc): Configuração do linter e formatador Biome.
- [`docker-compose.yml`](docker-compose.yml): Orquestração dos contêineres Elasticsearch e Kibana.
- [`package.json`](package.json): Gerenciamento de dependências Node.js.
- [`root/index.html`](root/index.html): Interface web da aplicação.

---

## 🚀 Como Executar

**Pré-requisitos:**  
Tenha [Docker](https://www.docker.com/) e [Docker Compose](https://docs.docker.com/compose/) instalados.

1. **Clone o repositório:**
    ```sh
    git clone https://github.com/Jhone-cmd/elastic-nodejs-persist-logs-rocketseat
    cd elastic-nodejs-persist-logs-rocketseat
    ```

2. **Inicie os serviços com Docker Compose:**
    ```sh
    docker-compose up -d
    ```
    Isso irá baixar as imagens do Elasticsearch e Kibana e iniciar os contêineres em segundo plano.

3. **Instale as dependências do Node.js:**
    ```sh
    npm install
    ```

4. **Inicie a aplicação Node.js:**
    ```sh
    npm start
    ```
    ou
    ```sh
    node index.js
    ```

5. **Acesse a aplicação:**
    - Interface web: [http://localhost:3333](http://localhost:3333)
    - Kibana: [http://localhost:5601](http://localhost:5601)

---

## 📈 Funcionalidades

- **Conversão de Criptomoedas:**  
  Interface para selecionar moedas de origem/destino e converter valores em tempo real.

- **Busca de Dados em API Externa:**  
  O backend consome a API da Binance para obter as cotações mais recentes.

- **Gerenciamento de Logs:**  
  - Todos os logs da aplicação são redirecionados para o Elasticsearch.
  - Logs de diferentes níveis (`log`, `info`, `warn`, `error`, `debug`) são capturados.
  - O Kibana permite visualizar e analisar esses logs em um painel interativo.

- **Contêineres Isolados:**  
  O Docker Compose garante que os serviços (Node.js, Elasticsearch, Kibana) rodem em ambientes isolados e facilmente reproduzíveis.

---

Este projeto é um excelente exemplo de integração entre backend Node.js, monitoramento e análise de dados, utilizando contêineres para simplificar o ambiente de desenvolvimento e produção.

> **Desenvolvido com base no conteúdo da [Rocketseat](https://www.rocketseat.com.br/).**