const { DataTypes } = require('sequelize');
const sequelize = require('../lib/sequelize');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  email: {
    type: DataTypes.STRING(191),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  },
  password_hash: {
    type: DataTypes.STRING(191),
    allowNull: true,
  },
  is_admin: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'User',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  underscored: true,
});

module.exports = User;
