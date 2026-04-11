import { Request, Response } from 'express'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import cloudinary from '../config/cloudinary.config'
import {
  generateBailPdf,
  generateQuittancePdf,
  generateEtatDesLieuxPdf,
  generateAttestationLoyerPdf,
} from '../utils/pdf.generator'

const db = require('../models')

// Utilitaire : upload d'un Buffer PDF via fichier temporaire (Resource-type raw, URL avec .pdf)
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

// Utilitaire : créer un enregistrement Document en base + upload Cloudinary
async function saveDocument(
  buffer: Buffer,
  { title, category, entity_type, entity_id, filename }: {
    title: string
    category: string
    entity_type: string
    entity_id: number
    filename: string
  },
) {
  const displayName = filename.endsWith('.pdf') ? filename : `${filename}.pdf`
  const { secure_url, bytes } = await uploadPdfToCloudinary(buffer, `sci/pdf/${entity_type}`, filename)
  return db.Document.create({
    title,
    category,
    file_url: secure_url,
    file_name: displayName,
    file_size: bytes,
    mime_type: 'application/pdf',
    entity_type,
    entity_id,
    notes: 'Généré automatiquement',
  })
}

// ─── Helpers de chargement ────────────────────────────────────────────────────

const leaseInclude = [
  { model: db.Property, attributes: ['id', 'type', 'address', 'zipcode', 'city', 'area', 'pieces', 'rooms'] },
  { model: db.Tenant, attributes: ['id', 'civility', 'firstname', 'lastname', 'email', 'mobile', 'previous_address', 'previous_zipcode', 'previous_city'] },
]

const inspectionInclude = [
  { model: db.Property, attributes: ['id', 'type', 'address', 'zipcode', 'city', 'area', 'pieces', 'rooms'] },
  { model: db.Tenant, attributes: ['id', 'civility', 'firstname', 'lastname', 'email', 'mobile'] },
]

const quittanceInclude = [
  { model: db.Property, attributes: ['id', 'type', 'address', 'zipcode', 'city', 'area'] },
  { model: db.Tenant, attributes: ['id', 'civility', 'firstname', 'lastname', 'email', 'mobile'] },
]

async function getLandlord() {
  // Informations de la SCI (Paramètres)
  return db.SciConfig.findOne()
}

