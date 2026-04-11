import { Application } from 'express'
const controller = require('../controllers/associate.controller')

module.exports = (app: Application) => {
  app.get('/api/associates', controller.findAll)
  app.get('/api/associates/:id', controller.findOne)
  app.post('/api/associates', controller.create)
  app.put('/api/associates/:id', controller.update)
  app.delete('/api/associates/:id', controller.delete)
}
