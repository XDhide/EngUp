const { DataTypes } = require('sequelize');

// Ba bảng do module admin-dashboard SỞ HỮU:
//   - notification_templates : mẫu thông báo (module notifications chỉ đọc để dựng nội dung)
//   - subscription_plans     : gói cước (tương lai)
//   - subscriptions          : đăng ký gói của người dùng (tương lai)
// Trả về một object các model để common/models/index.js gắn vào `db`.
module.exports = (sequelize) => {
  const NotificationTemplate = sequelize.define('NotificationTemplate', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    title_template: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    body_template: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false
    }
  }, {
    tableName: 'notification_templates',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  const SubscriptionPlan = sequelize.define('SubscriptionPlan', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false
    },
    duration_days: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false
    },
    features: {
      type: DataTypes.JSON,
      allowNull: true
    }
  }, {
    tableName: 'subscription_plans',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false
  });

  const Subscription = sequelize.define('Subscription', {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    plan_id: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('active', 'expired', 'cancelled'),
      allowNull: false,
      defaultValue: 'active'
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    }
  }, {
    tableName: 'subscriptions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      {
        name: 'idx_subscription_user_status',
        fields: ['user_id', 'status']
      }
    ]
  });

  SubscriptionPlan.hasMany(Subscription, {
    foreignKey: 'plan_id',
    as: 'subscriptions',
    onDelete: 'CASCADE'
  });

  Subscription.associate = (models) => {
    Subscription.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user',
      onDelete: 'CASCADE'
    });
  };

  Subscription.belongsTo(SubscriptionPlan, {
    foreignKey: 'plan_id',
    as: 'plan',
    onDelete: 'CASCADE'
  });

  return { NotificationTemplate, SubscriptionPlan, Subscription };
};
