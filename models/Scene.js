const { DataTypes } = require('sequelize');
const sequelize = require('../lib/sequelize');

const Scene = sequelize.define('Scene', {
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
  name: {
    type: DataTypes.STRING(191),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  seed_tracks: {
    type: DataTypes.JSON,
    allowNull: false,
  },
  sort_criteria: {
    type: DataTypes.STRING(50),
    defaultValue: 'popularity',
  },
}, {
  tableName: 'Scene',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  underscored: true,
  indexes: [
    {
      name: 'Scene_user_id_idx',
      fields: ['user_id'],
    },
  ],
});

module.exports = Scene;
