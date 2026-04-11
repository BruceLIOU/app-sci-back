import { Application } from 'express'
const controller = require('../controllers/inspection.controller')

module.exports = (app: Application) => {
  app.get('/api/inspections', controller.findAll)
  app.get('/api/inspections/:id', controller.findOne)
  app.post('/api/inspections', controller.create)
  app.put('/api/inspections/:id', controller.update)
  app.delete('/api/inspections/:id', controller.delete)
}
