import { Application } from 'express'
const controller = require('../controllers/charge.controller')

module.exports = (app: Application) => {
  app.get('/api/charges', controller.findAll)
  app.post('/api/charges/sync-matera', controller.syncMatera)
  app.get('/api/charges/debug-matera', controller.debugMatera)
  app.post('/api/charges/bulk-delete', controller.bulkDelete)
  app.get('/api/charges/:id', controller.findOne)
  app.post('/api/charges', controller.create)
  app.put('/api/charges/:id', controller.update)
  app.delete('/api/charges/:id', controller.delete)
}
