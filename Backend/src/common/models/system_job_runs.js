const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SystemJobRun = sequelize.define('SystemJobRun', {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    job_name: { type: DataTypes.STRING(60), allowNull: false },
    trigger: { type: DataTypes.ENUM('cron', 'manual'), allowNull: false, defaultValue: 'cron' },
    status: { type: DataTypes.ENUM('success', 'partial', 'failed'), allowNull: false },
    target_date: { type: DataTypes.DATEONLY, allowNull: true },
    summary: { type: DataTypes.JSON, allowNull: true },
    error_message: { type: DataTypes.TEXT, allowNull: true },
    duration_ms: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true }
  }, {
    tableName: 'system_job_runs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [{ name: 'idx_job_runs_name_date', fields: ['job_name', 'created_at'] }]
  });
  return SystemJobRun;
};
