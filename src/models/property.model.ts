import { Sequelize, DataTypes } from 'sequelize'

module.exports = (sequelize: Sequelize, { DataTypes }: { DataTypes: typeof import('sequelize').DataTypes }) => {
  const Property = sequelize.define(
    'Property',
    {
      address: {
        type: DataTypes.STRING,
      },
      zipcode: {
        type: DataTypes.INTEGER,
      },
      city: {
        type: DataTypes.STRING,
      },
      type: {
        type: DataTypes.STRING,
      },
      pieces: {
        type: DataTypes.INTEGER,
      },
      area: {
        type: DataTypes.INTEGER,
      },
      thumbnail: {
        type: DataTypes.STRING,
      },
      images: {
        type: DataTypes.TEXT,
      },
      rooms: {
        type: DataTypes.TEXT,
      },
      features: {
        type: DataTypes.TEXT,
      },
      comments: {
        type: DataTypes.TEXT,
      },
      latitude: {
        type: DataTypes.FLOAT,
      },
      longitude: {
        type: DataTypes.FLOAT,
      },
    },
    {}
  )

  return Property
}
