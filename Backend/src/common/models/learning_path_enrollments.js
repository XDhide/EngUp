const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LearningPathEnrollment = sequelize.define('LearningPathEnrollment', {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    path_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    completed_at: { type: DataTypes.DATE, allowNull: true }
  }, {
    tableName: 'learning_path_enrollments',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [{ name: 'uq_path_enroll', unique: true, fields: ['user_id', 'path_id'] }]
  });

  LearningPathEnrollment.associate = (models) => {
    LearningPathEnrollment.belongsTo(models.User, { foreignKey: 'user_id', as: 'user', onDelete: 'CASCADE' });
  };
  return LearningPathEnrollment;
};
