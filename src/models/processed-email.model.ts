import { Sequelize } from 'sequelize'

module.exports = (sequelize: Sequelize, { DataTypes }: { DataTypes: typeof import('sequelize').DataTypes }) => {
  const ProcessedEmail = sequelize.define('ProcessedEmail', {
    message_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    processed_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'processed_emails',
    timestamps: false,
  })

  return ProcessedEmail
}
