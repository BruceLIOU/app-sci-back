import { Sequelize } from 'sequelize'

module.exports = (sequelize: Sequelize, { DataTypes }: { DataTypes: typeof import('sequelize').DataTypes }) => {
  const Lease = sequelize.define('Lease', {
    property_id: { type: DataTypes.INTEGER },
    tenant_id: { type: DataTypes.INTEGER },
    type: {
      type: DataTypes.ENUM('nu', 'meublé', 'commercial'),
      defaultValue: 'nu',
    },
    start_date: { type: DataTypes.DATEONLY },
    end_date: { type: DataTypes.DATEONLY, allowNull: true },
    rent_amount: { type: DataTypes.DECIMAL(10, 2) },
    charges_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    deposit_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    notice_period: { type: DataTypes.INTEGER, defaultValue: 3 },
    status: {
      type: DataTypes.ENUM('active', 'expired', 'terminated'),
      defaultValue: 'active',
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    email_sent_at: { type: DataTypes.DATE, allowNull: true },
  }, {})

  return Lease
}
