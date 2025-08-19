import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Client } from '@elastic/elasticsearch'
import axios from 'axios'
import express from 'express'

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

class ElasticSearchLogger {
  constructor() {
    this.__logs = []
    this.__databaseClient = this._configureDatabaseClient()

    const log = {
      message: 'primeiro dado de teste',
      level: 'log',
      data: 'agora',
      timestamp: new Date(),
    }
    this.__logs.push(log)
    this.__saveToDatabase(log)
  }

  _configureDatabaseClient() {
    return Client({
      node: 'http://localhost:9200',
    })
  }

  async _saveToDatabase(log) {
    await this.__databaseClient.index({
      index: 'logs',
      body: {
        message: log.message,
        level: log.level,
        data: log.data,
        timestamp: log.timestamp,
      },
    })
  }
}

class App {
  constructor() {
    this.__port = process.env.PORT || 3333
    this.__express = express()
    this.__coins = []
    this.__middleware()
    this.__routes()
    this.__loadData()
  }

  get __availableSymbols() {
    return this.__coins.map((coin) => coin.symbol)
  }

  async __loadData() {
    const url = 'https://api4.binance.com/api/v3/ticker/24hr'
    const baseCoin = 'USDT'
    console.log(`Carregando dados da API da Binance em: ${url}`, { url })
    try {
      const response = await axios.get(url)
      console.debug(
        `Recebido dados da API da Binance. Status ${response.status}, ${response.statusText}. Comprimento dos dados: ${JSON.stringify(response.data).length}`,
        {
          statusCode: response.status,
          statusText: response.statusText,
          data: JSON.stringify(response.data),
        }
      )
      this.__coins = response.data
        .filter(
          (coin) =>
            coin.lastPrice > 0 &&
            (coin.symbol.startsWith(baseCoin) || coin.symbol.endsWith(baseCoin))
        )
        .map((coin) => ({
          symbol: coin.symbol.replace(baseCoin, '').trim().toUpperCase(),
          price: coin.symbol.startsWith(baseCoin)
            ? 1 / coin.lastPrice
            : Number(coin.lastPrice),
        }))
        .concat([
          {
            symbol: baseCoin,
            price: 1,
            baseCoin: true,
          },
        ])
        .sort((a, b) => a.symbol.localeCompare(b.symbol))
      console.debug(
        `A lista de moedas foi atualizada com ${this.__coins.length} itens: ${this.__coins.map((coin) => coin.symbol).join(', ')}`,
        {
          coins: this.__coins,
          coinsLength: this.__coins.length,
          baseCoin,
        }
      )
    } catch (error) {
      console.error(
        `Ocorreu um erro ao consumir a API da Binance. ${error?.message ?? error}`,
        { error }
      )
    }
  }

  __middleware() {
    this.__express.use(express.json())

    const root = path.join(__dirname, 'root')
    console.log(`O serviço HTTP está usando o diretório "${root}" como raiz.`, {
      root,
    })
    this.__express.use(express.static(root))

    this.__express.use((req, res, next) => {
      res.on('finish', () => {
        if (res.statusCode >= 400) {
          console.warn(
            `Resposta HTTP ${res.statusCode} para ${req.method} ${req.url}`,
            {
              statusCode: res.statusCode,
              method: req.method,
              url: req.url,
            }
          )
        } else {
          console.debug(
            `Resposta HTTP ${res.statusCode} para ${req.method} ${req.url}`,
            {
              statusCode: res.statusCode,
              method: req.method,
              url: req.url,
            }
          )
        }
      })
      next()
    })
  }

  __routes() {
    this.__express.post('/api/log/:key', async (req, res) => {
      switch (req.params.key) {
        case 'frontpage':
          console.log('Página inicial carregada pelo usuário.', {
            action: 'log',
            key: req.params.key,
          })
          break
        case 'ping':
          console.log('O usuário pingou o servidor.', {
            action: 'log',
            key: req.params.key,
          })
          break
        default:
          console.warn(
            `Recebido um evento de log desconhecido: ${req.params.key}`,
            {
              action: 'log',
              key: req.params.key,
            }
          )
          break
      }
      res.status(200).send()
    })

    this.__express.get('/api/coins', async (req, res) => {
      res.json(this.__availableSymbols)
    })

    this.__express.get('/api/convert/:from/:ammount/:to', async (req, res) => {
      const from = String(req.params.from).toUpperCase().trim()
      const to = String(
        req.params.to ?? this.__coins.find((coin) => coin.baseCoin).symbol
      )
        .toUpperCase()
        .trim()
      const ammount = Number(req.params.ammount ?? 1)

      if (this.__availableSymbols.length === 0) {
        console.warn(
          'Conversão não pode ser realizada pois a lista de moedas está vazia.'
        )
        res.status(500).json({ error: 'No coins available' })
      } else if (Number.isNaN(ammount)) {
        console.warn(
          `Conversão não pode ser realizada pois o valor da moeda é inválido: ${req.params.ammount}`,
          {
            ammount: req.params.ammount,
          }
        )
        res.status(400).json({ error: 'Ammount must be a number' })
      } else if (
        this.__availableSymbols.includes(from) ||
        this.__availableSymbols.includes(to)
      ) {
        const fromPrice = this.__coins.find(
          (coin) => coin.symbol === from
        ).price
        const toPrice = this.__coins.find((coin) => coin.symbol === to).price
        const result = ((ammount * fromPrice) / toPrice).toFixed(8)
        console.log(`Convertendo ${ammount} ${from} para ${to} = ${result}`, {
          ammount,
          from,
          to,
          result,
          action: 'convert',
        })
        res.json({ result })
      } else {
        console.warn(
          `Conversão não pode ser realizada pois a moeda ${from} ou ${to} não está disponível.`,
          {
            from,
            to,
          }
        )
        res.status(400).json({
          error: `Symbol must be one of: ${this.__availableSymbols.join(', ')}`,
        })
      }
    })
  }

  start() {
    this.__express.listen(this.__port, () => {
      console.log(`O serviço HTTP foi ligado na porta ${this.__port}.`, {
        port: this.__port,
      })
    })
  }
}

try {
  new ElasticSearchLogger()
} catch (error) {
  console.error(
    `Ocorreu um erro ao configurar o ElasticsearchLogger. ${error?.message ?? error}`
  )
}

try {
  console.info('Aplicação iniciada.')
  new App().start()
} catch (error) {
  console.error(
    `Ocorreu um erro não tratado durante a execução da aplicação. A aplicação será finalizada. ${error?.message ?? error}`,
    { error }
  )
}
