// src/common/models/admin_content_approval_queue.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AdminContentApprovalQueue = sequelize.define('AdminContentApprovalQueue', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    content_type: {
      type: DataTypes.ENUM('reading_article', 'test_question'),
      allowNull: false
    },
    content_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending'
    },
    reject_reason: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    reviewed_by: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: true
    },
    reviewed_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'admin_content_approval_queue',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        name: 'idx_queue_status',
        fields: ['status', 'content_type']
      }
    ]
  });

  AdminContentApprovalQueue.associate = (models) => {
    AdminContentApprovalQueue.belongsTo(models.User, {
      foreignKey: 'reviewed_by',
      as: 'reviewer',
      onDelete: 'SET NULL'
    });
  };

  return AdminContentApprovalQueue;
};

