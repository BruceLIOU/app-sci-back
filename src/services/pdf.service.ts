import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import cloudinary from '../config/cloudinary.config'
import { generateQuittancePdf } from '../utils/pdf.generator'

const db = require('../models')

async function uploadPdfToCloudinary(
  buffer: Buffer,
  folder: string,
  filename: string,
): Promise<{ secure_url: string; bytes: number }> {
  const safeFilename = filename.endsWith('.pdf') ? filename : `${filename}.pdf`
  const tmpPath = path.join(os.tmpdir(), safeFilename)
  try {
    fs.writeFileSync(tmpPath, buffer)
    const result = await cloudinary.uploader.upload(tmpPath, {
      folder,
      resource_type: 'raw',
      use_filename: true,
      unique_filename: true,
    })
    return { secure_url: result.secure_url, bytes: result.bytes }
  } finally {
    try { fs.unlinkSync(tmpPath) } catch { /* noop */ }
  }
}

function slug(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
}

export async function generateAndSaveQuittancePdf(quittanceId: number): Promise<void> {
  const quittance = await db.Quittance.findByPk(quittanceId, {
    include: [
      { model: db.Property, attributes: ['id', 'type', 'address', 'zipcode', 'city', 'area'] },
      { model: db.Tenant, attributes: ['id', 'civility', 'firstname', 'lastname', 'email', 'mobile'] },
    ],
  })
  if (!quittance) throw new Error(`Quittance ${quittanceId} introuvable.`)

  const property = quittance.Property
  const tenant = quittance.Tenant
  const landlord = await db.SciConfig.findOne()

  const buffer = await generateQuittancePdf(quittance, property, tenant, landlord)
  const filename = slug(`quittance_${quittance.period || 'periode'}_${tenant?.lastname || 'locataire'}`)
  const title = `Quittance – ${quittance.period || ''} – ${tenant ? `${tenant.lastname} ${tenant.firstname}` : ''}`
  const displayName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`

  const { secure_url, bytes } = await uploadPdfToCloudinary(buffer, 'sci/pdf/quittance', filename)

  await db.Document.create({
    title,
    category: 'quittance',
    file_url: secure_url,
    file_name: displayName,
    file_size: bytes,
    mime_type: 'application/pdf',
    entity_type: 'quittance',
    entity_id: quittance.id,
    notes: 'Généré automatiquement',
  })
}
