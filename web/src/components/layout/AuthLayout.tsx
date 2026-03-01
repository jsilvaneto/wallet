import React from 'react';
import { Outlet } from 'react-router-dom';

const AuthLayout: React.FC = () => {
    return (
        <div className="flex justify-center items-center" style={{ minHeight: '100vh', padding: '2rem' }}>
            <div className="glass-panel animate-fade-in" style={{ padding: '3rem', width: '100%', maxWidth: '450px', position: 'relative', overflow: 'hidden' }}>

                {/* Glow effect blob behind auth box */}
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'var(--primary)', filter: 'blur(80px)', opacity: 0.5, borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '-80px', left: '-50px', width: '180px', height: '180px', background: 'var(--secondary)', filter: 'blur(90px)', opacity: 0.3, borderRadius: '50%', zIndex: 0, pointerEvents: 'none' }} />

                <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow)' }}>
                        <span style={{ fontSize: '1.75rem', color: 'white', fontWeight: 600 }}>W</span>
                    </div>
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;
