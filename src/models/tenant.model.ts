import { Sequelize } from 'sequelize'

module.exports = (sequelize: Sequelize, { DataTypes }: { DataTypes: typeof import('sequelize').DataTypes }) => {
  const Tenant = sequelize.define(
    'Tenant',
    {
      civility: {
        type: DataTypes.STRING,
      },
      firstname: {
        type: DataTypes.STRING,
      },
      lastname: {
        type: DataTypes.STRING,
      },
      email: {
        type: DataTypes.STRING,
      },
      mobile: {
        type: DataTypes.STRING,
      },
      property_id: {
        type: DataTypes.INTEGER,
      },
    },
    {}
  )

  return Tenant
}
