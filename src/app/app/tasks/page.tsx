export const dynamic = 'force-dynamic';

export default function TasksPage() {
  return (
    <div style={{ padding: '64px 40px', fontFamily: "'DM Sans', sans-serif", color: '#1A1A1A' }}>
      <p style={{ fontSize: 12, color: '#8A949E', marginBottom: 8, letterSpacing: 0.2 }}>Tasks</p>
      <h1 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 38, fontWeight: 400, letterSpacing: -0.5, margin: '0 0 6px' }}>
        What needs doing.
      </h1>
      <p style={{ fontSize: 15, color: '#8A949E', marginBottom: 48 }}>
        Your tasks, organized around your goals.
      </p>

      <div style={{
        background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 20,
        padding: '48px 40px', textAlign: 'center', maxWidth: 480,
      }}>
        <p style={{ fontSize: 32, marginBottom: 16 }}>◻</p>
        <p style={{ fontSize: 16, fontWeight: 500, color: '#1A1A1A', marginBottom: 6 }}>No tasks yet</p>
        <p style={{ fontSize: 14, color: '#8A949E', lineHeight: 1.6 }}>
          Tasks tied to your goals and daily rhythm will appear here.
        </p>
      </div>
    </div>
  );
}
