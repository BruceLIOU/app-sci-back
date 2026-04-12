import { Application } from 'express'
import { validate } from '../validation/validate.middleware'
import { leaseCreateSchema, leaseUpdateSchema } from '../validation/schemas/lease.schema'
const controller = require('../controllers/lease.controller')

module.exports = (app: Application) => {
  app.get('/api/leases', controller.findAll)
  app.get('/api/leases/:id', controller.findOne)
  app.post('/api/leases', validate(leaseCreateSchema), controller.create)
  app.put('/api/leases/:id', validate(leaseUpdateSchema), controller.update)
  app.delete('/api/leases/:id', controller.delete)
}
