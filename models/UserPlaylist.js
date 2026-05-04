const { DataTypes } = require('sequelize');
const sequelize = require('../lib/sequelize');

const UserPlaylist = sequelize.define('UserPlaylist', {
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
    type: DataTypes.ENUM('spotify', 'youtube', 'deezer'),
    allowNull: false,
  },
  playlist_id: {
    type: DataTypes.STRING(191),
    allowNull: false,
  },
  playlist_name: {
    type: DataTypes.STRING(191),
    allowNull: false,
  },
  platform_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  track_count: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  cached_at: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'UserPlaylist',
  timestamps: false,
  underscored: true,
  indexes: [
    {
      name: 'UserPlaylist_user_id_idx',
      fields: ['user_id'],
    },
    {
      unique: true,
      name: 'UserPlaylist_user_provider_id_key',
      fields: ['user_id', 'provider', 'playlist_id'],
    },
  ],
});

module.exports = UserPlaylist;
