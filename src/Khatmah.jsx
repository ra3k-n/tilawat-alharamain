import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'tilawat:khatmah-plan';
const TOTAL_JUZ = 30;
const GOALS = [
  { id: 'reading', label: 'قراءة', verb: 'قرأت' },
  { id: 'memorization', label: 'حفظ', verb: 'حفظت' },
  { id: 'review', label: 'مراجعة', verb: 'راجعت' },
  { id: 'reflection', label: 'تدبر', verb: 'تدبرت' },
];

function toDateOnly(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function formatDate(date) {
  return new Date(date).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
}
function dayIndexFromStart(startDate, today) {
  const diff = Math.round((toDateOnly(today) - toDateOnly(startDate)) / 86400000);
  return diff + 1; // 1-based
}
function juzForDay(dayIndex1, totalDays, startJuz) {
  const from = Math.floor((dayIndex1 - 1) * TOTAL_JUZ / totalDays);
  const to = Math.floor(dayIndex1 * TOTAL_JUZ / totalDays) - 1;
  if (to < from) return [];
  const list = [];
  for (let idx = from; idx <= to; idx++) list.push(((startJuz - 1 + idx) % TOTAL_JUZ) + 1);
  return list;
}
// Prevent the mouse-wheel from silently changing a focused number input's value while the page scrolls
function blurOnWheel(e) { e.target.blur(); }

function loadPlan() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    parsed.startDate = new Date(parsed.startDate);
    return parsed;
  } catch {
    return null;
  }
}
function savePlan(plan) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(plan));
}

export function KhatmahPage() {
  const [plan, setPlan] = useState(() => loadPlan());
  const [isEditing, setIsEditing] = useState(false);
  const [saveError, setSaveError] = useState('');

  if (!plan || isEditing) {
    return <SetupForm
      initial={plan}
      error={saveError}
      onCancel={plan ? () => { setIsEditing(false); setSaveError('') } : null}
      onSave={(newPlan) => {
        try {
          savePlan(newPlan);
          setPlan(newPlan);
          setIsEditing(false);
          setSaveError('');
        } catch {
          setSaveError('تعذّر الحفظ — جرّب مرة أخرى. إذا تكررت المشكلة، أعد فتح الصفحة.');
        }
      }}
    />;
  }

  return <ActivePlan
    plan={plan}
    onEdit={() => setIsEditing(true)}
    onStop={() => { localStorage.removeItem(STORAGE_KEY); setPlan(null); }}
    onToggleDay={(dayIndex) => {
      const completedDays = plan.completedDays.includes(dayIndex)
        ? plan.completedDays.filter((d) => d !== dayIndex)
        : [...plan.completedDays, dayIndex];
      const updated = { ...plan, completedDays };
      savePlan(updated);
      setPlan(updated);
    }}
  />;
}

function SetupForm({ initial, onCancel, onSave, error }) {
  const [name, setName] = useState(initial?.name || 'ختمتي');
  const [goal, setGoal] = useState(initial?.goal || 'reading');
  const [mode, setMode] = useState('days');
  const [days, setDays] = useState(initial?.totalDays || 30);
  const [endDateInput, setEndDateInput] = useState('');
  const [startJuz, setStartJuz] = useState(initial?.startJuz || 1);
  const [reminder, setReminder] = useState(initial?.reminder || false);

  const handleReminderChange = (checked) => {
    setReminder(checked);
    if (checked && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    let totalDays = days;
    if (mode === 'date' && endDateInput) {
      const start = toDateOnly(new Date());
      const end = toDateOnly(new Date(endDateInput));
      totalDays = Math.max(1, Math.round((end - start) / 86400000) + 1);
    }
    // initial.startDate may already be a plain string (it was serialized on a previous save) —
    // normalize through `new Date(...)` instead of assuming it's still a Date instance.
    const startDate = initial ? new Date(initial.startDate).toISOString() : new Date().toISOString();
    onSave({
      name: name.trim() || 'ختمتي',
      goal,
      startDate,
      totalDays: Math.max(1, Math.round(totalDays)),
      startJuz: Math.min(30, Math.max(1, Math.round(startJuz))),
      reminder,
      completedDays: initial && initial.totalDays === totalDays ? initial.completedDays : [],
    });
  };

  return <section className="khatmah-page" dir="rtl">
    <h1>{initial ? 'تعديل الختمة' : 'بدء ختمة جديدة'}</h1>
    {initial && <p className="khatmah-warning">تعديل الخطة يصفّر تقدمك الحالي إذا غيّرت عدد الأيام.</p>}
    {error && <p className="khatmah-error">{error}</p>}
    <form className="khatmah-form" onSubmit={handleSubmit}>
      <label>اسم الختمة
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: ختمة رمضان" />
      </label>

      <label>الهدف</label>
      <div className="khatmah-goal-group">
        {GOALS.map((g) => <button key={g.id} type="button" className={goal === g.id ? 'selected' : ''} onClick={() => setGoal(g.id)}>{g.label}</button>)}
      </div>

      <label>مدة الختمة</label>
      <div className="khatmah-mode-group">
        <button type="button" className={mode === 'days' ? 'selected' : ''} onClick={() => setMode('days')}>بعدد الأيام</button>
        <button type="button" className={mode === 'date' ? 'selected' : ''} onClick={() => setMode('date')}>بتاريخ نهاية محدد</button>
      </div>
      {mode === 'days'
        ? <label>عدد الأيام
            <input type="number" min="1" max="365" value={days} onChange={(e) => setDays(Number(e.target.value) || 1)} onWheel={blurOnWheel} />
          </label>
        : <label>تاريخ الانتهاء
            <input type="date" value={endDateInput} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setEndDateInput(e.target.value)} required />
          </label>}

      <label>تبدأ من الجزء رقم
        <input type="number" min="1" max="30" value={startJuz} onChange={(e) => setStartJuz(Number(e.target.value) || 1)} onWheel={blurOnWheel} />
      </label>

      <label className="khatmah-checkbox"><input type="checkbox" checked={reminder} onChange={(e) => handleReminderChange(e.target.checked)} /> تذكير يومي (إشعار متصفح عند فتح الموقع إذا لم تُنهِ وردك)</label>

      <div className="khatmah-actions">
        <button type="submit" className="primary-btn">{initial ? 'حفظ التعديل' : 'بدء الختمة'}</button>
        {onCancel && <button type="button" className="secondary-btn" onClick={onCancel}>إلغاء</button>}
      </div>
    </form>
  </section>;
}

