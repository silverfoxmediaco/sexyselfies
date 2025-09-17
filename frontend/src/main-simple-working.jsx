import React from 'react';
import ReactDOM from 'react-dom/client';

console.log('🚀 Simple App Starting...');
console.log('🎯 Mounting Simple React App to root element...');

function SimpleApp() {
  return (
    <div
      style={{
        padding: '20px',
        backgroundColor: '#0A0A0B',
        color: 'white',
        minHeight: '100vh',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h1 style={{ color: '#FF006E' }}>🎉 SexySelfies React App is Working!</h1>
      <p>This confirms React is loading properly.</p>
      <p>Time: {new Date().toLocaleTimeString()}</p>
      <button
        onClick={() => alert('Button clicked!')}
        style={{
          background: '#FF006E',
          color: 'white',
          border: 'none',
          padding: '10px 20px',
          borderRadius: '5px',
          cursor: 'pointer',
        }}
      >
        Test Button
      </button>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<SimpleApp />);