function slug(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/pdf/bail/:lease_id
// ─────────────────────────────────────────────────────────────────────────────
exports.bail = async (req: Request, res: Response) => {
  try {
    const lease = await db.Lease.findByPk(req.params.lease_id, { include: leaseInclude })
    if (!lease) return res.status(404).json({ message: 'Bail introuvable.' })

    const property = lease.Property
    const tenant = lease.Tenant
    const landlord = await getLandlord()

    const buffer = await generateBailPdf(lease, property, tenant, landlord)
    const filename = slug(`bail_${property?.city || 'bien'}_${tenant?.lastname || 'locataire'}_${lease.start_date || 'date'}`)
    const title = `Bail – ${property?.city || ''} – ${tenant ? `${tenant.lastname} ${tenant.firstname}` : ''} – ${lease.start_date || ''}`

    // Attacher au bail
    const docLease = await saveDocument(buffer, { title, category: 'bail', entity_type: 'lease', entity_id: lease.id, filename })
    // Attacher au bien
    if (property) {
      await saveDocument(buffer, { title, category: 'bail', entity_type: 'property', entity_id: property.id, filename })
    }

    res.status(201).json({ message: 'PDF généré.', document: docLease, file_url: docLease.file_url })
  } catch (e: any) {
    console.error(e)
    res.status(500).json({ message: e.message })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/pdf/quittance/:quittance_id
// ─────────────────────────────────────────────────────────────────────────────
exports.quittance = async (req: Request, res: Response) => {
  try {
    const quittance = await db.Quittance.findByPk(req.params.quittance_id, { include: quittanceInclude })
    if (!quittance) return res.status(404).json({ message: 'Quittance introuvable.' })

    const property = quittance.Property
    const tenant = quittance.Tenant
    const landlord = await getLandlord()

    const buffer = await generateQuittancePdf(quittance, property, tenant, landlord)
    const filename = slug(`quittance_${quittance.period || 'periode'}_${tenant?.lastname || 'locataire'}`)
    const title = `Quittance – ${quittance.period || ''} – ${tenant ? `${tenant.lastname} ${tenant.firstname}` : ''}`

    const docQuittance = await saveDocument(buffer, { title, category: 'quittance', entity_type: 'quittance', entity_id: quittance.id, filename })

    res.status(201).json({ message: 'PDF généré.', document: docQuittance, file_url: docQuittance.file_url })
  } catch (e: any) {
    console.error(e)
    res.status(500).json({ message: e.message })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/pdf/etat-des-lieux/:inspection_id
// ─────────────────────────────────────────────────────────────────────────────
exports.etatDesLieux = async (req: Request, res: Response) => {
  try {
    const inspection = await db.Inspection.findByPk(req.params.inspection_id, { include: inspectionInclude })
    if (!inspection) return res.status(404).json({ message: 'État des lieux introuvable.' })

    const property = inspection.Property
    const tenant = inspection.Tenant
    const landlord = await getLandlord()

    const buffer = await generateEtatDesLieuxPdf(inspection, property, tenant, landlord)
    const typeLabel = inspection.type === 'entree' ? 'entree' : 'sortie'
    const filename = slug(`edl_${typeLabel}_${property?.city || 'bien'}_${tenant?.lastname || 'locataire'}_${inspection.date || 'date'}`)
    const title = `État des lieux d'${typeLabel} – ${property?.city || ''} – ${inspection.date || ''}`

    const docInspection = await saveDocument(buffer, { title, category: 'etat-des-lieux', entity_type: 'inspection', entity_id: inspection.id, filename })

    res.status(201).json({ message: 'PDF généré.', document: docInspection, file_url: docInspection.file_url })
  } catch (e: any) {
    console.error(e)
    res.status(500).json({ message: e.message })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/pdf/attestation/:lease_id
// ─────────────────────────────────────────────────────────────────────────────
exports.attestation = async (req: Request, res: Response) => {
  try {
    const lease = await db.Lease.findByPk(req.params.lease_id, { include: leaseInclude })
    if (!lease) return res.status(404).json({ message: 'Bail introuvable.' })

    const property = lease.Property
    const tenant = lease.Tenant
    const landlord = await getLandlord()

    const buffer = await generateAttestationLoyerPdf(lease, property, tenant, landlord)
    const filename = slug(`attestation_loyer_${tenant?.lastname || 'locataire'}_${new Date().toISOString().slice(0, 7)}`)
    const title = `Attestation de loyer – ${tenant ? `${tenant.lastname} ${tenant.firstname}` : ''} – ${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`

    const docTenant = tenant
      ? await saveDocument(buffer, { title, category: 'justificatif', entity_type: 'tenant', entity_id: tenant.id, filename })
      : null
    const docLease = await saveDocument(buffer, { title, category: 'justificatif', entity_type: 'lease', entity_id: lease.id, filename })

    res.status(201).json({ message: 'PDF généré.', document: docTenant ?? docLease, file_url: (docTenant ?? docLease).file_url })
  } catch (e: any) {
    console.error(e)
    res.status(500).json({ message: e.message })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/pdf/bail/:lease_id/preview  (retourne le PDF directement)
// ─────────────────────────────────────────────────────────────────────────────
exports.previewBail = async (req: Request, res: Response) => {
  try {
    const lease = await db.Lease.findByPk(req.params.lease_id, { include: leaseInclude })
    if (!lease) return res.status(404).json({ message: 'Bail introuvable.' })
    const landlord = await getLandlord()
    const buffer = await generateBailPdf(lease, lease.Property, lease.Tenant, landlord)
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="bail_preview.pdf"`)
    res.send(buffer)
  } catch (e: any) {
    res.status(500).json({ message: e.message })
  }
}
