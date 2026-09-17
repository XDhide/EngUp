// src/modules/admin-auth/admin-auth.model.js
// Model AuditLog do module Admin (admin-auth) sở hữu — ghi lại các hành động
// quản trị (đăng nhập admin, duyệt nội dung, thay đổi trạng thái user...).
// Đặt trong module theo đúng nguyên tắc module độc lập: bảng audit_logs là dữ
// liệu riêng của Admin, chỉ tham chiếu tới User (module Auth) qua khoá ngoại
// actor_id chứ không gọi thẳng service/DB của module Auth.
//
// Model vẫn được khởi tạo tập trung tại src/common/models/index.js (để dùng
// chung 1 instance Sequelize và tự động thiết lập association), nhưng định
// nghĩa (chủ sở hữu) nằm ở đây, trong module Admin.

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
      comment: 'vd: admin.login, user.status.update, content.approve...'
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
    // Chỉ tham chiếu tới User qua khoá ngoại actor_id (read-only join),
    // không gọi trực tiếp service của module Auth.
    AuditLog.belongsTo(models.User, {
      foreignKey: 'actor_id',
      as: 'actor',
      onDelete: 'CASCADE'
    });
  };

  return AuditLog;
};
