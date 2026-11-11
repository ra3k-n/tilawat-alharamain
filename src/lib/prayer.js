import { Coordinates, CalculationMethod, PrayerTimes, Rounding } from 'adhan'

export const PLACES = {
  makkah: { key: 'makkah', name: 'مكة المكرمة', lat: 21.4225, lon: 39.8262, tz: 'Asia/Riyadh' },
  madinah: { key: 'madinah', name: 'المدينة المنورة', lat: 24.4672, lon: 39.6111, tz: 'Asia/Riyadh' },
}
export const PRAYERS = [
  { id: 'fajr', label: 'الفجر' },
  { id: 'sunrise', label: 'الشروق' },
  { id: 'dhuhr', label: 'الظهر' },
  { id: 'asr', label: 'العصر' },
  { id: 'maghrib', label: 'المغرب' },
  { id: 'isha', label: 'العشاء' },
]
const MIN = 60000
// الفجر والظهر والعصر والمغرب والعشاء تُقرّب لأعلى، والشروق لأسفل
const ceilMin = (d) => new Date(Math.ceil(d.getTime() / MIN) * MIN)
const floorMin = (d) => new Date(Math.floor(d.getTime() / MIN) * MIN)

// تاريخ "اليوم" كما هو في منطقة المكان (وليس منطقة جهاز الزائر)
export function calendarDayIn(tz, at = new Date()) {
  const p = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(at)
  const g = (t) => Number(p.find((x) => x.type === t).value)
  return { y: g('year'), m: g('month'), d: g('day') }
}

export function timesFor({ lat, lon }, { y, m, d }) {
  const params = CalculationMethod.UmmAlQura()
  params.rounding = Rounding.None
  const pt = new PrayerTimes(new Coordinates(lat, lon), new Date(y, m - 1, d), params)
  return {
    fajr: ceilMin(pt.fajr), sunrise: floorMin(pt.sunrise), dhuhr: ceilMin(pt.dhuhr),
    asr: ceilMin(pt.asr), maghrib: ceilMin(pt.maghrib), isha: ceilMin(pt.isha),
  }
}

// الصلاة القادمة من الخمس (الشروق ليس صلاة)، وبعد العشاء فجر الغد
export function nextPrayer(place, tz, now = new Date()) {
  const day = calendarDayIn(tz, now)
  const today = timesFor(place, day)
  for (const id of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']) {
    if (today[id] > now) return { id, at: today[id], times: today }
  }
  const tmr = new Date(Date.UTC(day.y, day.m - 1, day.d + 1))
  const t2 = timesFor(place, { y: tmr.getUTCFullYear(), m: tmr.getUTCMonth() + 1, d: tmr.getUTCDate() })
  return { id: 'fajr', at: t2.fajr, times: today }
}

export function formatClock(date, tz) {
  return new Intl.DateTimeFormat('ar-SA-u-nu-arab', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: tz }).format(date)
}
export function formatCountdown(ms) {
  const s = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(s / 3600), mi = Math.floor((s % 3600) / 60), se = s % 60
  const p = (n) => String(n).padStart(2, '0')
  return `${p(h)}:${p(mi)}:${p(se)}`
}
