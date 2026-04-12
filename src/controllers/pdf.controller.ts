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
  generateDeclaration2072Pdf,
} from '../utils/pdf.generator'
import { sendPdfByEmail } from '../services/email.service'

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
// POST /api/pdf/bail/:lease_id/email
// ─────────────────────────────────────────────────────────────────────────────
exports.emailBail = async (req: Request, res: Response) => {
  try {
    const lease = await db.Lease.findByPk(req.params.lease_id, { include: leaseInclude })
    if (!lease) return res.status(404).json({ message: 'Bail introuvable.' })
    const tenant = lease.Tenant
    if (!tenant?.email) return res.status(400).json({ message: "Le locataire n'a pas d'adresse email." })
    const property = lease.Property
    const landlord = await getLandlord()
    const buffer = await generateBailPdf(lease, property, tenant, landlord)
    const filename = slug(`bail_${property?.city || 'bien'}_${tenant.lastname}_${lease.start_date || 'date'}`) + '.pdf'
    const appName = process.env.APP_NAME || 'App SCI'
    await sendPdfByEmail(
      tenant.email,
      `Votre bail de location – ${property?.address || ''}, ${property?.city || ''}`,
      `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d6a4f;">Votre bail de location</h2>
        <p>Bonjour ${tenant.civility ? tenant.civility + ' ' : ''}${tenant.lastname},</p>
        <p>Veuillez trouver ci-joint votre bail de location pour le bien situé au :<br>
        <strong>${property?.address || ''}, ${property?.zipcode || ''} ${property?.city || ''}</strong></p>
        <p>N'hésitez pas à nous contacter pour toute question.</p>
        <p>Cordialement,<br><strong>${appName}</strong></p>
      </div>`,
      { filename, content: buffer },
    )
    res.json({ message: `Email envoyé à ${tenant.email}` })
  } catch (e: any) {
    console.error(e)
    res.status(500).json({ message: e.message })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/pdf/quittance/:quittance_id/email
// ─────────────────────────────────────────────────────────────────────────────
exports.emailQuittance = async (req: Request, res: Response) => {
  try {
    const quittance = await db.Quittance.findByPk(req.params.quittance_id, { include: quittanceInclude })
    if (!quittance) return res.status(404).json({ message: 'Quittance introuvable.' })
    const tenant = quittance.Tenant
    if (!tenant?.email) return res.status(400).json({ message: "Le locataire n'a pas d'adresse email." })
    const property = quittance.Property
    const landlord = await getLandlord()
    const buffer = await generateQuittancePdf(quittance, property, tenant, landlord)
    const filename = slug(`quittance_${quittance.period || 'periode'}_${tenant.lastname}`) + '.pdf'
    const appName = process.env.APP_NAME || 'App SCI'
    await sendPdfByEmail(
      tenant.email,
      `Votre quittance de loyer – ${quittance.period}`,
      `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d6a4f;">Quittance de loyer – ${quittance.period}</h2>
        <p>Bonjour ${tenant.civility ? tenant.civility + ' ' : ''}${tenant.lastname},</p>
        <p>Veuillez trouver ci-joint votre quittance de loyer pour la période <strong>${quittance.period}</strong>.</p>
        <p>Montant total acquitté : <strong>${parseFloat(quittance.total_amount).toFixed(2)} €</strong></p>
        <p>Cordialement,<br><strong>${appName}</strong></p>
      </div>`,
      { filename, content: buffer },
    )
    res.json({ message: `Email envoyé à ${tenant.email}` })
  } catch (e: any) {
    console.error(e)
    res.status(500).json({ message: e.message })
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/pdf/etat-des-lieux/:inspection_id/email
// ─────────────────────────────────────────────────────────────────────────────
exports.emailEtatDesLieux = async (req: Request, res: Response) => {
  try {
    const inspection = await db.Inspection.findByPk(req.params.inspection_id, { include: inspectionInclude })
    if (!inspection) return res.status(404).json({ message: 'État des lieux introuvable.' })
    const tenant = inspection.Tenant
    if (!tenant?.email) return res.status(400).json({ message: "Le locataire n'a pas d'adresse email." })
    const property = inspection.Property
    const landlord = await getLandlord()
    const buffer = await generateEtatDesLieuxPdf(inspection, property, tenant, landlord)
    const typeEntree = inspection.type === 'entree' ? 'entrée' : 'sortie'
    const filename = slug(`edl_${inspection.type}_${property?.city || 'bien'}_${tenant.lastname}_${inspection.date || 'date'}`) + '.pdf'
    const appName = process.env.APP_NAME || 'App SCI'
    await sendPdfByEmail(
      tenant.email,
      `État des lieux d'${typeEntree} – ${property?.address || ''}, ${property?.city || ''}`,
      `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2d6a4f;">État des lieux d'${typeEntree}</h2>
        <p>Bonjour ${tenant.civility ? tenant.civility + ' ' : ''}${tenant.lastname},</p>
        <p>Veuillez trouver ci-joint l'état des lieux d'<strong>${typeEntree}</strong> du bien situé au :<br>
        <strong>${property?.address || ''}, ${property?.zipcode || ''} ${property?.city || ''}</strong></p>
        <p>Date : <strong>${inspection.date || ''}</strong></p>
        <p>Cordialement,<br><strong>${appName}</strong></p>
      </div>`,
      { filename, content: buffer },
    )
    res.json({ message: `Email envoyé à ${tenant.email}` })
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

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/pdf/declaration-2072?year=2025
// Génère et retourne en téléchargement la déclaration 2072-S (art. 8 CGI)
// ─────────────────────────────────────────────────────────────────────────────
exports.declaration2072 = async (req: Request, res: Response) => {
  try {
    const year = parseInt((req.query.year as string) || String(new Date().getFullYear()), 10)
    if (isNaN(year) || year < 2000 || year > new Date().getFullYear()) {
      return res.status(400).json({ message: 'Année invalide.' })
    }

    const [payments, charges, associates, properties, landlord] = await Promise.all([
      db.Payment.findAll({
        where: { status: 'paid' },
        include: [
          { model: db.Tenant, attributes: ['id', 'civility', 'firstname', 'lastname'] },
          { model: db.Property, attributes: ['id', 'type', 'address', 'zipcode', 'city', 'area'] },
        ],
      }),
      db.Charge.findAll({
        include: [{ model: db.Property, attributes: ['id', 'type', 'city'] }],
      }),
      db.Associate.findAll(),
      db.Property.findAll(),
      db.SciConfig.findOne(),
    ])

    const yearStr = String(year)
    const yearPayments = payments.filter((p: any) => {
      const d: string = p.paid_date || p.due_date || ''
      return d.startsWith(yearStr)
    })

    const totalRevenues: number = yearPayments.reduce((s: number, p: any) => s + parseFloat(p.amount || 0), 0)

    const annualCharge = (c: any): number => {
      const a = parseFloat(c.amount || 0)
      const d: string = c.date || ''
      if (d.startsWith(yearStr)) return a
      if (c.frequency === 'mensuel') return a * 12
      if (c.frequency === 'trimestriel') return a * 4
      if (c.frequency === 'annuel') return a
      return 0
    }
    const totalCharges: number = charges.reduce((s: number, c: any) => s + annualCharge(c), 0)
    const netResult: number = totalRevenues - totalCharges

    const byProperty = properties.map((p: any) => {
      const rev: number = yearPayments
        .filter((pay: any) => pay.property_id === p.id)
        .reduce((s: number, pay: any) => s + parseFloat(pay.amount || 0), 0)
      const propCharges = charges.filter((c: any) => c.property_id === p.id)
      const chg: number = propCharges.reduce((s: number, c: any) => s + annualCharge(c), 0)
      return {
        id: p.id,
        type: p.type || '',
        address: p.address || '',
        zipcode: p.zipcode || '',
        city: p.city || '',
        area: p.area,
        revenues: rev,
        charges: chg,
        net: rev - chg,
        payments: yearPayments
          .filter((pay: any) => pay.property_id === p.id)
          .map((pay: any) => ({
            tenantName: pay.Tenant ? `${pay.Tenant.firstname} ${pay.Tenant.lastname}` : '—',
            month: pay.month || '',
            paidDate: pay.paid_date || '',
            amount: parseFloat(pay.amount || 0),
          })),
        chargeLines: propCharges.map((c: any) => ({
          type: c.type || '',
          description: c.description || '',
          frequency: c.frequency || '',
          annualAmount: annualCharge(c),
        })),
      }
    })

    const byAssociate = associates.map((a: any) => {
      const shares = parseFloat(a.shares || 0)
      return {
        civility: a.civility,
        firstname: a.firstname || '',
        lastname: a.lastname || '',
        role: a.role || '',
        shares,
        allocated: (netResult * shares) / 100,
      }
    })

    const buffer = await generateDeclaration2072Pdf({
      year, landlord, byProperty, byAssociate, totalRevenues, totalCharges, netResult,
    })

    const filename = `declaration_2072_S_${year}.pdf`
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    res.send(buffer)
  } catch (e: any) {
    console.error(e)
    res.status(500).json({ message: e.message })
  }
}
