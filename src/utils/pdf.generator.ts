import PDFDocument from 'pdfkit'

// ─── Couleurs / constantes ────────────────────────────────────────────────────
const BLUE = '#1a3c6e'
const GRAY = '#555555'
const LIGHT = '#f4f6f8'
const LINE = '#cccccc'
const RED = '#c0392b'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: any, decimals = 2): string {
  return parseFloat(n || 0).toFixed(decimals).replace('.', ',') + ' €'
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—'
  const [y, m, da] = d.split('-')
  return `${da}/${m}/${y}`
}

function tenantFullName(t: any): string {
  if (!t) return '—'
  return [t.civility, t.firstname, t.lastname].filter(Boolean).join(' ')
}

function propertyFullAddress(p: any): string {
  if (!p) return '—'
  return [p.address, p.zipcode, p.city].filter(Boolean).join(' ')
}

// Génère un Buffer à partir d'un PDFDocument
function toBuffer(doc: InstanceType<typeof PDFDocument>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    doc.on('data', (c: Buffer) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
    doc.end()
  })
}

// ─── Bannière en-tête ─────────────────────────────────────────────────────────

function drawHeader(doc: InstanceType<typeof PDFDocument>, title: string, subtitle?: string) {
  doc.rect(0, 0, doc.page.width, 80).fill(BLUE)
  doc.fillColor('white').fontSize(20).font('Helvetica-Bold')
    .text(title, 40, 25, { width: doc.page.width - 80, align: 'center' })
  if (subtitle) {
    doc.fontSize(11).font('Helvetica')
      .text(subtitle, 40, 50, { width: doc.page.width - 80, align: 'center' })
  }
  doc.fillColor('#000000').moveDown(0)
}

function drawFooter(doc: InstanceType<typeof PDFDocument>, note?: string) {
  // Désactive la marge basse pour éviter qu'une nouvelle page soit créée
  // par PDFKit quand le texte du footer est positionné en bas de page
  doc.page.margins.bottom = 0
  const y = doc.page.height - 48
  doc.moveTo(40, y).lineTo(doc.page.width - 40, y).lineWidth(0.5).strokeColor(LINE).stroke()
  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
  doc.fillColor(GRAY).fontSize(8).font('Helvetica')
    .text(`Document généré le ${today}${note ? ' — ' + note : ''}`, 40, y + 6, {
      width: doc.page.width - 80, align: 'center',
    })
}

// ─── Interface Bailleur (SciConfig) ──────────────────────────────────────────
export interface LandlordInfo {
  name?: string
  legal_form?: string
  siret?: string
  rcs?: string
  address?: string
  zipcode?: string
  city?: string
  iban?: string
  manager_civility?: string
  manager_firstname?: string
  manager_lastname?: string
  manager_email?: string
  manager_phone?: string
}

function landlordSciName(l: LandlordInfo): string {
  return [l.legal_form || 'SCI', l.name].filter(v => v && v.trim()).join(' ').trim() || '—'
}

function landlordManagerName(l: LandlordInfo): string {
  return [l.manager_civility, l.manager_firstname, l.manager_lastname].filter(Boolean).join(' ') || ''
}

// ─── Helpers de mise en page ──────────────────────────────────────────────────

function section(doc: InstanceType<typeof PDFDocument>, title: string): void {
  doc.y += 10
  const rectY = doc.y
  doc.rect(40, rectY, doc.page.width - 80, 18).fill(LIGHT)
  doc.fillColor(BLUE).fontSize(10).font('Helvetica-Bold')
    .text(title.toUpperCase(), 46, rectY + 4, { lineBreak: false })
  doc.y = rectY + 26
  doc.fillColor('#000000')
}

function row(doc: InstanceType<typeof PDFDocument>, label: string, value: string, bold = false): void {
  const y = doc.y
  doc.fillColor(GRAY).fontSize(9).font('Helvetica')
    .text(label, 46, y, { width: 170, lineBreak: false })
  doc.fillColor('#000000').font(bold ? 'Helvetica-Bold' : 'Helvetica')
    .text(value || '—', 225, y, { width: doc.page.width - 270 })
  if (doc.y < y + 13) doc.y = y + 13
  doc.y += 3
}

