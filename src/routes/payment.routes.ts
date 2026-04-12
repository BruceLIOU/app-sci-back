import { Application } from 'express'
import { validate } from '../validation/validate.middleware'
import { paymentCreateSchema, paymentUpdateSchema } from '../validation/schemas/payment.schema'
const controller = require('../controllers/payment.controller')

module.exports = (app: Application) => {
  app.get('/api/payments', controller.findAll)
  app.post('/api/payments/bulk-delete', controller.bulkDelete)
  app.get('/api/payments/:id', controller.findOne)
  app.post('/api/payments', validate(paymentCreateSchema), controller.create)
  app.put('/api/payments/:id', validate(paymentUpdateSchema), controller.update)
  app.delete('/api/payments/:id', controller.delete)
}
