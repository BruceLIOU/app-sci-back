module.exports = (app: any) => {
  const visit = require('../controllers/visit.controller')

  // Google Calendar OAuth (avant les routes :id)
  app.get('/api/visits/google/status', visit.googleStatus)
  app.get('/api/visits/google/url', visit.googleAuthUrl)
  app.get('/api/visits/google/callback', visit.googleCallback)
  app.delete('/api/visits/google/disconnect', visit.googleDisconnect)

  // CRUD
  app.get('/api/visits', visit.findAll)
  app.get('/api/visits/:id', visit.findOne)
  app.post('/api/visits', visit.create)
  app.put('/api/visits/:id', visit.update)
  app.delete('/api/visits/:id', visit.delete)
}
