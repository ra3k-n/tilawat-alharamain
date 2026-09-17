import { useEffect, useMemo, useRef, useState } from 'react'
import { SunnahPage } from './Sunnah'
import './App.css'

const STORAGE = { route: 'tilawat:last-route', theme: 'tilawat:theme', sheikh: 'tilawat:selected-sheikh', audio: 'tilawat:audio-position' }
const routeLabels = { '/': 'الرئيسية', '/recitations': 'التلاوات', '/quran': 'القرآن الكريم', '/hadith': 'الأحاديث النبوية', '/prophets': 'قصص الأنبياء عليهم السلام', '/adhkar': 'الأذكار والأدعية', '/seerah': 'السيرة النبوية', '/search': 'البحث الشامل', '/sources': 'المصادر والتخريج', '/sunnah': 'سنن النبي' }
const sheikhsData = [
  { name: 'الشيخ ياسر الدوسري', title: 'صلاة المغرب — 18 محرم 1448 هـ', surah: 'سورة الكهف 107 - 110، سورة مريم 96 - 98', location: 'المسجد الحرام', audioSrc: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663960426511/NYHfkEdjTzaUAdcT.mp3' },
  { name: 'الشيخ فيصل غزاوي', title: 'صلاة المغرب — 2 ربيع الآخر 1448 هـ', surah: 'سورتي الكوثر والنصر', location: 'المسجد الحرام', audioSrc: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663960426511/WuXffcYMfFZTTDoW.mp3' },
  { name: 'الشيخ الوليد الشمسان', title: 'صلاة الفجر — 1 شعبان 1447 هـ', surah: 'سورة القصص، من الآية 76 إلى 88', location: 'المسجد الحرام', audioSrc: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663960426511/bWIptAoginZcHYqQ.mp3' },
]
function getStored(key, fallback = '') { try { return localStorage.getItem(key) || fallback } catch { return fallback } }
function readRoute() { const path = window.location.pathname; return routeLabels[path] ? path : getStored(STORAGE.route, '/') }
function navigate(path) { window.history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')) }

export default function App() {
  const [route, setRoute] = useState(readRoute)
  const [theme, setTheme] = useState(() => getStored(STORAGE.theme, 'system'))
  const [isThemeOpen, setIsThemeOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedSheikh, setSelectedSheikh] = useState(() => getStored(STORAGE.sheikh, sheikhsData[0].name))
  const [audioPosition, setAudioPosition] = useState(() => Number(getStored(STORAGE.audio, '0')) || 0)
  const audioRef = useRef(null)
  const currentRecitation = useMemo(() => sheikhsData.find((s) => s.name === selectedSheikh) || sheikhsData[0], [selectedSheikh])

  useEffect(() => { const onPop = () => setRoute(readRoute()); window.addEventListener('popstate', onPop); return () => window.removeEventListener('popstate', onPop) }, [])
  useEffect(() => {
    localStorage.setItem(STORAGE.route, route)
    localStorage.setItem(STORAGE.theme, theme)
    const applyTheme = () => {
      const resolved = theme === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme
      document.documentElement.dataset.theme = resolved
    }
    applyTheme()
    if (theme !== 'system') return undefined
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onSystemThemeChange = (event) => {
      document.documentElement.dataset.theme = event.matches ? 'dark' : 'light'
    }
    if (media.addEventListener) media.addEventListener('change', onSystemThemeChange)
    else media.addListener(onSystemThemeChange)
    return () => {
      if (media.removeEventListener) media.removeEventListener('change', onSystemThemeChange)
      else media.removeListener(onSystemThemeChange)
    }
  }, [route, theme])
  useEffect(() => { localStorage.setItem(STORAGE.sheikh, selectedSheikh) }, [selectedSheikh])
  useEffect(() => { const audio = audioRef.current; if (!audio) return; const restore = () => { if (audioPosition > 0 && audioPosition < audio.duration) audio.currentTime = audioPosition }; audio.addEventListener('loadedmetadata', restore); return () => audio.removeEventListener('loadedmetadata', restore) }, [currentRecitation.audioSrc, audioPosition])
  const go = (path) => { setIsDropdownOpen(false); navigate(path) }
  const chooseTheme = (value) => { setTheme(value); setIsThemeOpen(false) }
  const saveAudio = () => { const position = audioRef.current?.currentTime || 0; setAudioPosition(position); localStorage.setItem(STORAGE.audio, String(position)) }

  return <div dir="rtl" className="site-shell">
    <header className="topbar"><div className="topbar-inner"><button className="brand" onClick={() => go('/')} aria-label="العودة إلى الرئيسية"><img className="brand-logo" src="/tilawat-haramain-logo.jpg" alt="شعار تلاوات الحرمين" /><span><strong>تلاوات الحرمين</strong></span></button><div className="header-actions"><div className="theme-menu"><button className="theme-toggle" onClick={() => setIsThemeOpen((value) => !value)} aria-haspopup="listbox" aria-expanded={isThemeOpen} title="اختيار المظهر"><span className="theme-dot" aria-hidden="true"></span>المظهر<span className="theme-chevron">⌄</span></button>{isThemeOpen && <div className="theme-options" role="listbox" aria-label="خيارات المظهر"><button className={theme === 'dark' ? 'selected' : ''} onClick={() => chooseTheme('dark')} role="option" aria-selected={theme === 'dark'}>داكن</button><button className={theme === 'light' ? 'selected' : ''} onClick={() => chooseTheme('light')} role="option" aria-selected={theme === 'light'}>فاتح</button><button className={theme === 'system' ? 'selected' : ''} onClick={() => chooseTheme('system')} role="option" aria-selected={theme === 'system'}>مع النظام</button></div>}</div><button className="mobile-menu" onClick={() => setIsDropdownOpen((v) => !v)} aria-label="فتح القائمة">☰</button></div></div>
      <nav className={`main-nav ${isDropdownOpen ? 'nav-open' : ''}`} aria-label="التنقل الرئيسي"><button className={route === '/' ? 'active' : ''} onClick={() => go('/')}>الرئيسية</button><button className={route === '/recitations' ? 'active' : ''} onClick={() => go('/recitations')}>التلاوات</button><button className={route === '/quran' ? 'active' : ''} onClick={() => go('/quran')}>القرآن الكريم</button><button className={route === '/hadith' ? 'active' : ''} onClick={() => go('/hadith')}>الأحاديث النبوية</button><button className={route === '/prophets' ? 'active' : ''} onClick={() => go('/prophets')}>قصص الأنبياء</button><button className={route === '/adhkar' ? 'active' : ''} onClick={() => go('/adhkar')}>الأذكار والأدعية</button><button className={route === '/sunnah' ? 'active' : ''} onClick={() => go('/sunnah')}>سنن النبي</button></nav></header>
    <main className="main-content">{route === '/' && <Home go={go} />}{route === '/recitations' && <Recitations current={currentRecitation} selected={selectedSheikh} setSelected={setSelectedSheikh} open={isDropdownOpen} setOpen={setIsDropdownOpen} audioRef={audioRef} onTime={saveAudio} />}{route === '/sunnah' && <SunnahPage />}{['/quran', '/hadith', '/prophets', '/adhkar', '/seerah', '/search', '/sources'].includes(route) && <ComingSoon route={route} go={go} />}</main>
    <footer className="footer"><div><strong>tilawat haramain</strong><p>محتوى إسلامي، تلاوات خاشعة وأحاديث.</p></div><div className="footer-links"><button onClick={() => go('/quran')}>القرآن الكريم</button><button onClick={() => go('/hadith')}>الأحاديث</button><button onClick={() => go('/sources')}>المصادر والتخريج</button><button onClick={() => go('/search')}>البحث الشامل</button></div><div className="footer-bottom"><span>© 2026 tilawat haramain</span></div></footer>
  </div>
}
function Home({ go }) { return <section className="home-page"><div className="hero-card"><span className="eyebrow">من الحرمين الشريفين</span><h1>صوتٌ يفتح <em>أبواب السكينة</em></h1><p>محتوى إسلامي، تلاوات خاشعة وأحاديث</p><div className="hero-actions"><button className="primary-btn" onClick={() => go('/recitations')}>استمع إلى التلاوات</button><button className="secondary-btn" onClick={() => go('/quran')}>افتح القرآن الكريم</button></div></div><div className="feature-grid"><Feature title="القرآن الكريم" text="قريبًا" go={go} path="/quran" /><Feature title="الأحاديث النبوية" text="قريبًا" go={go} path="/hadith" /><Feature title="الأذكار والأدعية" text="قريبًا" go={go} path="/adhkar" /></div></section> }
function Feature({ title, text, go, path }) { return <button className="feature-card" onClick={() => go(path)}><strong>{title}</strong><small>{text}</small></button> }
function Recitations({ current, selected, setSelected, open, setOpen, audioRef, onTime }) { return <section className="recitations-page"><div className="section-heading"><span className="eyebrow">المكتبة الصوتية</span><h1>تلاوات <em>خاشعة</em></h1><p>اختر اسم الشيخ، ثم استمع إلى التلاوة من المسجد الحرام.</p></div><div className="select-wrap"><button className="sheikh-select" onClick={() => setOpen(!open)} aria-expanded={open}><span>{selected}</span><span>{open ? '▲' : '▼'}</span></button>{open && <div className="sheikh-options">{sheikhsData.map((s) => <button key={s.name} className={selected === s.name ? 'selected' : ''} onClick={() => { setSelected(s.name); setOpen(false) }}>{s.name}</button>)}</div>}</div><article className="recitation-card"><div className="recitation-meta"><div><h2>{current.title}</h2><p>{current.surah}</p></div><span className="location-badge">{current.location}</span></div><audio ref={audioRef} key={current.audioSrc} controls onTimeUpdate={onTime} onPause={onTime} onEnded={() => localStorage.setItem(STORAGE.audio, '0')}><source src={current.audioSrc} type="audio/mpeg" />متصفحك لا يدعم مشغل الصوت.</audio></article></section> }
function ComingSoon({ route }) { return <section className="placeholder-page"><h1>{routeLabels[route]}</h1><p>قريبًا</p></section> }