function paragraph(doc: InstanceType<typeof PDFDocument>, text: string, options?: object) {
  doc.fillColor('#000000').fontSize(9).font('Helvetica')
    .text(text, 45, doc.y, { width: doc.page.width - 90, align: 'justify', lineGap: 2, ...options })
  doc.moveDown(0.4)
}

function signatureBlock(doc: InstanceType<typeof PDFDocument>, leftLabel: string, rightLabel?: string): void {
  doc.y += 12
  if (doc.y > doc.page.height - 100) { doc.addPage(); doc.y = 50 }
  const pageY = doc.y
  doc.moveTo(46, pageY + 30).lineTo(250, pageY + 30).strokeColor(LINE).lineWidth(0.5).stroke()
  doc.fillColor(GRAY).fontSize(8).font('Helvetica')
    .text(leftLabel, 46, pageY + 35, { width: 200, lineBreak: false })
  if (rightLabel) {
    doc.moveTo(doc.page.width / 2 + 20, pageY + 30).lineTo(doc.page.width - 46, pageY + 30).strokeColor(LINE).lineWidth(0.5).stroke()
    doc.fillColor(GRAY).fontSize(8).font('Helvetica')
      .text(rightLabel, doc.page.width / 2 + 20, pageY + 35, { width: 200, lineBreak: false })
  }
  doc.y = pageY + 65
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. BAIL DE LOCATION (Décret n°2015-587 / loi ALUR)
// ─────────────────────────────────────────────────────────────────────────────

export async function generateBailPdf(lease: any, property: any, tenant: any, landlord?: LandlordInfo): Promise<Buffer> {
  const typeLabel: Record<string, string> = { nu: 'Location nue', meublé: 'Location meublée', commercial: 'Bail commercial' }
  const dureeLabel: Record<string, string> = { nu: '3 ans', meublé: '1 an', commercial: '9 ans' }
  const loi: Record<string, string> = {
    nu: 'Loi n°89-462 du 6 juillet 1989 – Décret n°2015-587 du 29 mai 2015',
    meublé: 'Loi n°89-462 du 6 juillet 1989 – Décret n°2015-588 du 29 mai 2015',
    commercial: 'Articles L. 145-1 et suivants du Code de commerce',
  }

  const doc = new PDFDocument({ margin: 40, size: 'A4', info: { Title: 'Contrat de bail', Author: 'SCI App' } })
  drawHeader(doc, 'CONTRAT DE BAIL', typeLabel[lease.type] || lease.type)

  doc.y = 100

  section(doc, 'Base légale')
  paragraph(doc, loi[lease.type] || '')

  // Bailleur
  section(doc, 'I. Bailleur')
  if (landlord?.name) {
    row(doc, 'Raison sociale', landlordSciName(landlord))
    const addr = [landlord.address, landlord.zipcode, landlord.city].filter(Boolean).join(', ')
    if (addr) row(doc, 'Siège social', addr)
    if (landlord.siret) row(doc, 'SIRET', landlord.siret)
    const mgr = landlordManagerName(landlord)
    if (mgr) row(doc, 'Représenté par', `${mgr}, Gérant`)
    if (landlord.manager_email) row(doc, 'Email', landlord.manager_email)
    if (landlord.manager_phone) row(doc, 'Téléphone', landlord.manager_phone)
  } else {
    paragraph(doc, '(Veuillez compléter les informations du bailleur dans Paramètres)')
  }

  // Locataire
  section(doc, 'II. Locataire(s)')
  if (tenant) {
    row(doc, 'Civilité', tenant.civility || '—')
    row(doc, 'Prénom', tenant.firstname || '—')
    row(doc, 'Nom', tenant.lastname || '—')
    if (tenant.email) row(doc, 'Email', tenant.email)
    if (tenant.mobile) row(doc, 'Téléphone', tenant.mobile)
    if (tenant.previous_address) {
      row(doc, 'Domicile précédent', [tenant.previous_address, tenant.previous_zipcode, tenant.previous_city].filter(Boolean).join(' '))
    }
  } else {
    paragraph(doc, '(Aucun locataire désigné)')
  }

  // Bien loué
  section(doc, 'III. Désignation du logement')
  row(doc, 'Type de logement', property.type || '—')
  row(doc, 'Adresse', propertyFullAddress(property))
  if (property.area) row(doc, 'Surface habitable', `${property.area} m²`)
  if (property.pieces) row(doc, 'Nombre de pièces', String(property.pieces))
  if (property.rooms) {
    try {
      const rooms = JSON.parse(property.rooms)
      const roomList = rooms.map((r: any) => `${r.count > 1 ? r.count + '× ' : ''}${r.type}`).join(', ')
      row(doc, 'Composition', roomList)
    } catch {}
  }
  paragraph(doc, 'Le logement est loué à usage d\'habitation principale (et mixte professionnel le cas échéant). ' +
    'Le locataire déclare que le logement constitue sa résidence principale au sens de l\'article 2 de la loi du 6 juillet 1989.')

  // Destination
  section(doc, 'IV. Destination des lieux')
  paragraph(doc, 'Le logement est destiné exclusivement à l\'usage d\'habitation principale du locataire et de sa famille. ' +
    'Toute sous-location totale ou partielle est interdite sans accord écrit préalable du bailleur.')

  // Durée du contrat
  section(doc, 'V. Durée du contrat')
  row(doc, 'Date de prise d\'effet', fmtDate(lease.start_date))
  row(doc, 'Date de fin prévue', lease.end_date ? fmtDate(lease.end_date) : `Reconduction tacite (${dureeLabel[lease.type] || '—'})`)
  row(doc, 'Durée légale', dureeLabel[lease.type] || '—')
  row(doc, 'Préavis', `${lease.notice_period || 3} mois`)
  paragraph(doc, `Le contrat est conclu pour une durée de ${dureeLabel[lease.type] || '—'} à compter de la date de prise d'effet. ` +
    `Il se renouvelle par tacite reconduction sauf congé donné dans les formes et délais légaux.`)

  // Loyer et charges
  section(doc, 'VI. Loyer et charges')
  row(doc, 'Loyer mensuel hors charges', fmt(lease.rent_amount), true)
  row(doc, 'Provision sur charges', fmt(lease.charges_amount))
  row(doc, 'Loyer mensuel charges comprises', fmt(parseFloat(lease.rent_amount || 0) + parseFloat(lease.charges_amount || 0)), true)
  row(doc, 'Dépôt de garantie', fmt(lease.deposit_amount))
  row(doc, 'Modalités de paiement', 'Paiement mensuel à terme échu, avant le 5 de chaque mois')
  paragraph(doc, 'Le loyer sera révisé chaque année à la date anniversaire du contrat selon l\'Indice de Référence des Loyers (IRL) ' +
    'publié par l\'INSEE, conformément à l\'article 17-1 de la loi du 6 juillet 1989.')

  // Charges récupérables
  section(doc, 'VII. Charges récupérables')
  paragraph(doc, 'Les charges récupérables sont celles définies par le décret n°87-713 du 26 août 1987. ' +
    'Elles sont payées par provision et feront l\'objet d\'une régularisation annuelle sur justificatifs.')

  // Dépôt de garantie
  section(doc, 'VIII. Dépôt de garantie')
  paragraph(doc, `Le dépôt de garantie s'élève à ${fmt(lease.deposit_amount)}. ` +
    'Il sera restitué dans un délai d\'un mois si l\'état des lieux de sortie est conforme à l\'état des lieux d\'entrée, ' +
    'ou dans un délai de deux mois dans le cas contraire, conformément à l\'article 22 de la loi du 6 juillet 1989.')

  // Entretien / travaux
  section(doc, 'IX. Entretien et réparations')
  paragraph(doc, 'Le locataire doit entretenir le logement en bon état et effectuer les réparations locatives définies ' +
    'par le décret n°87-712 du 26 août 1987. Les travaux d\'amélioration et les grosses réparations incombent au bailleur.')

  // Assurance
  section(doc, 'X. Assurance')
  paragraph(doc, 'Le locataire est tenu de s\'assurer contre les risques locatifs (incendie, dégâts des eaux, etc.) ' +
    'et de justifier de cette assurance au bailleur lors de la remise des clés, puis chaque année sur demande. ' +
    'À défaut, le bailleur peut souscrire une assurance pour compte du locataire, conformément à l\'article 7 de la loi du 6 juillet 1989.')

  // Clause resolutoire
  section(doc, 'XI. Clause résolutoire')
  paragraph(doc, 'Il est expressément convenu qu\'à défaut de paiement du loyer ou des charges aux termes convenus, ' +
    'ou à défaut d\'assurance locative, la présente location sera résiliée de plein droit, après commandement demeuré infructueux ' +
    'pendant un délai de deux mois, conformément à l\'article 24 de la loi du 6 juillet 1989.')

  // Informatique & Libertés
  section(doc, 'XII. Protection des données personnelles')
  paragraph(doc, 'Les informations recueillies font l\'objet d\'un traitement informatique destiné à la gestion locative. ' +
    'Conformément au RGPD (Règlement UE 2016/679), vous disposez d\'un droit d\'accès, de rectification et de suppression de vos données.')

  if (lease.notes) {
    section(doc, 'XIII. Conditions particulières')
    paragraph(doc, lease.notes)
  }

  // Signatures
  doc.moveDown(1)
  if (doc.y > 650) doc.addPage()
  section(doc, 'Signatures')
  paragraph(doc, 'Fait en deux exemplaires originaux.')
  row(doc, 'Lieu et date', `${property.city || '—'}, le ${new Date().toLocaleDateString('fr-FR')}`)
  signatureBlock(doc, 'Signature du bailleur', 'Signature du locataire\n(précédée de la mention « Lu et approuvé »)')

  drawFooter(doc, 'Document non contractuel sans signature originale')
  return toBuffer(doc)
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. QUITTANCE DE LOYER (art. 21 loi n°89-462 du 6 juillet 1989)
// ─────────────────────────────────────────────────────────────────────────────

export async function generateQuittancePdf(quittance: any, property: any, tenant: any, landlord?: LandlordInfo): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 40, size: 'A4', info: { Title: 'Quittance de loyer', Author: 'SCI App' } })
  const pageW = doc.page.width

  drawHeader(doc, 'QUITTANCE DE LOYER', 'Art. 21 – Loi n°89-462 du 6 juillet 1989')

  // Numéro en haut à droite
  if (quittance.number) {
    doc.fillColor(GRAY).fontSize(9).font('Helvetica')
      .text(`N° ${quittance.number}`, pageW - 165, 88, { width: 125, align: 'right', lineBreak: false })
  }

  doc.y = 102

  // ── Deux colonnes : Bailleur | Locataire ─────────────────────────────────────
  const colW = (pageW - 100) / 2
  const rightX = 40 + colW + 20
  const boxH = 90
  const boxY = doc.y + 4

  // Colonne gauche : Bailleur
  doc.rect(40, boxY, colW, boxH).strokeColor(LINE).lineWidth(0.5).stroke()
  doc.rect(40, boxY, colW, 16).fill(LIGHT)
  doc.fillColor(BLUE).fontSize(9).font('Helvetica-Bold')
    .text('BAILLEUR', 46, boxY + 4, { lineBreak: false })
  doc.fontSize(9)
  let bY = boxY + 22
  if (landlord?.name) {
    const sciName = landlordSciName(landlord)
    doc.fillColor('#000000').font('Helvetica-Bold')
      .text(sciName, 46, bY, { width: colW - 10, lineBreak: false }); bY += 14
    const mgr = landlordManagerName(landlord)
    if (mgr) {
      doc.fillColor(GRAY).font('Helvetica')
        .text(`Gérant : ${mgr}`, 46, bY, { width: colW - 10, lineBreak: false }); bY += 12
    }
    doc.fillColor('#000000')
    if (landlord.address) {
      doc.text(landlord.address, 46, bY, { width: colW - 10, lineBreak: false }); bY += 12
    }
    const cityLine = [landlord.zipcode, landlord.city].filter(Boolean).join(' ')
    if (cityLine) {
      doc.text(cityLine, 46, bY, { width: colW - 10, lineBreak: false }); bY += 12
    }
    if (landlord.siret) {
      doc.fillColor(GRAY).fontSize(8)
        .text(`SIRET : ${landlord.siret}`, 46, bY, { width: colW - 10, lineBreak: false })
    }
  } else {
    doc.fillColor(GRAY).font('Helvetica')
      .text('(à compléter dans Paramètres)', 46, bY, { width: colW - 10, lineBreak: false })
  }

  // Colonne droite : Locataire
  doc.rect(rightX, boxY, colW, boxH).strokeColor(LINE).lineWidth(0.5).stroke()
  doc.rect(rightX, boxY, colW, 16).fill(LIGHT)
  doc.fillColor(BLUE).fontSize(9).font('Helvetica-Bold')
    .text('LOCATAIRE', rightX + 6, boxY + 4, { lineBreak: false })
  doc.fillColor('#000000').fontSize(9).font('Helvetica-Bold')
    .text(tenantFullName(tenant), rightX + 6, boxY + 22, { width: colW - 10, lineBreak: false })
  if (property?.address) {
    doc.fillColor(GRAY).font('Helvetica')
      .text(property.address, rightX + 6, boxY + 36, { width: colW - 10, lineBreak: false })
    const tenantCityLine = [property.zipcode, property.city].filter(Boolean).join(' ')
    if (tenantCityLine) {
      doc.text(tenantCityLine, rightX + 6, boxY + 49, { width: colW - 10, lineBreak: false })
    }
  }

  doc.y = boxY + boxH + 8

  // ── Logement ─────────────────────────────────────────────────────────────────
  section(doc, 'Logement loué')
  const propParts = [
    propertyFullAddress(property),
    property?.type,
    property?.area ? `${property.area} m²` : '',
  ].filter(Boolean)
  doc.fillColor('#000000').fontSize(9).font('Helvetica')
    .text(propParts.join('  ·  '), 46, doc.y, { width: pageW - 92 })
  doc.y += 8

  // ── Détail du paiement ────────────────────────────────────────────────────────
  section(doc, 'Détail du paiement')

  // Ligne période + date côte à côte
  const detY = doc.y
  doc.fillColor(GRAY).fontSize(9).font('Helvetica')
    .text('Période :', 46, detY, { width: 55, lineBreak: false })
  doc.fillColor('#000000').font('Helvetica-Bold')
    .text(quittance.period || '—', 103, detY, { lineBreak: false })
  doc.fillColor(GRAY).font('Helvetica')
    .text("Date d'émission :", pageW / 2, detY, { lineBreak: false })
  doc.fillColor('#000000').font('Helvetica-Bold')
    .text(fmtDate(quittance.issue_date), pageW / 2 + 96, detY, { lineBreak: false })
  doc.y = detY + 16

  // Séparateur
  doc.moveTo(46, doc.y).lineTo(pageW - 46, doc.y).lineWidth(0.3).strokeColor(LINE).stroke()
  doc.y += 8

  // Montants
  const amtCol = pageW - 145
  const amtW = 100

  const amtRow = (label: string, amount: string, isBold = false) => {
    const rY = doc.y
    doc.fillColor(isBold ? '#000000' : GRAY).fontSize(9).font(isBold ? 'Helvetica-Bold' : 'Helvetica')
      .text(label, 46, rY, { width: amtCol - 60, lineBreak: false })
    doc.fillColor('#000000').font(isBold ? 'Helvetica-Bold' : 'Helvetica')
      .text(amount, amtCol, rY, { width: amtW, align: 'right', lineBreak: false })
    doc.y = rY + 16
  }

  amtRow('Loyer hors charges', fmt(quittance.rent_amount))
  amtRow('Provisions sur charges', fmt(quittance.charges_amount))

  // Séparateur bleu avant total
  doc.moveTo(amtCol - 5, doc.y).lineTo(pageW - 46, doc.y).lineWidth(0.6).strokeColor(BLUE).stroke()
  doc.y += 4

  // Boîte total bleue
  const totalBoxY = doc.y + 2
  doc.rect(46, totalBoxY, pageW - 92, 28).fill(BLUE)
  doc.fillColor('white').fontSize(11).font('Helvetica-Bold')
    .text('TOTAL REÇU', 56, totalBoxY + 8, { lineBreak: false })
  doc.fillColor('white').fontSize(11).font('Helvetica-Bold')
    .text(fmt(quittance.total_amount), 56, totalBoxY + 8, { width: pageW - 112, align: 'right', lineBreak: false })
  doc.y = totalBoxY + 36
  doc.fillColor('#000000')

  // ── Déclaration du bailleur ───────────────────────────────────────────────────
  section(doc, 'Déclaration du bailleur')

  const bailleurName = landlord?.name
    ? landlordSciName(landlord)
    : '(le bailleur)'

  paragraph(doc,
    `Je soussigné(e), ${bailleurName}, bailleur, déclare avoir reçu de ${tenantFullName(tenant)}, ` +
    `locataire du logement situé ${propertyFullAddress(property)}, la somme de ${fmt(quittance.total_amount)} ` +
    `au titre du loyer et des charges du mois de ${quittance.period || '—'}, ` +
    `et lui en donne bonne et valable quittance, sous réserve de tous droits.`,
  )

  paragraph(doc,
    `Cette quittance est délivrée gratuitement et annule tous les reçus qui auraient pu être établis précédemment pour la même période.`,
  )

  // Lieu, date, signature
  doc.y += 6
  row(doc, 'Fait à', `${landlord?.city || property?.city || '—'}, le ${new Date().toLocaleDateString('fr-FR')}`)
  signatureBlock(doc, 'Signature du bailleur')

  drawFooter(doc, 'Quittance délivrée gratuitement – Loi n°89-462 du 6 juillet 1989')
  return toBuffer(doc)
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ÉTAT DES LIEUX (Loi ALUR – Décret n°2016-382 du 30 mars 2016)
// ─────────────────────────────────────────────────────────────────────────────

