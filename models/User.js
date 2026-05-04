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
  email_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  email_verification_code: {
    type: DataTypes.STRING(6),
    allowNull: true,
  },
  email_verification_expires: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  theme: {
    type: DataTypes.STRING(10),
    defaultValue: 'dark',
  },
  language: {
    type: DataTypes.STRING(5),
    defaultValue: 'en',
  },
}, {
  tableName: 'User',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  underscored: true,
});

module.exports = User;
