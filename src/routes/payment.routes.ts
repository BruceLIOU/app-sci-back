import { Application } from 'express'
const controller = require('../controllers/payment.controller')

module.exports = (app: Application) => {
  app.get('/api/payments', controller.findAll)
  app.post('/api/payments/bulk-delete', controller.bulkDelete)
  app.get('/api/payments/:id', controller.findOne)
  app.post('/api/payments', controller.create)
  app.put('/api/payments/:id', controller.update)
  app.delete('/api/payments/:id', controller.delete)
}
