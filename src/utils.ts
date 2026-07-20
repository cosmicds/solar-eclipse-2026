export function toHMS(milliseconds: number): string {
  const seconds = milliseconds / 1000;
  let dur = '';
  const h = Math.floor(seconds / 3600);
  dur += h > 0 ? h + 'h' : '';
  const m = Math.floor(seconds % 3600 / 60);
  dur += m > 0 ? m + 'm' : '';
  const s = Math.floor(seconds % 3600 % 60);
  dur += s > 0 ? s + 's' : '';
  return dur;
}

export function spaceHMS(hms: string): string {
  // take a string like 0h0m0s to 0h 0m 0s
  return hms.replace(/(\d)([hms])/g, '$1$2 ');
}
