import { useState, useEffect } from 'react';

export function SunnahPage() {
  const [completedSunnahs, setCompletedSunnahs] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // قائمة السنن النبوية
  const sunnahList = [
    { id: 1, title: 'التبكير إلى صلاة الجمعة', category: 'سنن صلاة' },
    { id: 2, title: 'صلاة الضحى', category: 'سنن صلاة' },
    { id: 3, title: 'قراءة سورة الكهف يوم الجمعة', category: 'سنن قرأنية' },
    { id: 4, title: 'الوتر قبل النوم', category: 'سنن قيام' },
    { id: 5, title: 'أذكار الصباح والمساء', category: 'سنن اليوم والليلة' },
  ];

  // 1. قراءة البيانات المحفوظة فور فتح الصفحة
  useEffect(() => {
    const saved = localStorage.getItem('completed_sunnahs');
    if (saved) {
      try {
        setCompletedSunnahs(JSON.parse(saved));
      } catch (e) {
        console.error("خطأ في قراءة البيانات", e);
      }
    }
    setIsLoaded(true);
  }, []);

  // 2. حفظ البيانات تلقائياً عند أي تغيير (ولن تضيع عند التحديث)
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('completed_sunnahs', JSON.stringify(completedSunnahs));
    }
  }, [completedSunnahs, isLoaded]);

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
      <p className="sunnah-intro">حدد السنن التي أكملتها اليوم (تُحفظ تلقائياً في جهازك):</p>

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
              <button className={`sunnah-toggle ${isDone ? 'done' : ''}`}>
                {isDone ? '✓ مكتملة' : 'تحديد كـ مكتملة'}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
