import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toAr } from '../lib/digits.js'
import { PLACES, PRAYERS, nextPrayer, formatClock, formatCountdown, calendarDayIn } from '../lib/prayer.js'
import { FORMATS, formatHijri, gregorianLabel, hijriFor, nextGregorianOf } from '../lib/hijri.js'
import { IMAMS_SCHEDULE, isScheduleExpired } from '../data/imams.js'
import { OCCASIONS } from '../data/occasions.js'
import { GOALS, dayIndexFromStart, juzForDay, loadPlan, savePlan } from '../Khatmah.jsx'
import { SUNNAH_LIST, getTodayKey } from '../Sunnah.jsx'

const HIJRI_KEY = 'tilawat:hijri-settings'
const LOC_KEY = 'tilawat:visitor-loc'
const VISITOR_TZ = (() => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Riyadh' } catch { return 'Asia/Riyadh' } })()

function useNow(ms = 1000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => { const t = setInterval(() => setNow(new Date()), ms); return () => clearInterval(t) }, [ms])
  return now
}

/* ---------- إعدادات التاريخ الهجري (مشتركة بين بطاقة التاريخ والمناسبات) ---------- */
const hijriListeners = new Set()
function readHijriSettings() {
  try {
    const v = JSON.parse(localStorage.getItem(HIJRI_KEY))
    const offset = Number.isInteger(v?.offset) ? Math.max(-2, Math.min(2, v.offset)) : 0
    const format = FORMATS.some((f) => f.id === v?.format) ? v.format : 'full'
    return { offset, format }
  } catch { return { offset: 0, format: 'full' } }
}
function useHijriSettings() {
  const [settings, setSettings] = useState(readHijriSettings)
  useEffect(() => { const f = () => setSettings(readHijriSettings()); hijriListeners.add(f); return () => { hijriListeners.delete(f) } }, [])
  const update = useCallback((patch) => {
    try { localStorage.setItem(HIJRI_KEY, JSON.stringify({ ...readHijriSettings(), ...patch })) } catch { /* ignore */ }
    hijriListeners.forEach((f) => f())
  }, [])
  return [settings, update]
}

/* ---------- بطاقات مكدسة ---------- */
function CardStack({ items, label }) {
  const [idx, setIdx] = useState(0)
  const touchX = useRef(null)
  const n = items.length
  const move = (d) => setIdx((i) => (i + d + n) % n)
  const onEnd = (e) => {
    if (touchX.current == null) return
    const dx = e.changedTouches[0].clientX - touchX.current
    touchX.current = null
    if (Math.abs(dx) > 45) move(dx < 0 ? 1 : -1)
  }
  return <div className="stack" role="group" aria-label={label} onTouchStart={(e) => { touchX.current = e.touches[0].clientX }} onTouchEnd={onEnd}>
    <div className="stack-deck">
      {items.map((it, i) => {
        const d = (i - idx + n) % n
        return <div key={it.key} className={`stack-card depth-${Math.min(d, 3)}`} aria-hidden={d !== 0} inert={d !== 0}>{it.node}</div>
      })}
    </div>
    {n > 1 && <div className="stack-controls">
      <button className="stack-arrow" onClick={() => move(-1)} aria-label="السابق">›</button>
      <div className="stack-dots" aria-hidden="true">{items.map((it, i) => <span key={it.key} className={i === idx ? 'on' : ''} />)}</div>
      <button className="stack-arrow" onClick={() => move(1)} aria-label="التالي">‹</button>
    </div>}
  </div>
}

