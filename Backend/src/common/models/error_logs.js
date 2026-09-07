// src/common/models/error_logs.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ErrorLog = sequelize.define('ErrorLog', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    service: {
      type: DataTypes.ENUM('backend', 'ml-service'),
      allowNull: false
    },
    level: {
      type: DataTypes.ENUM('info', 'warning', 'error', 'critical'),
      allowNull: false,
      defaultValue: 'error'
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    stack_trace: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'error_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        name: 'idx_error_service_date',
        fields: ['service', 'created_at']
      }
    ]
  });

  return ErrorLog;
};

