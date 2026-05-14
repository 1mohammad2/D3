export const VALID_GAME_DAYS = [0, 3, 5];
export const GAME_START_HOUR = 20;
export const GAME_START_MINUTE = 30;

export function isValidGameDate(value: Date) {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return false;
  }

  const day = value.getDay();
  const hours = value.getHours();
  const minutes = value.getMinutes();

  return VALID_GAME_DAYS.includes(day) && hours === GAME_START_HOUR && minutes === GAME_START_MINUTE;
}

export function getGameWindows(date: Date) {
  const openAt = new Date(date.getTime() - 30 * 60 * 60 * 1000);
  const closeAt = new Date(date.getTime() - 4 * 60 * 60 * 1000);
  return { openAt, closeAt };
}

export function formatDateTimeLocal(value: Date) {
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}T${pad(value.getHours())}:${pad(value.getMinutes())}`;
}
