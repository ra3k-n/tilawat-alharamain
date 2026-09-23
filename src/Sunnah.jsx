import { useState, useEffect } from 'react';

function getTodayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `completed_sunnahs:${y}-${m}-${day}`;
}

export function SunnahPage() {
  const [completedSunnahs, setCompletedSunnahs] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [storageKey] = useState(getTodayKey);

  // قائمة السنن النبوية
  const sunnahList = [
    { id: 1, title: 'التبكير إلى صلاة الجمعة', category: 'سنن صلاة' },
    { id: 2, title: 'صلاة الضحى', category: 'سنن صلاة' },
    { id: 3, title: 'قراءة سورة الكهف يوم الجمعة', category: 'سنن قرأنية' },
    { id: 4, title: 'الوتر قبل النوم', category: 'سنن قيام' },
    { id: 5, title: 'أذكار الصباح والمساء', category: 'سنن اليوم والليلة' },
  ];

  // 1. قراءة البيانات المحفوظة فور فتح الصفحة (خاصة باليوم الحالي فقط)
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setCompletedSunnahs(JSON.parse(saved));
      } catch (e) {
        console.error("خطأ في قراءة البيانات", e);
      }
    }
    setIsLoaded(true);
  }, [storageKey]);

  // 2. حفظ البيانات تلقائياً عند أي تغيير (خاصة باليوم الحالي، تُصفّر مع كل يوم جديد)
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(storageKey, JSON.stringify(completedSunnahs));
    }
  }, [completedSunnahs, isLoaded, storageKey]);

  // 3. دالة إضافة/إلغاء الإكمال
  const toggleSunnah = (id) => {
    setCompletedSunnahs((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  if (!isLoaded) return <div className="sunnah-page sunnah-loading">جاري التحميل...</div>;

  return (
    <section className="sunnah-page" dir="rtl">
      <h1>سنن النبي ﷺ</h1>
      <p className="sunnah-intro">حدد السنن التي أكملتها اليوم:</p>

      <div className="sunnah-list">
        {sunnahList.map((sunnah) => {
          const isDone = completedSunnahs.includes(sunnah.id);
          return (
            <div
              key={sunnah.id}
              className={`sunnah-item ${isDone ? 'done' : ''}`}
              onClick={() => toggleSunnah(sunnah.id)}
            >
              <div>
                <h3>{sunnah.title}</h3>
                <span className="sunnah-category">{sunnah.category}</span>
              </div>
              <button className={`sunnah-toggle ${isDone ? 'done' : ''}`} aria-pressed={isDone}>
                {isDone ? '✓ مكتملة' : 'تحديد كـ مكتملة'}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
