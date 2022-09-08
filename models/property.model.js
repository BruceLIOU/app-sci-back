module.exports = (sequelize, { DataTypes }) => {
  const Property = sequelize.define(
    "Property",
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
    },
    {}
  );

  return Property;
};
