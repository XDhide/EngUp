function toTemplateDto(template) {
  return {
    id: template.id,
    name: template.name,
    title_template: template.title_template,
    body_template: template.body_template,
    type: template.type,
    created_at: template.created_at
  };
}

function toSentNotificationDto(notification) {
  return {
    id: notification.id,
    user_id: Number(notification.user_id),
    title: notification.title,
    body: notification.body,
    type: notification.type,
    is_read: Boolean(notification.is_read),
    created_at: notification.created_at
  };
}

function toRecentErrorDto(log) {
  return {
    service: log.service,
    level: log.level,
    message: log.message,
    created_at: log.created_at
  };
}

// price là DECIMAL nên MySQL trả về chuỗi ("199000.00") -> ép sang number.
function toPlanDto(plan) {
  return {
    id: plan.id,
    name: plan.name,
    price: Number(plan.price),
    duration_days: plan.duration_days,
    // `?? null`: bản ghi vừa create() chưa có cột không gửi lên -> luôn trả đủ key như khi đọc từ DB.
    features: plan.features ?? null,
    created_at: plan.created_at
  };
}

function toSubscriptionDto(subscription) {
  return {
    id: subscription.id,
    user_id: Number(subscription.user_id),
    plan_id: Number(subscription.plan_id),
    status: subscription.status,
    start_date: subscription.start_date,
    end_date: subscription.end_date,
    created_at: subscription.created_at
  };
}

module.exports = {
  toTemplateDto,
  toSentNotificationDto,
  toRecentErrorDto,
  toPlanDto,
  toSubscriptionDto
};
