// Wall-clock helpers in Nam's time zone (Hanoi), shared by the live widgets.
export const TIME_ZONE = 'Asia/Ho_Chi_Minh';

const clockFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
const hourFmt = new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: 'numeric', hourCycle: 'h23' });

/** Date → '14:32:05' in Hanoi */
export const formatClock = (d) => clockFmt.format(d);

/** Date → 0‥23, the hour in Hanoi */
export const hourIn = (d) => Number(hourFmt.format(d));
