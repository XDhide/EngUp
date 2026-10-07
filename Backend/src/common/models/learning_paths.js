const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LearningPath = sequelize.define('LearningPath', {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    title: { type: DataTypes.STRING(255), allowNull: false },
    description: { type: DataTypes.TEXT, allowNull: true },
    level: { type: DataTypes.STRING(10), allowNull: true },
    created_by: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    is_approved: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false }
  }, {
    tableName: 'learning_paths',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [{ name: 'idx_paths_approved', fields: ['is_approved', 'created_at'] }, { name: 'idx_paths_creator', fields: ['created_by'] }]
  });

  LearningPath.associate = (models) => {
    LearningPath.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator', onDelete: 'SET NULL' });
    LearningPath.hasMany(models.LearningPathItem, { foreignKey: 'path_id', as: 'items', onDelete: 'CASCADE' });
    LearningPath.hasMany(models.LearningPathEnrollment, { foreignKey: 'path_id', as: 'enrollments', onDelete: 'CASCADE' });
  };
  return LearningPath;
};
