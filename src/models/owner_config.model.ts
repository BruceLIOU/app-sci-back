import { Sequelize } from 'sequelize'

module.exports = (sequelize: Sequelize, { DataTypes }: { DataTypes: typeof import('sequelize').DataTypes }) => {
  const OwnerConfig = sequelize.define('OwnerConfig', {
    // Profil bailleur
    owner_profile_type: { type: DataTypes.STRING, defaultValue: 'INDIVIDUAL' },
    // Informations structure bailleur (SCI ou personne physique)
    name: { type: DataTypes.STRING, defaultValue: '' },
    legal_form: { type: DataTypes.STRING, defaultValue: 'Particulier' },
    siret: { type: DataTypes.STRING, allowNull: true },
    rcs: { type: DataTypes.STRING, allowNull: true },
    address: { type: DataTypes.STRING, defaultValue: '' },
    zipcode: { type: DataTypes.STRING, defaultValue: '' },
    city: { type: DataTypes.STRING, defaultValue: '' },
    iban: { type: DataTypes.STRING, allowNull: true },
    // Gérant
    manager_associate_id: { type: DataTypes.INTEGER, allowNull: true },
    manager_civility: { type: DataTypes.STRING, defaultValue: 'M.' },
    manager_firstname: { type: DataTypes.STRING, defaultValue: '' },
    manager_lastname: { type: DataTypes.STRING, defaultValue: '' },
    manager_email: { type: DataTypes.STRING, allowNull: true },
    manager_phone: { type: DataTypes.STRING, allowNull: true },
    // Google Calendar
    google_refresh_token: { type: DataTypes.TEXT, allowNull: true },
    google_calendar_id: { type: DataTypes.STRING, allowNull: true },
    // SMTP (envoi de mails)
    smtp_host: { type: DataTypes.STRING, allowNull: true },
    smtp_port: { type: DataTypes.INTEGER, allowNull: true },
    smtp_secure: { type: DataTypes.BOOLEAN, defaultValue: false },
    smtp_user: { type: DataTypes.STRING, allowNull: true },
    smtp_pass: { type: DataTypes.TEXT, allowNull: true },
    smtp_from: { type: DataTypes.STRING, allowNull: true },
    // IMAP / Récupération emails Matera
    imap_host: { type: DataTypes.STRING, allowNull: true },
    imap_port: { type: DataTypes.INTEGER, allowNull: true },
    imap_tls: { type: DataTypes.BOOLEAN, defaultValue: true },
    imap_user: { type: DataTypes.STRING, allowNull: true },
    imap_pass: { type: DataTypes.TEXT, allowNull: true },
    matera_sender_email: { type: DataTypes.STRING, allowNull: true },
    matera_property_id: { type: DataTypes.INTEGER, allowNull: true },
    // Cron
    charge_cron_schedule: { type: DataTypes.STRING, defaultValue: '0 8 * * *' },
    charge_cron_enabled: { type: DataTypes.BOOLEAN, defaultValue: true },
  }, {
    tableName: 'OwnerConfigs',
  })

  return OwnerConfig
}
