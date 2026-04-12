import { requireAuth } from '../middleware/auth.middleware'

module.exports = (app: any) => {
  const auth = require('../controllers/auth.controller')

  // Routes publiques (sans auth)
  app.post('/api/auth/request-login', auth.requestLogin)
  app.get('/api/auth/verify-login', auth.verifyLogin)
  app.get('/api/auth/activate', auth.activateAccount)
  app.post('/api/auth/logout', auth.logout)

  // Routes protégées
  app.get('/api/auth/me', requireAuth, auth.me)
  app.put('/api/auth/preferences', requireAuth, auth.updatePreferences)
  app.put('/api/auth/profile', requireAuth, auth.updateProfile)
  app.post('/api/auth/avatar', requireAuth, auth.uploadAvatar)
}
