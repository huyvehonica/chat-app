const formatTimestamp = (timestamp, isLastSeen = false) => {
  if (!timestamp) return "";

  let timeValue;

  if (typeof timestamp === "number") {
    timeValue = new Date(timestamp);
  } else if (
    timestamp.seconds !== undefined &&
    timestamp.nanoseconds !== undefined
  ) {
    timeValue = new Date(
      timestamp.seconds * 1000 + timestamp.nanoseconds / 1e6
    );
  } else {
    return "";
  }

  const now = new Date();
  const diffMs = now - timeValue;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // Nếu là last seen, hiển thị dạng "Last seen X time ago"
  if (isLastSeen) {
    if (diffMinutes < 1) {
      return "Vừa mới truy cập";
    } else if (diffMinutes < 60) {
      return `Truy cập ${diffMinutes} phút trước`;
    } else if (diffHours < 24) {
      return `Truy cập ${diffHours} giờ trước`;
    } else if (diffDays < 7) {
      return `Truy cập ${diffDays} ngày trước`;
    } else {
      return `Truy cập ngày ${timeValue.toLocaleDateString()}`;
    }
  }

  // Định dạng thời gian bình thường cho tin nhắn
  const isSameDay =
    timeValue.getFullYear() === now.getFullYear() &&
    timeValue.getMonth() === now.getMonth() &&
    timeValue.getDate() === now.getDate();

  if (isSameDay) {
    return timeValue.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else {
    return timeValue.toLocaleDateString();
  }
};

export default formatTimestamp;
