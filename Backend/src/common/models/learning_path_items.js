const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const LearningPathItem = sequelize.define('LearningPathItem', {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    path_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    item_type: { type: DataTypes.ENUM('word', 'reading', 'listening'), allowNull: false },
    item_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    order_index: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false, defaultValue: 0 }
  }, {
    tableName: 'learning_path_items',
    timestamps: false,
    indexes: [
      { name: 'idx_path_items_order', fields: ['path_id', 'order_index'] },
      { name: 'uq_path_item', unique: true, fields: ['path_id', 'item_type', 'item_id'] }
    ]
  });
  return LearningPathItem;
};
