import { Sequelize } from 'sequelize'

module.exports = (sequelize: Sequelize, { DataTypes }: { DataTypes: typeof import('sequelize').DataTypes }) => {
  const SciConfig = sequelize.define('SciConfig', {
    // Informations SCI
    name: { type: DataTypes.STRING, defaultValue: '' },
    legal_form: { type: DataTypes.STRING, defaultValue: 'SCI' },
    siret: { type: DataTypes.STRING, allowNull: true },
    rcs: { type: DataTypes.STRING, allowNull: true },
    address: { type: DataTypes.STRING, defaultValue: '' },
    zipcode: { type: DataTypes.STRING, defaultValue: '' },
    city: { type: DataTypes.STRING, defaultValue: '' },
    iban: { type: DataTypes.STRING, allowNull: true },
    // Gérant
    manager_civility: { type: DataTypes.STRING, defaultValue: 'M.' },
    manager_firstname: { type: DataTypes.STRING, defaultValue: '' },
    manager_lastname: { type: DataTypes.STRING, defaultValue: '' },
    manager_email: { type: DataTypes.STRING, allowNull: true },
    manager_phone: { type: DataTypes.STRING, allowNull: true },
    // Google Calendar
    google_refresh_token: { type: DataTypes.TEXT, allowNull: true },
  }, {})

  return SciConfig
}
