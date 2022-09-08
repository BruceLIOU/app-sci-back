module.exports = (sequelize, { DataTypes }) => {
  const Tenant = sequelize.define(
    "Tenant",
    {
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
        type: DataTypes.INTEGER,
      },
      property_id: {
        type: DataTypes.INTEGER,
      },
    },
    {}
  );

  Tenant.associate = (models) => {
    Tenant.belongsTo(models.Property, {
      foreignKey: "property_id",
      onDelete: "CASCADE",
    });
  };
  return Tenant;
};
