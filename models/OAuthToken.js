const { DataTypes } = require('sequelize');
const sequelize = require('../lib/sequelize');

const OAuthToken = sequelize.define('OAuthToken', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'User',
      key: 'id',
    },
  },
  provider: {
    type: DataTypes.STRING(20),
    allowNull: false,
    validate: {
      isIn: [['deezer', 'spotify', 'youtube']],
    },
  },
  access_token: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  refresh_token: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  expires_in: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
}, {
  tableName: 'OAuthToken',
  timestamps: false,
  underscored: true,
  indexes: [
    {
      name: 'OAuthToken_user_id_provider_key',
      unique: true,
      fields: ['user_id', 'provider'],
    },
    {
      name: 'OAuthToken_user_id_idx',
      fields: ['user_id'],
    },
  ],
});

module.exports = OAuthToken;
