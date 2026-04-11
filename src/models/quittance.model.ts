import { Sequelize } from 'sequelize'

module.exports = (sequelize: Sequelize, { DataTypes }: { DataTypes: typeof import('sequelize').DataTypes }) => {
  const Quittance = sequelize.define('Quittance', {
    number: { type: DataTypes.STRING },
    tenant_id: { type: DataTypes.INTEGER, allowNull: true },
    property_id: { type: DataTypes.INTEGER, allowNull: true },
    lease_id: { type: DataTypes.INTEGER, allowNull: true },
    payment_id: { type: DataTypes.INTEGER, allowNull: true },
    period: { type: DataTypes.STRING },
    rent_amount: { type: DataTypes.DECIMAL(10, 2) },
    charges_amount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
    total_amount: { type: DataTypes.DECIMAL(10, 2) },
    issue_date: { type: DataTypes.DATEONLY },
  }, {})

  return Quittance
}
