export default function formatTimestamp(timestamp, showTime = false) {
  if (!timestamp) return "";

  // Nếu là dạng object (seconds / nanoseconds) thì convert
  if (typeof timestamp === "object") {
    const { seconds = 0, nanoseconds = 0 } = timestamp;
    timestamp = seconds * 1000 + nanoseconds / 1000000;
  }

  const date = new Date(timestamp);

  const dateOptions = { day: "numeric", month: "short", year: "numeric" };
  const timeOptions = { hour: "2-digit", minute: "2-digit", hour12: true };

  const formattedDate = date.toLocaleDateString("en-US", dateOptions); // "Apr 18, 2025"
  const formattedTime = date.toLocaleTimeString("en-US", timeOptions); // "01:14 PM"

  const day = date.getDate();
  const suffix =
    day >= 11 && day <= 13
      ? "th"
      : day % 10 === 1
      ? "st"
      : day % 10 === 2
      ? "nd"
      : day % 10 === 3
      ? "rd"
      : "th";

  // Thêm suffix vào ngày
  const finalDate = formattedDate.replace(/(\d+)/, `$1${suffix}`);

  return showTime ? `${finalDate} · ${formattedTime}` : finalDate;
}
