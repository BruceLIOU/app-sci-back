import { Application } from 'express'
import { validate } from '../validation/validate.middleware'
import { tenantCreateSchema, tenantUpdateSchema } from '../validation/schemas/tenant.schema'
const controller = require('../controllers/tenant.controller')

module.exports = (app: Application) => {
  app.get('/api/tenants', controller.findAll)
  app.get('/api/tenants/:id', controller.findOne)
  app.post('/api/tenants', validate(tenantCreateSchema), controller.create)
  app.patch('/api/tenants/:id/toggle-active', controller.toggleActive)
  app.put('/api/tenants/:id', validate(tenantUpdateSchema), controller.update)
  app.delete('/api/tenants/:id', controller.delete)
}
