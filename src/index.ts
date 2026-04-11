import express, { Application, Request, Response } from 'express'
import formidable from 'express-formidable'
import cors from 'cors'

require('dotenv').config()

const app: Application = express()
const corsOptions = {
  origin: 'http://localhost:3001',
}

app.use(formidable({ multiples: true }))
app.use(cors(corsOptions))

const db = require('./models')
db.sequelize
  .sync({ alter: true })
  .then(() => {
    console.log('🟢 Connexion à la base de données réussie !')
  })
  .catch((error: Error) => {
    console.log('🔴 Connexion à la base de données échouée !', error.message)
  })

require('./routes/property.routes')(app)
require('./routes/tenant.routes')(app)
require('./routes/payment.routes')(app)
require('./routes/lease.routes')(app)
require('./routes/charge.routes')(app)
require('./routes/quittance.routes')(app)
require('./routes/inspection.routes')(app)
require('./routes/associate.routes')(app)
require('./routes/document.routes')(app)


app.get('/', (req: Request, res: Response) => {
  res.status(200).json('🟢  Welcome to SCI WEB APP')
})

app.all('*splat', (req: Request, res: Response) => {
  res.status(404).json({ message: '🚫 Page not found !' })
})

app.listen(process.env.PORT || 3000, () => {
  console.log(`🟢 Server started on port ${process.env.PORT}`)
})