/* ---------- مواقيت الصلاة ---------- */
function PrayerCard({ title, place, tz, imams, dim }) {
  const now = useNow(1000)
  const next = nextPrayer(place, tz, now)
  const nextLabel = PRAYERS.find((p) => p.id === next.id).label
  return <article className="prayer-card">
    <h3>{title}</h3>
    <div className="prayer-next"><span>الصلاة القادمة</span><strong>{nextLabel}</strong><span className="prayer-clock">{formatClock(next.at, tz)}</span></div>
    <div className="prayer-count" dir="ltr">{toAr(formatCountdown(next.at - now))}</div>
    <ul className="prayer-list">
      {PRAYERS.map((p) => {
        const im = imams && imams[p.id]
        return <li key={p.id} className={p.id === next.id ? 'is-next' : ''}>
          <span className="p-name">{p.label}</span>
          <span className="p-time">{formatClock(next.times[p.id], tz)}</span>
          {im && <span className={`p-imam ${dim ? 'is-dim' : ''}`}><b>{im.main}</b><small>الاحتياطي: {im.backup}</small></span>}
        </li>
      })}
    </ul>
  </article>
}

async function fetchCity(lat, lon) {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), 8000)
  try {
    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=ar`, { signal: ctl.signal })
    if (!res.ok) return ''
    const j = await res.json()
    return j.city || j.locality || j.principalSubdivision || ''
  } catch { return '' } finally { clearTimeout(t) }
}

function useVisitorLocation() {
  const [loc, setLoc] = useState(() => {
    try { const v = JSON.parse(localStorage.getItem(LOC_KEY)); if (v && Number.isFinite(v.lat) && Number.isFinite(v.lon)) return { status: 'ready', ...v } } catch { /* ignore */ }
    return { status: 'idle' }
  })
  const request = useCallback(() => {
    if (!navigator.geolocation) { setLoc({ status: 'denied' }); return }
    setLoc((s) => ({ ...s, status: 'loading' }))
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const v = { lat: +pos.coords.latitude.toFixed(3), lon: +pos.coords.longitude.toFixed(3), city: '' }
        try { localStorage.setItem(LOC_KEY, JSON.stringify(v)) } catch { /* ignore */ }
        setLoc({ status: 'ready', ...v })
      },
      () => setLoc({ status: 'denied' }),
      { timeout: 15000, maximumAge: 3600000 },
    )
  }, [])
  useEffect(() => {
    if (loc.status !== 'idle' || !navigator.permissions?.query) return
    navigator.permissions.query({ name: 'geolocation' }).then((r) => { if (r.state === 'granted') request() }).catch(() => {})
  }, [loc.status, request])
  useEffect(() => {
    if (loc.status !== 'ready' || loc.city) return undefined
    let alive = true
    fetchCity(loc.lat, loc.lon).then((city) => {
      if (!alive || !city) return
      try { localStorage.setItem(LOC_KEY, JSON.stringify({ lat: loc.lat, lon: loc.lon, city })) } catch { /* ignore */ }
      setLoc((s) => ({ ...s, city }))
    })
    return () => { alive = false }
  }, [loc.status, loc.lat, loc.lon, loc.city])
  return [loc, request]
}

function VisitorCard({ loc, request }) {
  if (loc.status === 'ready') return <PrayerCard title={loc.city || 'موقعك'} place={{ lat: loc.lat, lon: loc.lon }} tz={VISITOR_TZ} />
  return <article className="prayer-card is-locked">
    <h3>موقعك</h3>
    <p className="locked-text">{loc.status === 'loading' ? 'جاري تحديد الموقع' : loc.status === 'denied' ? 'تعذّر تحديد موقعك' : 'فعّل الموقع لعرض مواقيت مدينتك'}</p>
    <button className="glass-btn" onClick={request} disabled={loc.status === 'loading'}>{loc.status === 'denied' ? 'إعادة المحاولة' : 'تفعيل الموقع'}</button>
  </article>
}

export function PrayerStack() {
  const [loc, request] = useVisitorLocation()
  const now = useNow(60000)
  const dim = isScheduleExpired(now)
  const items = [
    { key: 'visitor', node: <VisitorCard loc={loc} request={request} /> },
    { key: 'makkah', node: <PrayerCard title={PLACES.makkah.name} place={PLACES.makkah} tz={PLACES.makkah.tz} imams={IMAMS_SCHEDULE.makkah} dim={dim} /> },
    { key: 'madinah', node: <PrayerCard title={PLACES.madinah.name} place={PLACES.madinah} tz={PLACES.madinah.tz} imams={IMAMS_SCHEDULE.madinah} dim={dim} /> },
  ]
  return <section className="home-block"><CardStack items={items} label="مواقيت الصلاة" /></section>
}

/* ---------- التاريخ الهجري ---------- */
function GearIcon() {
  return <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>
}

const OFFSETS = [-2, -1, 0, 1, 2]
const offsetLabel = (o) => (o === 0 ? '٠' : `${o > 0 ? '+' : '−'}${toAr(Math.abs(o))}`)

export function HijriCard() {
  const now = useNow(30000)
  const [{ offset, format }, update] = useHijriSettings()
  const [open, setOpen] = useState(false)
  const [conv, setConv] = useState('')
  const day = calendarDayIn(VISITOR_TZ, now)
  const h = hijriFor(day.y, day.m, day.d, offset)
  let converted = null
  if (conv) { const [y, m, d] = conv.split('-').map(Number); if (y && m && d) converted = formatHijri(hijriFor(y, m, d, offset), format) }
  return <section className="home-block hijri-card">
    <div className="hijri-head">
      <div>
        <p className="hijri-main">{formatHijri(h, format)}</p>
        <p className="hijri-sub">{gregorianLabel(day)}</p>
      </div>
      <button className="glass-btn icon-btn" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label="إعدادات التاريخ الهجري" title="إعدادات التاريخ الهجري"><GearIcon /></button>
    </div>
    {open && <div className="hijri-settings">
      <div className="setting-row">
        <span>تصحيح التاريخ (بالأيام)</span>
        <div className="seg" role="group" aria-label="تصحيح التاريخ">
          {OFFSETS.map((o) => <button key={o} className={o === offset ? 'on' : ''} onClick={() => update({ offset: o })}>{offsetLabel(o)}</button>)}
        </div>
      </div>
      <div className="setting-row">
        <label htmlFor="hijri-format">صيغة العرض</label>
        <select id="hijri-format" value={format} onChange={(e) => update({ format: e.target.value })}>
          {FORMATS.map((f) => <option key={f.id} value={f.id}>{f.make(h)}</option>)}
        </select>
      </div>
      <div className="setting-row">
        <label htmlFor="hijri-conv">تحويل من ميلادي إلى هجري</label>
        <input id="hijri-conv" type="date" value={conv} onChange={(e) => setConv(e.target.value)} />
        {converted && <p className="conv-result">{converted}</p>}
      </div>
    </div>}
  </section>
}

/* ---------- المناسبات ---------- */
function daysLeftText(n) {
  if (n === 0) return 'اليوم'
  if (n === 1) return 'غدًا'
  if (n === 2) return 'بعد يومين'
  return `بعد ${toAr(n)} ${n <= 10 ? 'أيام' : 'يومًا'}`
}

export function OccasionsStack() {
  const now = useNow(60000)
  const [{ offset }] = useHijriSettings()
  const dayKey = (() => { const d = calendarDayIn(VISITOR_TZ, now); return `${d.y}-${d.m}-${d.d}` })()
  const list = useMemo(() => {
    const [y, m, d] = dayKey.split('-').map(Number)
    return OCCASIONS
      .map((o) => ({ o, next: nextGregorianOf(o.month, o.day, y, m, d, offset) }))
      .filter((x) => x.next)
      .sort((a, b) => a.next.daysLeft - b.next.daysLeft)
      .slice(0, 6)
  }, [dayKey, offset])
  const items = list.map(({ o, next }) => ({
    key: o.id,
    node: <article className="occasion-card">
      <div className="occasion-top"><h3>{o.title}</h3><span className="occasion-left">{daysLeftText(next.daysLeft)}</span></div>
      <p className="occasion-date">{gregorianLabel(next)}</p>
      <blockquote>«{o.text}»</blockquote>
      <p className="occasion-source">{o.source}</p>
    </article>,
  }))
  if (!items.length) return null
  return <section className="home-block"><h2 className="block-title">المناسبات</h2><CardStack items={items} label="المناسبات" /></section>
}

/* ---------- تابع الاستماع ---------- */
export function ContinueListening({ go, current, audioPosition }) {
  if (!audioPosition || audioPosition < 5) return null
  const s = Math.floor(audioPosition)
  const clock = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
  return <section className="home-block mini-card">
    <div><h2 className="block-title">تابع الاستماع</h2><p className="mini-main">{current.name}</p><p className="mini-sub">{current.title} — من {toAr(clock)}</p></div>
    <button className="glass-btn" onClick={() => go('/recitations')}>متابعة</button>
  </section>
}

/* ---------- وردك اليوم ---------- */
export function DailyWird({ go }) {
  const [plan, setPlan] = useState(() => loadPlan())
  if (!plan) {
    return <section className="home-block mini-card">
      <div><h2 className="block-title">وردك اليوم</h2><p className="mini-sub">لا توجد ختمة قائمة</p></div>
      <button className="glass-btn" onClick={() => go('/khatmah')}>بدء ختمة</button>
    </section>
  }
  const raw = dayIndexFromStart(plan.startDate, new Date())
  const dayIndex = Math.min(Math.max(raw, 1), plan.totalDays)
  const finished = raw > plan.totalDays
  const juz = juzForDay(dayIndex, plan.totalDays, plan.startJuz)
  const goal = GOALS.find((g) => g.id === plan.goal) || GOALS[0]
  const done = plan.completedDays.includes(dayIndex)
  const toggle = () => {
    const completedDays = done ? plan.completedDays.filter((d) => d !== dayIndex) : [...plan.completedDays, dayIndex]
    const next = { ...plan, completedDays }
    try { savePlan(next) } catch { return }
    setPlan(next)
  }
  return <section className="home-block mini-card">
    <div>
      <h2 className="block-title">وردك اليوم</h2>
      {finished
        ? <p className="mini-main">أتممت خطتك</p>
        : <><p className="mini-main">{juz.length ? `الجزء ${juz.map(toAr).join('، ')}` : 'لا يوجد ورد اليوم'}</p><p className="mini-sub">اليوم {toAr(dayIndex)} من {toAr(plan.totalDays)}</p></>}
    </div>
    <div className="mini-actions">
      {!finished && juz.length > 0 && <button className={`glass-btn ${done ? 'is-done' : ''}`} onClick={toggle} aria-pressed={done}>{done ? `✓ ${goal.verb}` : `تحديد كـ${goal.verb === 'قرأت' ? 'مقروء' : 'منجز'}`}</button>}
      <button className="glass-btn" onClick={() => go('/khatmah')}>الخطة</button>
    </div>
  </section>
}

/* ---------- سنن اليوم ---------- */
export function TodaySunnah({ go }) {
  const [done, setDone] = useState(() => { try { return JSON.parse(localStorage.getItem(getTodayKey())) || [] } catch { return [] } })
  const toggle = (id) => {
    const next = done.includes(id) ? done.filter((x) => x !== id) : [...done, id]
    try { localStorage.setItem(getTodayKey(), JSON.stringify(next)) } catch { return }
    setDone(next)
  }
  return <section className="home-block">
    <div className="block-head"><h2 className="block-title">سنن اليوم</h2><span className="mini-sub">{toAr(done.length)} من {toAr(SUNNAH_LIST.length)}</span></div>
    <ul className="sunnah-mini">
      {SUNNAH_LIST.map((s) => {
        const on = done.includes(s.id)
        return <li key={s.id}><button className={on ? 'on' : ''} onClick={() => toggle(s.id)} aria-pressed={on}><span className="tick" aria-hidden="true">{on ? '✓' : ''}</span><span>{s.title}</span></button></li>
      })}
    </ul>
    <button className="link-btn" onClick={() => go('/sunnah')}>كل السنن ←</button>
  </section>
}
