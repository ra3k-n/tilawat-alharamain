import { useEffect, useMemo, useRef, useState } from 'react'
import { SunnahPage } from './Sunnah'
import { KhatmahPage } from './Khatmah'
import './App.css'

const STORAGE = { route: 'tilawat:last-route', theme: 'tilawat:theme', sheikh: 'tilawat:selected-sheikh', audio: 'tilawat:audio-position' }

const routeLabels = {
  '/': 'الرئيسية', '/recitations': 'التلاوات', '/fourud': 'الفروض', '/quran': 'مصحف', '/khatmah': 'خطة الختمة',
  '/hadith': 'الأحاديث النبوية', '/prophets': 'قصص الأنبياء عليهم السلام', '/adhkar': 'الأذكار', '/adhkar/morning': 'أذكار الصباح', '/adhkar/evening': 'أذكار المساء', '/duas': 'الأدعية',
  '/seerah': 'السيرة النبوية', '/sources': 'المصادر والتخريج', '/sunnah': 'سنن النبي', '/about': 'من نحن', '/about/options': 'الخيارات',
}

const sheikhsData = [
  { name: 'الشيخ ياسر الدوسري', title: 'صلاة المغرب — 18 محرم 1448 هـ', surah: 'سورة الكهف 107 - 110، سورة مريم 96 - 98', location: 'المسجد الحرام', audioSrc: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663960426511/NYHfkEdjTzaUAdcT.mp3' },
  { name: 'الشيخ فيصل غزاوي', title: 'صلاة المغرب — 2 ربيع الآخر 1448 هـ', surah: 'سورتي الكوثر والنصر', location: 'المسجد الحرام', audioSrc: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663960426511/WuXffcYMfFZTTDoW.mp3' },
  { name: 'الشيخ الوليد الشمسان', title: 'صلاة الفجر — 1 شعبان 1447 هـ', surah: 'سورة القصص، من الآية 76 إلى 88', location: 'المسجد الحرام', audioSrc: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663960426511/bWIptAoginZcHYqQ.mp3' },
]

const YT_API_KEY = 'AIzaSyBegsgvawpMrieT7BQJ0tpfSbRDne2wNeU'
const PLAYLISTS = { makkah: 'PLaMyTUHy7DDY', madinah: 'PLA0-IhTilBDQ' }

const SOCIAL_LINKS = [
  { key: 'tiktok', label: 'تيك توك', url: 'https://www.tiktok.com/@tilawat_2.h' },
  { key: 'youtube', label: 'يوتيوب', url: 'https://www.youtube.com/@tilawat_2.h' },
  { key: 'instagram', label: 'إنستقرام', url: 'https://www.instagram.com/tilawat_2.h' },
  { key: 'x', label: 'إكس', url: 'https://x.com/tilawat_2_h' },
  { key: 'telegram', label: 'تيليجرام', url: 'https://t.me/Tilawat_2_h' },
  { key: 'facebook', label: 'فيسبوك', url: 'https://www.facebook.com/tilawat.2.h' },
]

const ABOUT_OPTIONS = [
  { title: 'الأحاديث النبوية', text: 'أحاديث موثقة من السنة النبوية', path: '/hadith' },
  { title: 'قصص الأنبياء', text: 'العبرة والعظة من سيرهم عليهم السلام', path: '/prophets' },
  { title: 'أذكار وأدعية', text: 'أذكار الصباح والمساء والأدعية', path: '/adhkar' },
  { title: 'سنن النبي ﷺ', text: 'تابع سننك اليومية', path: '/sunnah' },
]

// nav tree: 'link' items navigate directly, 'expandable' items reveal their children in-place
const NAV_TREE = [
  { type: 'link', path: '/', label: 'الرئيسية' },
  { type: 'expandable', key: 'recitations', label: 'التلاوات', children: [
    { type: 'link', path: '/recitations', label: 'تلاوات خاشعة' },
    { type: 'link', path: '/fourud', label: 'الفروض' },
  ] },
  { type: 'expandable', key: 'quran', label: 'مصحف', children: [
    { type: 'link', path: '/quran', label: 'فتح المصحف' },
    { type: 'link', path: '/khatmah', label: 'بدء ختمة' },
  ] },
  { type: 'link', path: '/hadith', label: 'الأحاديث النبوية' },
  { type: 'link', path: '/prophets', label: 'قصص الأنبياء' },
  { type: 'expandable', key: 'adhkar-root', label: 'أذكار وغيره', children: [
    { type: 'expandable', key: 'adhkar-sub', label: 'الأذكار', children: [
      { type: 'link', path: '/adhkar/morning', label: 'أذكار الصباح' },
      { type: 'link', path: '/adhkar/evening', label: 'أذكار المساء' },
      { type: 'link', path: '/adhkar', label: 'كل الأذكار' },
    ] },
    { type: 'link', path: '/duas', label: 'الأدعية' },
  ] },
  { type: 'link', path: '/sunnah', label: 'سنن النبي' },
]

function flattenPaths(item) {
  if (item.type === 'link') return [item.path]
  return item.children.flatMap(flattenPaths)
}

function getStored(key, fallback = '') { try { return localStorage.getItem(key) || fallback } catch { return fallback } }
function readRoute() { const path = window.location.pathname; return routeLabels[path] ? path : getStored(STORAGE.route, '/') }
function navigate(path) { window.history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')) }

async function fetchLatestFromPlaylist(playlistId) {
  const url = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${playlistId}&key=${YT_API_KEY}`
  const res = await fetch(url)
  if (!res.ok) throw new Error('yt fetch failed')
  const data = await res.json()
  const items = (data.items || []).filter((it) => it.snippet && it.snippet.resourceId)
  if (!items.length) return null
  const latest = items.reduce((a, b) => (new Date(a.snippet.publishedAt) > new Date(b.snippet.publishedAt) ? a : b))
  const thumb = latest.snippet.thumbnails || {}
  return { videoId: latest.snippet.resourceId.videoId, title: latest.snippet.title, thumbnail: (thumb.medium || thumb.default || {}).url || '' }
}

// ---- real search index: nav pages + sheikh names + sunnah items ----
const SUNNAH_NAMES = ['التبكير إلى صلاة الجمعة', 'صلاة الضحى', 'قراءة سورة الكهف يوم الجمعة', 'الوتر قبل النوم', 'أذكار الصباح والمساء']
function buildSearchIndex() {
  const pages = Object.entries(routeLabels).map(([path, label]) => ({ title: label, path, kind: 'صفحة' }))
  const sheikhs = sheikhsData.map((s) => ({ title: s.name, path: '/recitations', kind: 'شيخ' }))
  const sunnahs = SUNNAH_NAMES.map((n) => ({ title: n, path: '/sunnah', kind: 'سنة' }))
  return [...pages, ...sheikhs, ...sunnahs]
}
// match regardless of diacritics and common letter variants (أ/إ/آ, ة/ه, ى/ي)
function normalizeArabic(text) {
  return text
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .toLowerCase()
}
const SEARCH_INDEX = buildSearchIndex()

export default function App() {
  const [route, setRoute] = useState(readRoute)
  const [theme, setTheme] = useState(() => getStored(STORAGE.theme, '') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'))
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isSheikhOpen, setIsSheikhOpen] = useState(false)
  const [expanded, setExpanded] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [selectedSheikh, setSelectedSheikh] = useState(() => getStored(STORAGE.sheikh, sheikhsData[0].name))
  const [audioPosition, setAudioPosition] = useState(() => Number(getStored(STORAGE.audio, '0')) || 0)
  const audioRef = useRef(null)
  const sheikhMenuRef = useRef(null)
  const navMenuRef = useRef(null)
  const searchRef = useRef(null)
  const currentRecitation = useMemo(() => sheikhsData.find((s) => s.name === selectedSheikh) || sheikhsData[0], [selectedSheikh])

  useEffect(() => { const onPop = () => setRoute(readRoute()); window.addEventListener('popstate', onPop); return () => window.removeEventListener('popstate', onPop) }, [])
  useEffect(() => {
    localStorage.setItem(STORAGE.route, route)
    localStorage.setItem(STORAGE.theme, theme)
    document.documentElement.dataset.theme = theme
  }, [route, theme])
  useEffect(() => { localStorage.setItem(STORAGE.sheikh, selectedSheikh) }, [selectedSheikh])
  useEffect(() => { const audio = audioRef.current; if (!audio) return; const restore = () => { if (audioPosition > 0 && audioPosition < audio.duration) audio.currentTime = audioPosition }; audio.addEventListener('loadedmetadata', restore); return () => audio.removeEventListener('loadedmetadata', restore) }, [currentRecitation.audioSrc, audioPosition])
  useEffect(() => {
    if (!isSheikhOpen && !isDropdownOpen && !searchFocused) return undefined
    const handleOutside = (event) => {
      if (isSheikhOpen && sheikhMenuRef.current && !sheikhMenuRef.current.contains(event.target)) setIsSheikhOpen(false)
      if (isDropdownOpen && navMenuRef.current && !navMenuRef.current.contains(event.target)) setIsDropdownOpen(false)
      if (searchFocused && searchRef.current && !searchRef.current.contains(event.target)) setSearchFocused(false)
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [isSheikhOpen, isDropdownOpen, searchFocused])
  useEffect(() => {
    if (!isDropdownOpen) return undefined
    const onKey = (event) => { if (event.key === 'Escape') setIsDropdownOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isDropdownOpen])

  const go = (path) => { setIsDropdownOpen(false); setIsSheikhOpen(false); setExpanded({}); setSearchQuery(''); setSearchFocused(false); navigate(path) }
  const goHome = (e) => { e.preventDefault(); go('/') }
  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  const toggleExpanded = (key) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))
  const saveAudio = () => { const position = audioRef.current?.currentTime || 0; setAudioPosition(position); localStorage.setItem(STORAGE.audio, String(position)) }

  const searchResults = useMemo(() => {
    const q = normalizeArabic(searchQuery.trim())
    if (!q) return []
    return SEARCH_INDEX.filter((item) => normalizeArabic(item.title).includes(q)).slice(0, 8)
  }, [searchQuery])

  return <div dir="rtl" className="site-shell">
    <header className="topbar"><div className="topbar-inner">
      <a className="brand" href="/" onClick={goHome} aria-label="العودة إلى الرئيسية" title="العودة إلى الرئيسية"><img className="brand-logo" src="/tilawat-haramain-emblem.png" alt="تلاوات الحرمين" draggable="false" /></a>
      <div className="header-actions">
        <div className="search-wrap" ref={searchRef}>
          <svg className="search-icon-glyph" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.2" y2="16.2" /></svg>
          <input type="text" className="search-input" placeholder="بحث..." value={searchQuery} onFocus={() => setSearchFocused(true)} onChange={(e) => setSearchQuery(e.target.value)} title="بحث بالموقع" />
          {searchFocused && searchQuery.trim() && (
            <div className="search-results">
              {searchResults.length === 0
                ? <div className="search-empty">لا نتائج لـ"{searchQuery}"</div>
                : searchResults.map((r, i) => <button key={i} onClick={() => go(r.path)}><span>{r.title}</span><small>{r.kind}</small></button>)}
            </div>
          )}
        </div>
        <button className="theme-toggle" onClick={toggleTheme} title={theme === 'dark' ? 'التبديل إلى المظهر الفاتح' : 'التبديل إلى المظهر الداكن'} aria-label="تبديل المظهر">
          <span className={`theme-switch-icon ${theme}`} aria-hidden="true"><span className="theme-switch-circle" /></span>
          <span className="theme-switch-label">المظهر {theme === 'dark' ? 'الداكن' : 'الفاتح'}</span>
        </button>
        <button className="mobile-menu" onClick={() => setIsDropdownOpen((v) => !v)} aria-label="فتح القائمة" title="فتح القائمة" aria-expanded={isDropdownOpen}>☰</button>
      </div>
    </div>
      <div className={`nav-drawer-overlay ${isDropdownOpen ? 'open' : ''}`} onClick={() => setIsDropdownOpen(false)}>
        <nav className={`main-nav ${isDropdownOpen ? 'nav-open' : ''}`} ref={navMenuRef} aria-label="التنقل الرئيسي" onClick={(e) => e.stopPropagation()}>
          <div className="main-nav-header"><button className="main-nav-close" onClick={() => setIsDropdownOpen(false)} aria-label="إغلاق القائمة" title="إغلاق القائمة">✕</button><span>القائمة</span></div>
          {NAV_TREE.map((item) => <NavItem key={item.key || item.path} item={item} route={route} go={go} expanded={expanded} onToggle={toggleExpanded} />)}
        </nav>
      </div>
    </header>
    <main className="main-content">
      {route === '/' && <Home go={go} />}
      {route === '/recitations' && <Recitations current={currentRecitation} selected={selectedSheikh} setSelected={setSelectedSheikh} open={isSheikhOpen} setOpen={setIsSheikhOpen} menuRef={sheikhMenuRef} audioRef={audioRef} onTime={saveAudio} />}
      {route === '/fourud' && <FourudPage />}
      {route === '/sunnah' && <SunnahPage />}
      {route === '/khatmah' && <KhatmahPage />}
      {route === '/about' && <About go={go} />}
      {route === '/about/options' && <AboutOptions go={go} />}
      {['/quran', '/hadith', '/prophets', '/adhkar', '/adhkar/morning', '/adhkar/evening', '/duas', '/seerah', '/sources'].includes(route) && <ComingSoon route={route} />}
    </main>
    <footer className="footer">
      <div className="connect-row" aria-label="روابط التواصل الاجتماعي">{SOCIAL_LINKS.map((s) => <a key={s.key} className="platform-icon" href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label} title={s.label}><PlatformGlyph type={s.key} /></a>)}</div>
      <div className="footer-links"><button onClick={() => go('/about')} title="صفحة من نحن">من نحن</button></div>
      <div className="footer-bottom"><span>© 2026 تلاوات الحرمين — جميع الحقوق محفوظة</span></div>
    </footer>
  </div>
}

function NavItem({ item, route, go, expanded, onToggle }) {
  if (item.type === 'link') {
    return <button className={route === item.path ? 'active' : ''} onClick={() => go(item.path)}>{item.label}</button>
  }
  const isOpen = !!expanded[item.key]
  const isActive = flattenPaths(item).includes(route)
  return <>
    <button className={`nav-expandable ${isOpen ? 'open' : ''} ${isActive ? 'active' : ''}`} onClick={() => onToggle(item.key)} aria-expanded={isOpen}>{item.label}<span className="nav-chevron">‹</span></button>
    {isOpen && <div className="nav-submenu">{item.children.map((child) => <NavItem key={child.key || child.path} item={child} route={route} go={go} expanded={expanded} onToggle={onToggle} />)}</div>}
  </>
}

function Home({ go }) {
  return <section className="home-page">
    <div className="hero-card">
      <span className="eyebrow">رفيقك اليومي إلى الحرمين</span>
      <h1>كل ما تحتاجه من <em>نور الحرمين</em>، بصوت واحد</h1>
      <p>تلاوات خاشعة، خطة ختمة تناسبك، وسنن نبوية تتابعها يوميًا — في مكان واحد موثوق.</p>
      <div className="hero-actions">
        <button className="primary-btn" onClick={() => go('/recitations')}>استمع الآن</button>
        <button className="secondary-btn" onClick={() => go('/khatmah')}>ابدأ ختمتك</button>
      </div>
    </div>
    <section className="stats-section">
      <div className="stats-grid">
        <div className="stat-item"><strong>{sheikhsData.length}</strong><span>مشايخ تلاوة</span></div>
        <div className="stat-item"><strong>٢</strong><span>الحرمين الشريفين</span></div>
        <div className="stat-item"><strong>٣٠</strong><span>جزءًا في كل ختمة</span></div>
        <div className="stat-item"><strong>يوميًا</strong><span>محتوى متجدد</span></div>
      </div>
    </section>
    <section className="final-cta">
      <h2>ابدأ رحلتك الإيمانية <em>اليوم</em></h2>
      <p>استمع لأجمل التلاوات من الحرمين الشريفين الآن</p>
      <button className="primary-btn" onClick={() => go('/recitations')}>استمع إلى التلاوات</button>
    </section>
  </section>
}

function LatestRecitations() {
  const [makkah, setMakkah] = useState(null)
  const [madinah, setMadinah] = useState(null)
  useEffect(() => {
    let alive = true
    fetchLatestFromPlaylist(PLAYLISTS.makkah).then((v) => { if (alive) setMakkah(v || false) }).catch(() => { if (alive) setMakkah(false) })
    fetchLatestFromPlaylist(PLAYLISTS.madinah).then((v) => { if (alive) setMadinah(v || false) }).catch(() => { if (alive) setMadinah(false) })
    return () => { alive = false }
  }, [])
  const cards = [
    { key: 'makkah', label: 'الحرم المكي', data: makkah, playlistUrl: `https://www.youtube.com/playlist?list=${PLAYLISTS.makkah}` },
    { key: 'madinah', label: 'الحرم المدني', data: madinah, playlistUrl: `https://www.youtube.com/playlist?list=${PLAYLISTS.madinah}` },
  ]
  return <div className="yt-grid">
    {cards.map((c) => {
      const loading = c.data === null
      const failed = c.data === false
      const videoUrl = c.data ? `https://www.youtube.com/watch?v=${c.data.videoId}` : c.playlistUrl
      return <div key={c.key} className="yt-card">
        <a className="yt-thumb-link" href={videoUrl} target="_blank" rel="noopener noreferrer" aria-label={c.label} title={c.label}>
          <div className="yt-thumb">
            {c.data && c.data.thumbnail ? <img src={c.data.thumbnail} alt={c.data.title} loading="lazy" /> : <div className="yt-thumb-placeholder" />}
            <span className="yt-play">▶</span>
            {!loading && !failed && <span className="yt-badge">جديد</span>}
          </div>
        </a>
        <div className="yt-info">
          <h3>{c.label}</h3>
          <p>{loading ? 'جاري التحميل...' : failed ? 'تصفح القناة' : c.data.title}</p>
          <a className="yt-all-link" href={c.playlistUrl} target="_blank" rel="noopener noreferrer">كل التلاوات ←</a>
        </div>
      </div>
    })}
  </div>
}

function FourudPage() {
  const tiktok = SOCIAL_LINKS.find((s) => s.key === 'tiktok')
  return <section className="fourud-page">
    <div className="section-heading"><span className="eyebrow">من قناتنا على يوتيوب</span><h1>آخر <em>تلاوة</em> للفروض</h1></div>
    <LatestRecitations />
    <div className="fourud-promo">
      <p>الفروض في حسابنا على التيك توك</p>
      <a className="platform-icon platform-icon-lg" href={tiktok.url} target="_blank" rel="noopener noreferrer" title="تيك توك"><PlatformGlyph type="tiktok" /></a>
    </div>
  </section>
}

function Recitations({ current, selected, setSelected, open, setOpen, menuRef, audioRef, onTime }) { return <section className="recitations-page"><div className="section-heading"><span className="eyebrow">المكتبة الصوتية</span><h1>تلاوات <em>خاشعة</em></h1><p>اختر اسم الشيخ، ثم استمع إلى التلاوة من المسجد الحرام.</p></div><div className="select-wrap" ref={menuRef}><button className="sheikh-select" onClick={() => setOpen(!open)} aria-expanded={open}><span>{selected}</span><span>{open ? '▲' : '▼'}</span></button>{open && <div className="sheikh-options">{sheikhsData.map((s) => <button key={s.name} className={selected === s.name ? 'selected' : ''} onClick={() => { setSelected(s.name); setOpen(false) }}>{s.name}</button>)}</div>}</div><article className="recitation-card"><div className="recitation-meta"><div><h2>{current.title}</h2><p>{current.surah}</p></div><span className="location-badge">{current.location}</span></div><audio ref={audioRef} key={current.audioSrc} controls onTimeUpdate={onTime} onPause={onTime} onEnded={() => localStorage.setItem(STORAGE.audio, '0')}><source src={current.audioSrc} type="audio/mpeg" />متصفحك لا يدعم مشغل الصوت.</audio></article></section> }

function About({ go }) { return <section className="placeholder-page about-page"><h1>من نحن</h1><p>تلاوات الحرمين — هي منصة إسلامية لنشر تلاوات من الحرم المكي والمدني، مع محتوى إسلامي موثوق: أحاديث نبوية، قصص الأنبياء، أذكار وأدعية، وسنن النبي ﷺ.</p><div className="about-actions"><button className="secondary-btn" onClick={() => go('/about/options')} title="تصفح أقسام المحتوى">الخيارات</button><button className="secondary-btn" onClick={() => go('/sources')}>المصادر والتخريج</button></div></section> }

function AboutOptions({ go }) { return <section className="explore-section about-options-page"><div className="section-heading"><h1>الخيارات</h1></div><div className="explore-grid">{ABOUT_OPTIONS.map((item) => <button key={item.path} className="explore-card" onClick={() => go(item.path)}><strong>{item.title}</strong><small>{item.text}</small></button>)}</div></section> }

function ComingSoon({ route }) { return <section className="placeholder-page"><h1>{routeLabels[route]}</h1><p>قريبًا</p></section> }

function PlatformGlyph({ type }) {
  const common = { viewBox: '0 0 24 24', width: 18, height: 18 }
  switch (type) {
    case 'youtube': return <svg {...common} fill="currentColor"><path d="M23.5 6.2s-.2-1.6-.9-2.3c-.9-.9-1.9-.9-2.3-1C17.1 2.6 12 2.6 12 2.6h0s-5.1 0-8.3.3c-.4 0-1.4.1-2.3 1C.7 4.6.5 6.2.5 6.2S.2 8.1.2 10v1.9c0 1.9.3 3.8.3 3.8s.2 1.6.9 2.3c.9.9 2.1.9 2.6 1 1.9.2 8 .3 8 .3s5.1 0 8.3-.3c.4 0 1.4-.1 2.3-1 .7-.7.9-2.3.9-2.3s.3-1.9.3-3.8V10c0-1.9-.3-3.8-.3-3.8zM9.8 14.6V7.4l6.4 3.6-6.4 3.6z" /></svg>
    case 'instagram': return <svg {...common} fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r="0.6" fill="currentColor" stroke="none" /></svg>
    case 'x': return <svg {...common} fill="currentColor"><path d="M18.3 2H21l-6.7 7.6L22 22h-6.4l-5-6.4L4.9 22H2l7.2-8.2L2 2h6.5l4.6 5.9L18.3 2z" /></svg>
    case 'facebook': return <svg {...common} fill="currentColor"><path d="M13.5 22v-8.1h2.7l.4-3.2h-3.1V8.9c0-.9.2-1.5 1.6-1.5h1.6V4.5C15.9 4.4 14.9 4.3 13.7 4.3c-2.6 0-4.4 1.6-4.4 4.4v2.4H6.6v3.2h2.7V22h4.2z" /></svg>
    case 'telegram': return <svg {...common} fill="currentColor"><path d="M21.9 4.3 2.6 11.7c-.9.4-.9 1.6.1 1.9l4.7 1.5 1.8 5.7c.3.9 1.4 1.1 2 .4l2.6-2.9 4.6 3.4c.8.6 1.9.1 2.1-.9l3.1-15.1c.2-1-.8-1.8-1.7-1.4zM8.6 14.6l9.6-7.9-8 8.9-.2 3.3z" /></svg>
    case 'tiktok': return <svg {...common} fill="currentColor"><path d="M16.6 5.8c-.9-.9-1.4-2.1-1.4-3.4h-3.1v14c0 1.4-1.1 2.5-2.5 2.5S7.1 17.8 7.1 16.4c0-1.4 1.1-2.5 2.5-2.5.3 0 .5 0 .8.1v-3.2c-.3 0-.5-.1-.8-.1-3.1 0-5.6 2.5-5.6 5.6S6.5 22 9.6 22s5.6-2.5 5.6-5.6V9.1c1.2.9 2.7 1.4 4.3 1.4V7.4c-1 0-2-.3-2.9-.9-.4-.2-.7-.5-1-.7z" /></svg>
    default: return null
  }
}
