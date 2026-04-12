import express, { Application, Request, Response } from 'express'
import formidable from 'express-formidable'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import cron from 'node-cron'
import { requireAuth } from './middleware/auth.middleware'
import { runMateraChargeSync } from './services/charge-automation.service'

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
  .then(() => {
    console.log('🟢 Connexion à la base de données réussie !')
    const schedule = process.env.CHARGE_CRON_SCHEDULE || '0 8 * * *'
    cron.schedule(schedule, () => {
      console.log('[MATERA SYNC] Déclenchement cron...')
      runMateraChargeSync().catch((err: Error) =>
        console.error('[MATERA SYNC] Erreur inattendue :', err.message)
      )
    })
    console.log(`🕐 Cron MATERA démarré (schedule: "${schedule}")`)
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


app.get('/', (req: Request, res: Response) => {
  res.status(200).json('🟢  Welcome to SCI WEB APP')
})

app.all('*splat', (req: Request, res: Response) => {
  res.status(404).json({ message: '🚫 Page not found !' })
})

app.listen(process.env.PORT || 3000, () => {
  console.log(`🟢 Server started on port ${process.env.PORT}`)
})
