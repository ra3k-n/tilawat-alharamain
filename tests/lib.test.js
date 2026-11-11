import test from 'node:test'
import assert from 'node:assert/strict'
import { hijriFor, formatHijri, nextGregorianOf, FORMATS } from '../src/lib/hijri.js'
import { timesFor, PLACES, formatClock, nextPrayer, formatCountdown } from '../src/lib/prayer.js'
import { isScheduleExpired, IMAMS_SCHEDULE } from '../src/data/imams.js'
import { OCCASIONS } from '../src/data/occasions.js'

test('hijri: 10 Nov 2026 = 30 Jumada I 1448 (Umm al-Qura)', () => {
  const h = hijriFor(2026, 11, 10)
  assert.deepEqual([h.year, h.month, h.day], [1448, 5, 30])
  assert.equal(h.weekday, 'الثلاثاء')
})
test('hijri: next day is 1 Jumada II, and the offset shifts the date', () => {
  assert.deepEqual(Object.values(hijriFor(2026, 11, 11)).slice(0, 3), [1448, 6, 1])
  assert.equal(hijriFor(2026, 11, 10, 1).month, 6)
  assert.equal(hijriFor(2026, 11, 10, -2).day, 28)
})
test('hijri: six formats all render', () => {
  assert.equal(FORMATS.length, 6)
  const h = hijriFor(2026, 11, 10)
  for (const f of FORMATS) assert.ok(formatHijri(h, f.id).length > 3)
  assert.equal(formatHijri(h, 'full'), 'الثلاثاء ٣٠ جمادى الأولى ١٤٤٨ هـ')
})
test('hijri: occasion lookup finds Ramadan 1449 start', () => {
  const r = nextGregorianOf(9, 1, 2026, 11, 10)
  assert.ok(r && r.y === 2027 && r.m >= 2)
})
test('prayer: rounding rules (up for 5 prayers, down for sunrise)', () => {
  const t = timesFor(PLACES.makkah, { y: 2026, m: 11, d: 10 })
  for (const k of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'sunrise']) assert.equal(t[k].getTime() % 60000, 0, k)
  const order = ['fajr', 'sunrise', 'dhuhr', 'asr', 'maghrib', 'isha'].map((k) => t[k].getTime())
  assert.deepEqual(order, [...order].sort((a, b) => a - b))
})
test('prayer: Makkah isha is 90 minutes after maghrib (Umm al-Qura)', () => {
  const t = timesFor(PLACES.makkah, { y: 2026, m: 11, d: 10 })
  assert.equal((t.isha - t.maghrib) / 60000, 90)
})
test('prayer: next prayer & wrap to tomorrow fajr', () => {
  const late = new Date('2026-11-10T23:00:00+03:00')
  const n = nextPrayer(PLACES.makkah, 'Asia/Riyadh', late)
  assert.equal(n.id, 'fajr')
  assert.ok(n.at > late)
  assert.equal(nextPrayer(PLACES.makkah, 'Asia/Riyadh', new Date('2026-11-10T12:00:00+03:00')).id, 'dhuhr')
})
test('prayer: clock and countdown formatting', () => {
  assert.equal(formatCountdown(3661000), '01:01:01')
  assert.match(formatClock(new Date('2026-11-10T05:03:00+03:00'), 'Asia/Riyadh'), /^٥:٠٣/)
})
test('imams: expiry at end of Saturday 14 Nov (Riyadh)', () => {
  assert.equal(isScheduleExpired(new Date('2026-11-14T23:00:00+03:00')), false)
  assert.equal(isScheduleExpired(new Date('2026-11-15T00:01:00+03:00')), true)
  for (const place of ['makkah', 'madinah']) for (const p of ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha']) {
    assert.ok(IMAMS_SCHEDULE[place][p].main && IMAMS_SCHEDULE[place][p].backup)
  }
})
test('occasions: every entry is complete and flagged draft', () => {
  for (const o of OCCASIONS) assert.ok(o.title && o.text && o.source && o.draft === true && o.month >= 1 && o.day >= 1)
})
