import { Sequelize } from 'sequelize'

module.exports = (sequelize: Sequelize, { DataTypes }: { DataTypes: typeof import('sequelize').DataTypes }) => {
  const Associate = sequelize.define('Associate', {
    civility: { type: DataTypes.STRING },
    firstname: { type: DataTypes.STRING },
    lastname: { type: DataTypes.STRING },
    email: { type: DataTypes.STRING, allowNull: true },
    phone: { type: DataTypes.STRING, allowNull: true },
    address: { type: DataTypes.TEXT, allowNull: true },
    shares: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0, comment: 'Percentage of shares' },
    role: { type: DataTypes.STRING, defaultValue: 'Co-bailleur' },
  }, {})

  return Associate
}
