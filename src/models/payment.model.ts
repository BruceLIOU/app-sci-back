import { Sequelize } from 'sequelize'

module.exports = (sequelize: Sequelize, { DataTypes }: { DataTypes: typeof import('sequelize').DataTypes }) => {
  const Payment = sequelize.define(
    'Payment',
    {
      tenant_id: {
        type: DataTypes.INTEGER,
      },
      property_id: {
        type: DataTypes.INTEGER,
      },
      amount: {
        type: DataTypes.DECIMAL(10, 2),
      },
      due_date: {
        type: DataTypes.DATEONLY,
      },
      paid_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('paid', 'pending', 'late'),
        defaultValue: 'pending',
      },
      month: {
        type: DataTypes.STRING,
      },
    },
    {}
  )

  return Payment
}
