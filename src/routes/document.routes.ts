import { Application } from 'express'
const controller = require('../controllers/document.controller')

module.exports = (app: Application) => {
  app.get('/api/documents', controller.findAll)
  app.get('/api/documents/:id', controller.findOne)
  app.post('/api/documents', controller.create)
  app.delete('/api/documents/:id', controller.delete)
}