function ActivePlan({ plan, onEdit, onStop, onToggleDay }) {
  const today = new Date();
  const rawDayIndex = dayIndexFromStart(plan.startDate, today);
  const dayIndex = Math.min(Math.max(rawDayIndex, 1), plan.totalDays);
  const isFinished = rawDayIndex > plan.totalDays;
  const todaysJuz = useMemo(() => juzForDay(dayIndex, plan.totalDays, plan.startJuz), [dayIndex, plan.totalDays, plan.startJuz]);
  const endDate = useMemo(() => addDays(plan.startDate, plan.totalDays - 1), [plan.startDate, plan.totalDays]);
  const goal = GOALS.find((g) => g.id === plan.goal) || GOALS[0];
  const doneToday = plan.completedDays.includes(dayIndex);
  const progressPct = Math.round((plan.completedDays.length / plan.totalDays) * 100);
  const lastCompleted = plan.completedDays.length ? Math.max(...plan.completedDays) : null;

  useEffect(() => {
    if (!plan.reminder || isFinished || doneToday) return;
    if ('Notification' in window && Notification.permission === 'granted') {
      try { new Notification('تذكير ختمة: ' + plan.name, { body: `وردك اليوم: الجزء ${todaysJuz.join('، ')}` }); } catch { /* ignore */ }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <section className="khatmah-page" dir="rtl">
    <div className="khatmah-header">
      <div><h1>{plan.name}</h1><span className="khatmah-goal-tag">الهدف: {goal.label}</span></div>
      <div className="khatmah-header-actions"><button className="secondary-btn" onClick={onEdit}>تعديل الخطة</button><button className="secondary-btn khatmah-stop" onClick={onStop}>إيقاف الختمة</button></div>
    </div>

    <p className="khatmah-range">من {formatDate(plan.startDate)} إلى {formatDate(endDate)} ({plan.totalDays} يومًا)</p>

    <div className="khatmah-progress-bar"><div className="khatmah-progress-fill" style={{ width: `${progressPct}%` }} /></div>
    <p className="khatmah-progress-label">{progressPct}% مكتمل — {plan.completedDays.length} من {plan.totalDays} يوم</p>

    {isFinished ? (
      <div className="khatmah-today-card khatmah-finished"><h2>🎉 أتممت خطتك</h2><p>بارك الله فيك، يمكنك بدء ختمة جديدة.</p></div>
    ) : (
      <div className="khatmah-today-card">
        <span className="khatmah-day-tag">اليوم {dayIndex} من {plan.totalDays}</span>
        <h2>{todaysJuz.length ? `وردك اليوم: الجزء ${todaysJuz.join('، ')}` : 'لا يوجد ورد اليوم'}</h2>
        {todaysJuz.length > 0 && <button className={`khatmah-toggle ${doneToday ? 'done' : ''}`} onClick={() => onToggleDay(dayIndex)}>{doneToday ? `✓ ${goal.verb}` : `تحديد كـ${goal.verb === 'قرأت' ? 'مقروء' : 'منجز'}`}</button>}
      </div>
    )}

    {lastCompleted && <p className="khatmah-last">آخر ورد أنجزته: اليوم {lastCompleted} (الجزء {juzForDay(lastCompleted, plan.totalDays, plan.startJuz).join('، ')})</p>}
  </section>;
}
