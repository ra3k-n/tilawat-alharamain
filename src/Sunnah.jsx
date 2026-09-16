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

  if (!isLoaded) return <div style={{ color: '#fff', textAlign: 'center', padding: '50px' }}>جاري التحميل...</div>;

  return (
    <div style={{ padding: '20px', color: '#fff', backgroundColor: '#0a0e1a', minHeight: '100vh', direction: 'rtl' }}>
      <h1 style={{ textAlign: 'center', color: '#10b981' }}>سنن النبي ﷺ</h1>
      <p style={{ textAlign: 'center', opacity: 0.8 }}>حدد السنن التي أكملتها اليوم (تُحفظ تلقائياً في جهازك):</p>

      <div style={{ display: 'grid', gap: '15px', maxWidth: '600px', margin: '30px auto' }}>
        {sunnahList.map((sunnah) => {
          const isDone = completedSunnahs.includes(sunnah.id);
          return (
            <div
              key={sunnah.id}
              onClick={() => toggleSunnah(sunnah.id)}
              style={{
                padding: '15px 20px',
                borderRadius: '10px',
                backgroundColor: isDone ? '#064e3b' : '#1e293b',
                border: isDone ? '1px solid #10b981' : '1px solid #334155',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                transition: '0.2s'
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '18px' }}>{sunnah.title}</h3>
                <span style={{ fontSize: '12px', opacity: 0.6 }}>{sunnah.category}</span>
              </div>
              <button
                style={{
                  padding: '8px 15px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: isDone ? '#10b981' : '#3b82f6',
                  color: '#fff',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                {isDone ? '✓ مكتملة' : 'تحديد كـ مكتملة'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
