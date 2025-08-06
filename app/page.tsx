export default function HomePage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      backgroundColor: '#f3f4f6',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{
        fontSize: '3rem',
        color: '#1f2937',
        marginBottom: '1rem'
      }}>
        Meet2Rent
      </h1>
      <p style={{
        fontSize: '1.25rem',
        color: '#6b7280',
        textAlign: 'center',
        maxWidth: '600px'
      }}>
        Digital platform for long-term property rentals in Greece
      </p>
      <div style={{ marginTop: '2rem' }}>
        <p style={{ color: '#059669', fontWeight: 'bold' }}>
          ✅ DEPLOYMENT SUCCESSFUL!
        </p>
      </div>
    </div>
  );
}
