import { Application } from 'express'

module.exports = (app: Application) => {
  const pdf = require('../controllers/pdf.controller')

  // Génération + upload vers Cloudinary + création Document en base
  app.post('/api/pdf/bail/:lease_id', pdf.bail)
  app.post('/api/pdf/quittance/:quittance_id', pdf.quittance)
  app.post('/api/pdf/etat-des-lieux/:inspection_id', pdf.etatDesLieux)
  app.post('/api/pdf/attestation/:lease_id', pdf.attestation)

  // Prévisualisation directe (retourne le PDF sans sauvegarder)
  app.get('/api/pdf/bail/:lease_id/preview', pdf.previewBail)
}
