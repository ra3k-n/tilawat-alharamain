import { toAr } from './digits.js'

export const HIJRI_MONTHS = ['محرم', 'صفر', 'ربيع الأول', 'ربيع الآخر', 'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان', 'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة']
export const WEEKDAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']

// ست صيغ للعرض
export const FORMATS = [
  { id: 'full', label: 'اليوم والتاريخ كاملًا', make: (h) => `${h.weekday} ${toAr(h.day)} ${h.monthName} ${toAr(h.year)} هـ` },
  { id: 'dmy', label: 'اليوم والشهر والسنة', make: (h) => `${toAr(h.day)} ${h.monthName} ${toAr(h.year)} هـ` },
  { id: 'wdm', label: 'اليوم واسم الشهر', make: (h) => `${h.weekday} ${toAr(h.day)} ${h.monthName}` },
  { id: 'dm', label: 'اليوم والشهر فقط', make: (h) => `${toAr(h.day)} ${h.monthName}` },
  { id: 'num', label: 'أرقام: يوم/شهر/سنة', make: (h) => `${toAr(h.day)}/${toAr(h.month)}/${toAr(h.year)} هـ` },
  { id: 'numy', label: 'أرقام: سنة/شهر/يوم', make: (h) => `${toAr(h.year)}/${toAr(String(h.month).padStart(2, '0'))}/${toAr(String(h.day).padStart(2, '0'))} هـ` },
]

let fmt
function formatter() {
  if (fmt) return fmt
  for (const cal of ['islamic-umalqura', 'islamic-civil']) {
    try {
      fmt = new Intl.DateTimeFormat('en-u-ca-' + cal + '-nu-latn', { day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC' })
      return fmt
    } catch { /* try next */ }
  }
  throw new Error('no hijri calendar')
}

// يقبل تاريخًا ميلاديًا (سنة، شهر 1-12، يوم) ويرجع التاريخ الهجري بتقويم أم القرى، مع تصحيح بالأيام (-2..+2)
export function gregorianToHijri(y, m, d, offset = 0) {
  const base = new Date(Date.UTC(y, m - 1, d + offset, 12))
  const parts = formatter().formatToParts(base)
  const get = (t) => Number(parts.find((p) => p.type === t).value)
  const hy = get('year'), hm = get('month'), hd = get('day')
  return { year: hy, month: hm, day: hd, monthName: HIJRI_MONTHS[hm - 1] }
}

// اسم يوم الأسبوع يتبع التاريخ الميلادي الفعلي وليس التصحيح
export function hijriFor(y, m, d, offset = 0) {
  const h = gregorianToHijri(y, m, d, offset)
  h.weekday = WEEKDAYS[new Date(Date.UTC(y, m - 1, d, 12)).getUTCDay()]
  return h
}

export function formatHijri(h, formatId = 'full') {
  const f = FORMATS.find((x) => x.id === formatId) || FORMATS[0]
  return f.make(h)
}

// أول تاريخ ميلادي (ابتداءً من اليوم) يوافق شهرًا ويومًا هجريين؛ يبحث حتى ٤٠٠ يوم
export function nextGregorianOf(hMonth, hDay, fromY, fromM, fromD, offset = 0) {
  for (let i = 0; i <= 400; i++) {
    const dt = new Date(Date.UTC(fromY, fromM - 1, fromD + i, 12))
    const h = gregorianToHijri(dt.getUTCFullYear(), dt.getUTCMonth() + 1, dt.getUTCDate(), offset)
    if (h.month === hMonth && h.day === hDay) return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate(), daysLeft: i }
  }
  return null
}

export function gregorianLabel({ y, m, d }) {
  const dt = new Date(Date.UTC(y, m - 1, d, 12))
  return new Intl.DateTimeFormat('ar-SA-u-ca-gregory-nu-arab', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(dt)
}
