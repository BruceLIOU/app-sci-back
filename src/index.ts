import express, { Application, Request, Response } from 'express'
import http from 'http'
import formidable from 'express-formidable'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { requireAuth } from './middleware/auth.middleware'
import { startCron } from './services/cron-manager.service'
import { initWss } from './services/ws.service'

require('dotenv').config()

const app: Application = express()
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3001',
  credentials: true,
}

app.use(formidable({ multiples: true }))
app.use(cors(corsOptions))
app.use(cookieParser())

const db = require('./models')
db.sequelize
  .sync({ alter: true })
  .then(async () => {
    console.log('🟢 Connexion à la base de données réussie !')
    // Lire le cron depuis la DB (fallback sur les variables d'env)
    let schedule = process.env.CHARGE_CRON_SCHEDULE || '0 8 * * *'
    let enabled = true
    try {
      const config = await db.SciConfig.findOne()
      if (config?.charge_cron_schedule) schedule = config.charge_cron_schedule
      if (config && config.charge_cron_enabled === false) enabled = false
    } catch (_) {}
    startCron(schedule, enabled)
  })
  .catch((error: Error) => {
    console.log('🔴 Connexion à la base de données échouée !', error.message)
  })

// Routes publiques (auth en premier, avant le middleware)
require('./routes/auth.routes')(app)

// Middleware d'authentification pour toutes les routes suivantes
app.use(requireAuth)

require('./routes/property.routes')(app)
require('./routes/tenant.routes')(app)
require('./routes/payment.routes')(app)
require('./routes/lease.routes')(app)
require('./routes/charge.routes')(app)
require('./routes/quittance.routes')(app)
require('./routes/inspection.routes')(app)
require('./routes/associate.routes')(app)
require('./routes/document.routes')(app)
require('./routes/pdf.routes')(app)
require('./routes/sci_config.routes')(app)
require('./routes/visit.routes')(app)
require('./routes/user.routes')(app)
require('./routes/notification.routes')(app)


app.get('/', (req: Request, res: Response) => {
  res.status(200).json('🟢  Welcome to SCI WEB APP')
})

app.all('*splat', (req: Request, res: Response) => {
  res.status(404).json({ message: '🚫 Page not found !' })
})

const server = http.createServer(app)
initWss(server)
server.listen(process.env.PORT || 3000, () => {
  console.log(`🟢 Server started on port ${process.env.PORT || 3000}`)
})
