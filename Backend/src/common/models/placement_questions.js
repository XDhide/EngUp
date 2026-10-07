const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PlacementQuestion = sequelize.define('PlacementQuestion', {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    level: { type: DataTypes.STRING(10), allowNull: false },
    question_text: { type: DataTypes.TEXT, allowNull: false },
    options: { type: DataTypes.JSON, allowNull: false },
    correct_option_id: { type: DataTypes.STRING(10), allowNull: false },
    order_index: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true }
  }, {
    tableName: 'placement_questions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [{ name: 'idx_placement_active', fields: ['is_active', 'order_index'] }]
  });
  return PlacementQuestion;
};
