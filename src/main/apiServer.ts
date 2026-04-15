import express, { Request, Response, NextFunction, Express } from 'express'
import type { Server } from 'http'

type HandlerFn = (...args: any[]) => any | Promise<any>
type HandlerMap = Record<string, HandlerFn>

class APIServer {
  private server: Server | null = null
  private registeredFns: HandlerMap = {}
  private apiKey: string | null = null
  private appServer: Express | null = null

  registerAPI(functions: HandlerMap): void {
    this.registeredFns = functions
  }

  private apiKeyMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    if (req.path.startsWith('/api')) {
      if (!this.apiKey) {
        return res.status(403).json({ error: 'API key not set.' })
      }
      const provided = req.header('x-api-key')
      if (provided !== this.apiKey) {
        return res.status(401).json({ error: 'Invalid API key.' })
      }
    }
    next()
  }

  async start(apiPort: number, apiKey: string): Promise<void> {
    if (this.server) return

    this.apiKey = apiKey
    this.appServer = express()

    this.appServer.use(express.json())
    this.appServer.use(this.apiKeyMiddleware)

    this.appServer.get('/', (_, res) => {
      res.json({ info: '[API Server] Running' })
    })

    this.appServer.get('/api', (_req, res) => {
      res.json({ available: Object.keys(this.registeredFns) })
    })

    this.appServer.post('/api/:action', async (req, res) => {
      const { action } = req.params
      const args = Array.isArray(req.body.args) ? req.body.args : []
      const fn = this.registeredFns[action]
      if (typeof fn !== 'function') {
        return res.status(404).json({ error: `Unknown API action: ${action}` })
      }
      try {
        const response = await Promise.resolve(fn(...args))
        res.json({ response })
      } catch (e) {
        res.status(500).json({ error: e instanceof Error ? e.message : String(e) })
      }
    })

    this.server = this.appServer.listen(apiPort)
    await new Promise<void>((resolve, reject) => {
      this.server!.once('listening', () => {
        console.log(`[APIServer] Started (:${apiPort})`)
        resolve()
      })
      this.server!.once('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          reject(new Error(`[APIServer] Port ${apiPort} is already in use.`))
        } else {
          reject(err)
        }
      })
    })
  }

  stop(): void {
    if (this.server) {
      this.server.close(() => {
        console.log('[APIServer] Stopped')
      })
      this.server = null
    }
  }
}

// Export an instance
export const apiServer = new APIServer()
