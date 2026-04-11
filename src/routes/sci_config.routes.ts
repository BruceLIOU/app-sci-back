import { Application } from 'express'

const controller = require('../controllers/sci_config.controller')

module.exports = (app: Application) => {
  app.get('/api/sci-config', controller.get)
  app.put('/api/sci-config', controller.update)
}
