import { Sequelize } from 'sequelize'

module.exports = (sequelize: Sequelize, { DataTypes }: { DataTypes: typeof import('sequelize').DataTypes }) => {
  const Inspection = sequelize.define('Inspection', {
    property_id: { type: DataTypes.INTEGER },
    tenant_id: { type: DataTypes.INTEGER, allowNull: true },
    lease_id: { type: DataTypes.INTEGER, allowNull: true },
    type: {
      type: DataTypes.ENUM('entree', 'sortie'),
      defaultValue: 'entree',
    },
    date: { type: DataTypes.DATEONLY },
    status: {
      type: DataTypes.ENUM('pending', 'completed'),
      defaultValue: 'pending',
    },
    general_notes: { type: DataTypes.TEXT, allowNull: true },
    rooms: { type: DataTypes.TEXT, allowNull: true, comment: 'JSON array of room conditions' },
  }, {})

  return Inspection
}
