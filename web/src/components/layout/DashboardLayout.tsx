import React from 'react';
import { Outlet, Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { LayoutDashboard, Receipt, ArrowRightLeft, Settings, LogOut, Wallet } from 'lucide-react';

const DashboardLayout: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const token = localStorage.getItem('wallet_token');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    const handleLogout = () => {
        localStorage.removeItem('wallet_token');
        navigate('/login');
    };

    const navigation = [
        { name: 'Dashboard', href: '/d', icon: LayoutDashboard },
        { name: 'Accounts', href: '/d/accounts', icon: Wallet },
        { name: 'Transactions', href: '/d/transactions', icon: ArrowRightLeft },
        { name: 'Cost Centers', href: '/d/cost-centers', icon: Receipt },
    ];

    return (
        <div className="flex" style={{ minHeight: '100vh', background: 'var(--bg-main)' }}>
            {/* Sidebar Navigation */}
            <aside className="glass-panel" style={{ width: '280px', borderRadius: 0, borderTop: 0, borderLeft: 0, borderBottom: 0, display: 'flex', flexDirection: 'column', zIndex: 10 }}>
                <div className="flex items-center gap-4" style={{ padding: '2rem 1.5rem' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, var(--primary), var(--secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-glow)' }}>
                        <span style={{ fontSize: '1.25rem', color: 'white', fontWeight: 600 }}>W</span>
                    </div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>Wallet</span>
                </div>

                <nav className="flex flex-col gap-2" style={{ padding: '0 1rem', flex: 1 }}>
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href;
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '0.75rem 1rem',
                                    borderRadius: 'var(--radius-md)',
                                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    background: isActive ? 'hsla(0, 0%, 100%, 0.05)' : 'transparent',
                                    fontWeight: isActive ? 500 : 400,
                                    transition: 'all var(--transition)'
                                }}
                                className={isActive ? '' : 'hover-bg-surface'}
                            >
                                <Icon size={20} color={isActive ? 'var(--primary)' : 'currentColor'} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div style={{ padding: '2rem 1rem' }}>
                    <Link
                        to="/d/settings"
                        style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', color: 'var(--text-secondary)' }}
                    >
                        <Settings size={20} />
                        Settings
                    </Link>
                    <button
                        onClick={handleLogout}
                        style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', color: 'var(--expense)', background: 'none', border: 'none', cursor: 'pointer', width: '100%', fontFamily: 'inherit', fontSize: '1rem', textAlign: 'left' }}
                    >
                        <LogOut size={20} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main style={{ flex: 1, padding: '2rem 3rem', height: '100vh', overflowY: 'auto' }}>
                <Outlet />
            </main>

            {/* Hover utility class specifically for the sidebar links since we used inline styles for React reactivity */}
            <style>{`.hover-bg-surface:hover { background: var(--bg-surface-hover) !important; color: var(--text-primary) !important; }`}</style>
        </div>
    );
};

export default DashboardLayout;
