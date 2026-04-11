import { Application } from 'express'
const controller = require('../controllers/property.controller')

module.exports = (app: Application) => {
  app.get('/api/properties', controller.findAll)
  app.get('/api/properties/:id', controller.findOne)
  app.post('/api/properties', controller.create)
  app.put('/api/properties/:id', controller.update)
  app.delete('/api/properties/:id', controller.delete)
}
