import { Application } from 'express'
const controller = require('../controllers/quittance.controller')

module.exports = (app: Application) => {
  app.get('/api/quittances', controller.findAll)
  app.get('/api/quittances/:id', controller.findOne)
  app.post('/api/quittances', controller.create)
  app.put('/api/quittances/:id', controller.update)
  app.delete('/api/quittances/:id', controller.delete)
}
