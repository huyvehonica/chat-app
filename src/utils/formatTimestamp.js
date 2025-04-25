const formatTimestamp = (timestamp) => {
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
