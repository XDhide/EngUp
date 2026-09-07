// src/common/models/audit_logs.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    actor_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      comment: 'admin thực hiện hành động'
    },
    action: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: 'vd: user.status.update, content.approve...'
    },
    target_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'user, reading_article, test_question...'
    },
    target_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    detail: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'audit_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        name: 'idx_audit_actor_date',
        fields: ['actor_id', 'created_at']
      }
    ]
  });

  AuditLog.associate = (models) => {
    AuditLog.belongsTo(models.User, {
      foreignKey: 'actor_id',
      as: 'actor',
      onDelete: 'CASCADE'
    });
  };

  return AuditLog;
};

