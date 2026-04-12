import { requireAuth, requireAdmin } from '../middleware/auth.middleware'

module.exports = (app: any) => {
  const users = require('../controllers/user.controller')

  app.get('/api/users', requireAuth, requireAdmin, users.getAll)
  app.post('/api/users', requireAuth, requireAdmin, users.invite)
  app.post('/api/users/:id/resend', requireAuth, requireAdmin, users.resendInvite)
  app.patch('/api/users/:id/role', requireAuth, requireAdmin, users.updateRole)
  app.delete('/api/users/:id', requireAuth, requireAdmin, users.remove)
}
