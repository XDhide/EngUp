const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const UserNote = sequelize.define('UserNote', {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    title: { type: DataTypes.STRING(150), allowNull: true },
    content: { type: DataTypes.TEXT, allowNull: false },
    color: { type: DataTypes.STRING(20), allowNull: true },
    is_pinned: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    ref_type: { type: DataTypes.ENUM('none', 'word', 'reading', 'listening', 'test'), allowNull: false, defaultValue: 'none' },
    ref_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    ref_label: { type: DataTypes.STRING(255), allowNull: true }
  }, {
    tableName: 'user_notes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [{ name: 'idx_notes_user', fields: ['user_id', 'is_pinned', 'updated_at'] }]
  });

  UserNote.associate = (models) => {
    UserNote.belongsTo(models.User, { foreignKey: 'user_id', as: 'user', onDelete: 'CASCADE' });
  };
  return UserNote;
};
