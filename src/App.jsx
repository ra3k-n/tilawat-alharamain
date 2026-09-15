import React, { useState } from 'react'

export default function App() {
  const [activeTab, setActiveTab] = useState('recitations')
  const [completedSunnahs, setCompletedSunnahs] = useState(0)

  // حالة القائمة المنسدلة والشيخ المختار
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [selectedSheikh, setSelectedSheikh] = useState('الشيخ ياسر الدوسري')

  // بيانات الشيوخ المحدثة بروابط الصوت الخاصة بك وبالترتيب المطلوب
  const sheikhsData = [
    {
      name: 'الشيخ ياسر الدوسري',
      title: 'صلاة المغرب — 18 محرم 1448 هـ',
      date: 'سورة الكهف  107 - 110،    سورة مريم - 96 - 98',
      surah: 'المسجد الحرام',
      audioSrc: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663960426511/NYHfkEdjTzaUAdcT.mp3'
    },
    {
      name: 'الشيخ فيصل غزاوي',
      title: 'صلاة المغرب -  2 ربيع الآخر 1448 هـ',
      date: ' سورتي الكوثر والنصر',
      surah: 'المسجد الحرام',
      audioSrc: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663960426511/WuXffcYMfFZTTDoW.mp3'
    },
    {
      name: ' الشيخ الوليد الشمسان',
      title: 'صلاة الفجر — 1 شعبان 1447 هـ',
      date: 'سورة القصص، من الآية 76 إلى 88',
      surah: 'المسجد الحرام',
      audioSrc: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663960426511/bWIptAoginZcHYqQ.mp3'
    }
  ]

  // بيانات السنن
  const sunnahs = [
    { id: 1, title: 'غسل اليدين قبل الوضوء', category: 'عام', hadith: 'إذا استيقظ أحدكم من نومه فلا يغسل يده في الإناء حتى يغسلها ثلاثاً.' },
    { id: 2, title: 'السواك عند الصلاة', category: 'المسجد', hadith: 'لولا أن أشق على أمتي لأمرتهم بالسواك عند كل صلاة.' },
    { id: 3, title: 'قراءة أذكار الصباح والمساء', category: 'الأذكار', hadith: 'أفضل الذكر لا إله إلا الله.' },
  ]

  const [currentSunnahIndex, setCurrentSunnahIndex] = useState(0)

  const handleNextSunnah = () => {
    setCurrentSunnahIndex((prev) => (prev + 1) % sunnahs.length)
  }

  const handleApplySunnah = () => {
    if (completedSunnahs < 5) setCompletedSunnahs(completedSunnahs + 1)
    handleNextSunnah()
  }

  // التلاوة الحالية بناءً على الشيخ المختار
  const currentRecitation = sheikhsData.find(s => s.name === selectedSheikh) || sheikhsData[0]

  return (
    <div dir="rtl" className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      
      {/* 1. شريط التنقل العلوي (Navbar) */}
      <header className="w-full border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
              🕌
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-wide">منصة تلاوات الحرمين</h1>
            </div>
          </div>

          <nav className="flex items-center gap-2 bg-slate-800/60 p-1 rounded-xl border border-slate-700/50">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'home' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              الرئيسية
            </button>
            <button
              onClick={() => setActiveTab('recitations')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'recitations' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              التلاوات
            </button>
            <button
              onClick={() => setActiveTab('sunnah')}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'sunnah' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
            >
              سنن النبي ﷺ
            </button>
          </nav>
        </div>
      </header>

      {/* 2. المحتوى الرئيسي */}
      <main className="max-w-3xl mx-auto px-4 py-10 w-full flex-grow">

        {/* --- الصفحة الرئيسية --- */}
        {activeTab === 'home' && (
          <div className="space-y-16 animate-fadeIn">
            <div className="text-center space-y-4 py-10">
              <h1 className="text-4xl md:text-6xl font-black text-white leading-tight">
                صوتٌ يفتح <span className="text-emerald-400">أبواب السكينة</span>
              </h1>
              <p className="text-slate-400 max-w-xl mx-auto text-base">
                ننشر التلاوات كاملة من الحرمين الشريفين، لتكون لك صحبة قرآنية دائمة وتجربة هادئة في يومك.
              </p>

              <div className="flex flex-wrap justify-center gap-4 pt-4">
                <button
                  onClick={() => setActiveTab('recitations')}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl transition-all shadow-lg hover:shadow-amber-500/20"
                >
                  التلاوات الخاشعة ◀
                </button>
                <button
                  onClick={() => setActiveTab('sunnah')}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 transition-all"
                >
                  سنن النبي ﷺ ←
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- صفحة التلاوات الخاشعة مع القائمة المنسدلة --- */}
        {activeTab === 'recitations' && (
          <div className="space-y-8 animate-fadeIn">
            <div className="text-center space-y-2">
              <h2 className="text-4xl font-black text-white">
                تلاوات <span className="text-red-500">خاشعة</span>
              </h2>
              <p className="text-slate-400 text-sm">اختر اسم الشيخ من القائمة، ثم استمع إلى التلاوة.</p>
            </div>

            {/* القائمة المنسدلة */}
            <div className="space-y-3">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full bg-[#0b1329] border border-amber-500/60 p-4 rounded-lg flex items-center justify-between text-white font-bold text-lg hover:border-amber-400 transition-all shadow-lg"
              >
                <span>{selectedSheikh}</span>
                <span className={`transform transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}>
                  ▲
                </span>
              </button>

              {isDropdownOpen && (
                <div className="space-y-2 pt-1 animate-fadeIn">
                  {sheikhsData.map((sheikh) => {
                    const isSelected = selectedSheikh === sheikh.name
                    return (
                      <button
                        key={sheikh.name}
                        onClick={() => {
                          setSelectedSheikh(sheikh.name)
                          setIsDropdownOpen(false)
                        }}
                        className={`w-full p-4 rounded-lg text-center font-bold text-lg transition-all ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 border border-amber-500 shadow-md'
                            : 'bg-[#0b1329] text-slate-200 border border-slate-800 hover:border-slate-600'
                        }`}
                      >
                        {sheikh.name}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* بطاقة التلاوة الخاصة بالشيخ المختار */}
            <div className="bg-[#0b1329] border border-slate-800 rounded-2xl p-6 space-y-4 shadow-xl">
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{currentRecitation.title}</h3>
                  <p className="text-xs text-slate-400 mt-1">{currentRecitation.surah}</p>
                </div>
                <span className="text-xs px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
                  {currentRecitation.date}
                </span>
              </div>

              {/* مشغل الصوت التفاعلي */}
              <div className="pt-2">
                <audio key={currentRecitation.audioSrc} controls className="w-full rounded-lg">
                  <source src={currentRecitation.audioSrc} type="audio/mpeg" />
                  متصفحك لا يدعم مشغل الصوت.
                </audio>
              </div>
            </div>
          </div>
        )}

        {/* --- صفحة سنن النبي ﷺ --- */}
        {activeTab === 'sunnah' && (
          <div className="space-y-8 max-w-2xl mx-auto animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-6">
              <div>
                <h2 className="text-3xl font-bold text-white">سنن النبي ﷺ</h2>
                <p className="text-slate-400 text-sm mt-1">خطوات صغيرة نحيي بها هدي النبي ﷺ في يومنا</p>
              </div>
              <div className="text-left bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl">
                <span className="text-2xl font-black text-emerald-400">{completedSunnahs}/5</span>
                <p className="text-xs text-slate-500">سنن مكتملة اليوم</p>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-6 shadow-xl">
              <div className="flex justify-between items-center">
                <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                  تصنيف: {sunnahs[currentSunnahIndex].category}
                </span>
                <span className="text-xs text-slate-500">سنة {currentSunnahIndex + 1} من {sunnahs.length}</span>
              </div>

              <h3 className="text-2xl font-bold text-white">
                {sunnahs[currentSunnahIndex].title}
              </h3>

              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl text-slate-300 text-sm leading-relaxed italic">
                "{sunnahs[currentSunnahIndex].hadith}"
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  onClick={handleApplySunnah}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/20"
                >
                  ✓ طبقتها
                </button>
                <button
                  onClick={handleNextSunnah}
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
                >
                  تجاوز ←
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      <footer className="w-full border-t border-slate-900 py-6 text-center text-xs text-slate-600">
      </footer>
    </div>
  )
}
