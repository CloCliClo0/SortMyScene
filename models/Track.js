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
  provider: {
    type: DataTypes.ENUM('spotify', 'youtube', 'deezer'),
    defaultValue: 'spotify',
    allowNull: false,
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
  duration_ms: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  popularity: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  tableName: 'Track',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  underscored: true,
  indexes: [
    {
      name: 'Track_scene_id_idx',
      fields: ['scene_id'],
    },
    {
      name: 'Track_platform_id_idx',
      fields: ['platform_id'],
    },
  ],
});

module.exports = Track;
