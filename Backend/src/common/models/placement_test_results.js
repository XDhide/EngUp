// src/common/models/placement_test_results.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PlacementTestResult = sequelize.define('PlacementTestResult', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    answers: {
      type: DataTypes.JSON,
      allowNull: false
    },
    suggested_level: {
      type: DataTypes.STRING(10),
      allowNull: false
    }
  }, {
    tableName: 'placement_test_results',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  PlacementTestResult.associate = (models) => {
    PlacementTestResult.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });
  };

  return PlacementTestResult;
};