export async function generateEtatDesLieuxPdf(inspection: any, property: any, tenant: any, landlord?: LandlordInfo): Promise<Buffer> {
  const typeLabel: Record<string, string> = { entree: 'ENTRÉE', sortie: 'SORTIE' }
  const statusLabel: Record<string, string> = { pending: 'En attente de signature', completed: 'Complété et signé' }
  const conditionColor: Record<string, string> = {
    'Très bon état': '0,160,0',
    'Bon état': '0,130,50',
    'État moyen': '200,130,0',
    'Mauvais état': '180,0,0',
    'À rénover': '130,0,0',
  }

  const doc = new PDFDocument({ margin: 40, size: 'A4', info: { Title: `État des lieux d'${typeLabel[inspection.type]?.toLowerCase() || 'entrée'}`, Author: 'SCI App' } })
  drawHeader(doc, `ÉTAT DES LIEUX D'${typeLabel[inspection.type] || 'ENTRÉE'}`, 'Décret n°2016-382 du 30 mars 2016 (loi ALUR)')

  doc.y = 100

  section(doc, 'I. Informations générales')
  row(doc, 'Type', `État des lieux d'${inspection.type === 'entree' ? 'entrée' : 'sortie'}`)
  row(doc, 'Date', fmtDate(inspection.date))
  row(doc, 'Statut', statusLabel[inspection.status] || inspection.status)

  section(doc, 'II. Logement')
  row(doc, 'Adresse', propertyFullAddress(property))
  row(doc, 'Type de bien', property.type || '—')
  if (property.area) row(doc, 'Surface habitable', `${property.area} m²`)
  if (property.pieces) row(doc, 'Nombre de pièces', String(property.pieces))

  section(doc, 'III. Parties présentes')
  row(doc, 'Bailleur / Mandataire', landlord?.name ? landlordSciName(landlord) : '(à compléter)')
  row(doc, 'Locataire', tenantFullName(tenant))

  section(doc, 'IV. Clés et équipements remis')
  paragraph(doc, 'Nombre de clés remises : ______  |  Télécommande(s) : ______  |  Digicode : ______')
  paragraph(doc, 'Relevés des compteurs — Électricité : ________  |  Eau froide : ________  |  Eau chaude : ________  |  Gaz : ________')

  // Pièces du bien (property.rooms = [{type, count, area}])
  let propRooms: any[] = []
  try { propRooms = property?.rooms ? JSON.parse(property.rooms) : [] } catch {}
  // Fallback : inspection.rooms (anciennes données) → [{name, condition, notes}]
  const legacyRooms: any[] = []
  if (propRooms.length === 0) {
    try {
      const parsed = inspection.rooms ? JSON.parse(inspection.rooms) : []
      legacyRooms.push(...parsed)
    } catch {}
  }

  // ── Helper : dessine un bloc pièce avec grille ALUR ────────────────────────
  const drawRoomBlock = (title: string, condition?: string, observations?: string) => {
    const pageW = doc.page.width
    const gridItems = [
      ['Murs / peinture', 'Sol / revêtement'],
      ['Plafond', 'Portes / fenêtres'],
      ['Volets / stores', 'Équipements'],
    ]
    const blockH = 20 + 14 + 14 + gridItems.length * 16 + 6
    if (doc.y + blockH > doc.page.height - 60) { doc.addPage(); doc.y = 50 }

    // En-tête de la pièce
    const hY = doc.y + 6
    doc.rect(45, hY, pageW - 90, 18).fill('#dce3ec')
    doc.fillColor(BLUE).fontSize(10).font('Helvetica-Bold')
      .text(title, 50, hY + 4, { width: pageW - 100, lineBreak: false })
    doc.y = hY + 22
    doc.fillColor('#000000')

    // Ligne État général
    const eY = doc.y
    doc.fillColor(GRAY).fontSize(8).font('Helvetica')
      .text('État général :', 50, eY + 1, { width: 90, lineBreak: false })
    if (condition) {
      const condRgb = conditionColor[condition]
      if (condRgb) {
        const [r, g, b] = condRgb.split(',').map(Number)
        doc.fillColor([r, g, b]).fontSize(8).font('Helvetica-Bold')
          .text(condition, 148, eY + 1, { width: pageW - 193, lineBreak: false })
        doc.fillColor('#000000')
      } else {
        doc.fillColor('#000000').fontSize(8).font('Helvetica')
          .text(condition, 148, eY + 1, { width: pageW - 193, lineBreak: false })
      }
    } else {
      doc.moveTo(148, eY + 10).lineTo(pageW - 45, eY + 10).strokeColor(LINE).lineWidth(0.4).stroke()
    }
    doc.y = eY + 14

    // Ligne Observations
    const oY = doc.y
    doc.fillColor(GRAY).fontSize(8).font('Helvetica')
      .text('Observations :', 50, oY + 1, { width: 90, lineBreak: false })
    if (observations) {
      doc.fillColor('#000000').fontSize(8).font('Helvetica')
        .text(observations, 148, oY + 1, { width: pageW - 193, lineBreak: false })
    } else {
      doc.moveTo(148, oY + 10).lineTo(pageW - 45, oY + 10).strokeColor(LINE).lineWidth(0.4).stroke()
    }
    doc.y = oY + 14

    // Grille 2 colonnes
    const colW = (pageW - 90) / 2
    gridItems.forEach(([left, right]) => {
      const gY = doc.y
      // Colonne gauche
      doc.fillColor(GRAY).fontSize(7.5).font('Helvetica')
        .text(`${left} :`, 50, gY + 2, { width: 85, lineBreak: false })
      doc.moveTo(140, gY + 10).lineTo(45 + colW - 4, gY + 10).strokeColor(LINE).lineWidth(0.3).stroke()
      // Colonne droite
      if (right) {
        doc.fillColor(GRAY).fontSize(7.5).font('Helvetica')
          .text(`${right} :`, 45 + colW + 4, gY + 2, { width: 85, lineBreak: false })
        doc.moveTo(45 + colW + 95, gY + 10).lineTo(pageW - 45, gY + 10).strokeColor(LINE).lineWidth(0.3).stroke()
      }
      doc.y = gY + 16
    })

    doc.fillColor('#000000')
    doc.y += 2
  }

  section(doc, 'V. État des pièces')

  if (propRooms.length === 0 && legacyRooms.length === 0) {
    paragraph(doc, 'Aucune pièce à décrire.')
  } else if (legacyRooms.length > 0) {
    for (const room of legacyRooms) {
      drawRoomBlock(room.name || 'Pièce', room.condition, room.notes)
    }
  } else {
    for (const pRoom of propRooms) {
      const numRooms = typeof pRoom.count === 'number' && pRoom.count > 1 ? pRoom.count : 1
      for (let rc = 0; rc < numRooms; rc++) {
        const roomTitle = `${pRoom.type || 'Pièce'}${numRooms > 1 ? ` n°${rc + 1}` : ''}${pRoom.area ? ` (${pRoom.area} m²)` : ''}`
        drawRoomBlock(roomTitle)
      }
    }
  }

  // Observations générales
  if (inspection.general_notes) {
    section(doc, 'VI. Observations générales')
    paragraph(doc, inspection.general_notes)
  }

  // Réserves
  section(doc, inspection.type === 'sortie' ? 'VII. Comparaison entrée / sortie' : 'VII. Réserves')
  if (inspection.type === 'sortie') {
    paragraph(doc, 'Dégradations constatées par rapport à l\'état des lieux d\'entrée (hors usure normale) :')
    doc.moveDown(0.5)
    for (let i = 0; i < 4; i++) {
      doc.moveTo(45, doc.y).lineTo(doc.page.width - 45, doc.y).strokeColor(LINE).lineWidth(0.3).stroke()
      doc.moveDown(0.8)
    }
  } else {
    paragraph(doc, 'Réserves émises par le locataire (à compléter dans les 10 jours suivant l\'entrée dans les lieux) :')
    doc.moveDown(0.5)
    for (let i = 0; i < 3; i++) {
      doc.moveTo(45, doc.y).lineTo(doc.page.width - 45, doc.y).strokeColor(LINE).lineWidth(0.3).stroke()
      doc.moveDown(0.8)
    }
  }

  // Signatures
  if (doc.y > 650) doc.addPage()
  section(doc, 'VIII. Signatures')
  paragraph(doc, `Les parties reconnaissent que le présent état des lieux a été établi contradictoirement.`)
  row(doc, 'Lieu et date', `${property.city || '—'}, le ${fmtDate(inspection.date)}`)
  signatureBlock(doc, 'Signature du bailleur\n(ou mandataire)', 'Signature du locataire\n(précédée de « Lu et approuvé »)')

  drawFooter(doc, 'Établi conformément au décret n°2016-382 du 30 mars 2016')
  return toBuffer(doc)
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. ATTESTATION DE LOYER (pour CAF / APL)
// ─────────────────────────────────────────────────────────────────────────────

export async function generateAttestationLoyerPdf(lease: any, property: any, tenant: any, landlord?: LandlordInfo): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 40, size: 'A4', info: { Title: 'Attestation de loyer', Author: 'SCI App' } })
  drawHeader(doc, 'ATTESTATION DE LOYER', 'Document établi à la demande du locataire')

  doc.y = 100

  section(doc, 'Bailleur')
  if (landlord?.name) {
    row(doc, 'Raison sociale', landlordSciName(landlord))
    const addr = [landlord.address, landlord.zipcode, landlord.city].filter(Boolean).join(', ')
    if (addr) row(doc, 'Adresse', addr)
    const mgr = landlordManagerName(landlord)
    if (mgr) row(doc, 'Représenté par', `${mgr}, Gérant`)
    if (landlord.manager_email) row(doc, 'Email', landlord.manager_email)
    if (landlord.manager_phone) row(doc, 'Téléphone', landlord.manager_phone)
  }

  section(doc, 'Locataire')
  row(doc, 'Identité', tenantFullName(tenant))
  if (tenant?.email) row(doc, 'Email', tenant.email)
  if (tenant?.mobile) row(doc, 'Téléphone', tenant.mobile)

  section(doc, 'Logement loué')
  row(doc, 'Adresse', propertyFullAddress(property))
  row(doc, 'Type', property.type || '—')
  if (property.area) row(doc, 'Surface habitable', `${property.area} m²`)
  if (property.pieces) row(doc, 'Nombre de pièces', String(property.pieces))

  section(doc, 'Conditions de location')
  row(doc, 'Date de début du bail', fmtDate(lease.start_date))
  row(doc, 'Loyer mensuel hors charges', fmt(lease.rent_amount), true)
  row(doc, 'Provisions sur charges', fmt(lease.charges_amount))
  row(doc, 'Loyer mensuel charges comprises', fmt(parseFloat(lease.rent_amount || 0) + parseFloat(lease.charges_amount || 0)), true)
  row(doc, 'Dépôt de garantie versé', fmt(lease.deposit_amount))

  section(doc, 'Attestation')
  const landlordNameAttest = landlord?.name ? landlordSciName(landlord) : '(le bailleur)'
  paragraph(doc,
    `Je soussigné(e), ${landlordNameAttest}, bailleur du logement situé ${propertyFullAddress(property)}, ` +
    `atteste que ${tenantFullName(tenant)} est locataire de ce logement depuis le ${fmtDate(lease.start_date)} ` +
    `et s'acquitte d'un loyer mensuel de ${fmt(parseFloat(lease.rent_amount || 0) + parseFloat(lease.charges_amount || 0))} charges comprises. ` +
    `Cette attestation est établie pour servir et valoir ce que de droit, notamment dans le cadre d'une demande d'aide au logement (APL/ALS/ALF).`
  )

  row(doc, 'Fait à', `${property.city || '—'}, le ${new Date().toLocaleDateString('fr-FR')}`)
  signatureBlock(doc, 'Signature et cachet du bailleur', '')

  drawFooter(doc, 'Document établi à la demande du locataire')
  return toBuffer(doc)
}
