module.exports = (app: any) => {
  const notifications = require('../controllers/notification.controller')

  // L'ordre est important : les routes statiques avant :id
  app.get('/api/notifications/unread-count', notifications.unreadCount)
  app.put('/api/notifications/mark-all-read', notifications.markAllRead)
  app.post('/api/notifications/bulk-delete', notifications.bulkDelete)

  app.get('/api/notifications', notifications.findAll)
  app.put('/api/notifications/:id/read', notifications.markRead)
  app.delete('/api/notifications/:id', notifications.delete)
}
