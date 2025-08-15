import path, { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import axios from 'axios'
import express from 'express'

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

class App {
  constructor() {
    this.__port = process.env.PORT || 3000
    this.__express = express()
    this.__coins = []
    this.__middleware()
    this.__routes()
  }

  get __availableSymbols() {
    return this.__coins.map((coin) => coin.symbol)
  }

  async __loadData() {
    const url = 'https://api2.binance.com/api/v3/ticker/24hr'
    const baseCoin = 'BUSD'
    console.log(`Carregando dados da API da Binance em: ${url}`)
    try {
      const response = await axios.get(url)
      console.debug(
        `Recebido dados da API da Binance. Status ${response.status}, ${response.statusText}. Comprimento dos dados: ${JSON.stringify(response.data).length}`
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
        .concat([{ symbol: baseCoin, price: 1, baseCoin: true }])
        .sort((a, b) => a.symbol.localeCompare(b.symbol))

      console.debug(
        `A lista de moedas foi atualizada com ${this.__coins.length} itens: ${this.__coins.map((coin) => coin.symbol).join(', ')}`
      )
    } catch (error) {
      console.error(
        `Ocorreu um erro ao consumir a API da Binance. ${error?.message ?? error}`
      )
    }
  }

  __middleware() {
    const root = path.join(__dirname, 'root')

    console.log(`O serviço HTTP está usando o diretório "${root}" como raiz.`)

    this.__express.use(express.static(root))

    this.__express.use((req, res, next) => {
      res.on('finish', () => {
        if (res.statusCode >= 400) {
          console.warn(
            `Resposta HTTP ${res.statusCode} para ${req.method} ${req.url}`
          )
        } else {
          console.debug(
            `Resposta HTTP ${res.statusCode} para ${req.method} ${req.url}`
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
          console.log('Página inicial carregada pelo usuário.')

          break

        case 'ping':
          console.log('O usuário pingou o servidor.')

          break

        default:
          console.warn(
            `Recebido um evento de log desconhecido: ${req.params.key}`
          )

          break
      }

      res.status(200).send()
    })

    this.__express.get('/api/coins', async (req, res) => {
      res.json(this.__availableSymbols)
    })

    this.__express.get('/api/convert/:from/:amount?/:to?', async (req, res) => {
      const from = String(req.params.from).toUpperCase().trim()

      const to = String(
        req.params.to ?? this.__coins.find((coin) => coin.baseCoin).symbol
      )
        .toUpperCase()
        .trim()

      const amount = Number(req.params.amount ?? 1)

      if (this.__availableSymbols.length === 0) {
        console.warn(
          'Conversão não pode ser realizada pois a lista de moedas está vazia.'
        )

        res.status(500).json({ error: 'No coins available' })
      } else if (Number.isNaN(amount)) {
        console.warn(
          `Conversão não pode ser realizada pois o valor da moeda é inválido: ${req.params.amount}`
        )

        res.status(400).json({ error: 'Amount must be a number' })
      } else if (
        this.__availableSymbols.includes(from) &&
        this.__availableSymbols.includes(to)
      ) {
        const fromPrice = this.__coins.find(
          (coin) => coin.symbol === from
        ).price

        const toPrice = this.__coins.find((coin) => coin.symbol === to).price

        res.json({ result: ((amount * fromPrice) / toPrice).toFixed(8) })

        const result = ((amount * fromPrice) / toPrice).toFixed(8)

        console.log(`Convertendo ${amount} ${from} para ${to} = ${result}`)

        res.json({ result })
      } else {
        console.warn(
          `Conversão não pode ser realizada pois a moeda ${from} ou ${to} não está disponível.`
        )

        res.status(400).json({
          error: `Symbol must be one of: ${this.__availableSymbols.join(', ')}`,
        })
      }
    })
  }

  start() {
    this.__express.listen(this.__port, () => {
      console.log(`Server listening on port ${this.__port}`)

      console.log(`O serviço HTTP foi ligado na porta ${this.__port}.`)
    })
  }
}

try {
  console.info('Aplicação Iniciada')
  new App().start()
} catch (error) {
  console.error(
    `Ocorreu um erro não tratado durante a execução da aplicação. A aplicação será finalizada. ${error?.message ?? error}`
  )
}
