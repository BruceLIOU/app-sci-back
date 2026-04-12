import { Sequelize } from 'sequelize'

module.exports = (sequelize: Sequelize, { DataTypes }: { DataTypes: typeof import('sequelize').DataTypes }) => {
  const User = sequelize.define('User', {
    google_id: { type: DataTypes.STRING, allowNull: false, unique: true },
    email:     { type: DataTypes.STRING, allowNull: false, unique: true },
    name:      { type: DataTypes.STRING, allowNull: false },
    avatar:    { type: DataTypes.STRING, allowNull: true },
    role: {
      type: DataTypes.ENUM('admin', 'viewer'),
      allowNull: false,
      defaultValue: 'admin',
    },
    // JSON stringifié : { darkMode: false, ... }
    preferences: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: '{"darkMode":false}',
    },
  }, {})

  return User
}
