const MONTHS = [
  "января",
  "февраля",
  "марта",
  "апреля",
  "мая",
  "июня",
  "июля",
  "августа",
  "сентября",
  "октября",
  "ноября",
  "декабря",
];

export function formatEventDateRu(isoOrSql: string): string {
  if (!isoOrSql) return "";
  const raw = isoOrSql.trim();
  const sqlLike = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(raw);
  const normalized = sqlLike ? `${raw.replace(" ", "T")}Z` : raw;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return "";
  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${day} ${month} ${year} г. ${hours}:${minutes}`;
}
