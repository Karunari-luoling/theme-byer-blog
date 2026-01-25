/**
 * 格式化时间为相对时间
 */
export const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes}分钟前`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}小时前`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}天前`;
  if (days < 30) return `${Math.floor(days / 7)}周前`;
  if (days < 365) return `${Math.floor(days / 30)}个月前`;

  return date.toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric"
  });
};

/**
 * 格式化时间为完整时间
 */
export const formatFullTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
};

/**
 * 获取通知类型标签文字
 */
export const getNotificationTypeText = (type: string) => {
  switch (type) {
    case "COMMENT":
      return "评论消息";
    case "PURCHASE":
      return "购买通知";
    case "MEMBERSHIP":
      return "会员服务";
    case "SYSTEM":
      return "系统通知";
    default:
      return "通知";
  }
};
