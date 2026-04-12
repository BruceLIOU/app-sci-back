import { Application } from 'express'

const controller = require('../controllers/owner_config.controller')

module.exports = (app: Application) => {
  app.get('/api/owner-config', controller.get)
  app.get('/api/owner-config/siret/:siret', controller.lookupSiret)
  app.post('/api/owner-config/test-email', controller.testEmail)
  app.put('/api/owner-config', controller.update)
  // Alias legacy conservé pour compatibilité des clients existants.
  app.get('/api/sci-config', controller.get)
  app.put('/api/sci-config', controller.update)
}
