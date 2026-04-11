import { Sequelize } from 'sequelize'

module.exports = (sequelize: Sequelize, { DataTypes }: { DataTypes: typeof import('sequelize').DataTypes }) => {
  const Visit = sequelize.define('Visit', {
    title: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    property_id: { type: DataTypes.INTEGER, allowNull: false },
    tenant_id: { type: DataTypes.INTEGER, allowNull: true },
    contact_name: { type: DataTypes.STRING, allowNull: true },
    contact_email: { type: DataTypes.STRING, allowNull: true },
    contact_phone: { type: DataTypes.STRING, allowNull: true },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    time: { type: DataTypes.STRING, allowNull: false, defaultValue: '10:00' },
    duration: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 60 },
    type: {
      type: DataTypes.ENUM('visite', 'rdv', 'autre'),
      allowNull: false,
      defaultValue: 'visite',
    },
    status: {
      type: DataTypes.ENUM('scheduled', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'scheduled',
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    google_event_id: { type: DataTypes.STRING, allowNull: true },
  }, {})

  return Visit
}
