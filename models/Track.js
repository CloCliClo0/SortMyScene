const { DataTypes } = require('sequelize');
const sequelize = require('../lib/sequelize');

const Track = sequelize.define('Track', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  scene_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Scene',
      key: 'id',
    },
  },
  platform_id: {
    type: DataTypes.STRING(191),
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(191),
    allowNull: false,
  },
  artist: {
    type: DataTypes.STRING(191),
    allowNull: false,
  },
  album_art: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  tableName: 'Track',
  timestamps: false,
  underscored: true,
  indexes: [
    {
      name: 'Track_scene_id_idx',
      fields: ['scene_id'],
    },
  ],
});

module.exports = Track;
