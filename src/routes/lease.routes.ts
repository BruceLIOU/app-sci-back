import { Application } from 'express'
const controller = require('../controllers/lease.controller')

module.exports = (app: Application) => {
  app.get('/api/leases', controller.findAll)
  app.get('/api/leases/:id', controller.findOne)
  app.post('/api/leases', controller.create)
  app.put('/api/leases/:id', controller.update)
  app.delete('/api/leases/:id', controller.delete)
}
