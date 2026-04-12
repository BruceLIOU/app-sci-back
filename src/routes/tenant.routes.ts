import { Application } from 'express'
const controller = require('../controllers/tenant.controller')

module.exports = (app: Application) => {
  app.get('/api/tenants', controller.findAll)
  app.get('/api/tenants/:id', controller.findOne)
  app.post('/api/tenants', controller.create)
  app.patch('/api/tenants/:id/toggle-active', controller.toggleActive)
  app.put('/api/tenants/:id', controller.update)
  app.delete('/api/tenants/:id', controller.delete)
}
