const sequelize = require('../lib/sequelize');
const User = require('./User');
const OAuthToken = require('./OAuthToken');
const Scene = require('./Scene');
const Track = require('./Track');

User.hasMany(OAuthToken, { foreignKey: 'user_id', as: 'oauthTokens' });
OAuthToken.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

User.hasMany(Scene, { foreignKey: 'user_id', as: 'scenes' });
Scene.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Scene.hasMany(Track, { foreignKey: 'scene_id', as: 'tracks' });
Track.belongsTo(Scene, { foreignKey: 'scene_id', as: 'scene' });

module.exports = { sequelize, User, OAuthToken, Scene, Track };
