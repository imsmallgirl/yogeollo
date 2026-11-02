export function formatKoreanDate(timestamp: string): string {
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeZone: "Asia/Seoul" }).format(new Date(timestamp));
}
