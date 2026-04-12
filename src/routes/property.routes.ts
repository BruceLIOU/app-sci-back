import { Application } from 'express'
import { validate } from '../validation/validate.middleware'
import { propertyCreateSchema, propertyUpdateSchema } from '../validation/schemas/property.schema'
const controller = require('../controllers/property.controller')

module.exports = (app: Application) => {
  app.get('/api/properties', controller.findAll)
  app.get('/api/properties/:id', controller.findOne)
  app.post('/api/properties', validate(propertyCreateSchema), controller.create)
  app.put('/api/properties/:id', validate(propertyUpdateSchema), controller.update)
  app.delete('/api/properties/:id', controller.delete)
}
