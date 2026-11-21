// App.jsx — Layout, Navigation, and Currency Switcher
import { NavLink, Route, Routes } from 'react-router-dom';
import { CurrencyProvider, useCurrency } from './context/CurrencyContext';
import Dashboard from './pages/Dashboard';
import Suppliers from './pages/Suppliers';
import Fruits from './pages/Fruits';
import Vendors from './pages/Vendors';
import Purchases from './pages/Purchases';
import Sales from './pages/Sales';
import Stock from './pages/Stock';
import Payments from './pages/Payments';
import Reports from './pages/Reports';

const links = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/suppliers', label: 'Suppliers', icon: '🏭' },
  { to: '/fruits', label: 'Fruits', icon: '🍎' },
  { to: '/vendors', label: 'Vendors', icon: '🧺' },
  { to: '/purchases', label: 'Purchases', icon: '📥' },
  { to: '/sales', label: 'Sales', icon: '🧾' },
  { to: '/stock', label: 'Stock', icon: '📦' },
  { to: '/payments', label: 'Payments', icon: '💳' },
  { to: '/reports', label: 'Reports', icon: '📈' },
];

function AppLayout() {
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">BF</span>
          <div>
            <strong>Batloung Farm</strong>
            <small>Distribution System</small>
          </div>
        </div>

        {/* Currency Switcher (Maloti M / ZAR R) */}
        <div className="currency-switcher no-print">
          <span>CURRENCY DISPLAY:</span>
          <div className="currency-buttons">
            <button
              type="button"
              className={'currency-btn ' + (currency === 'R' ? 'active' : '')}
              onClick={() => setCurrency('R')}
              title="South African Rand (ZAR)"
            >
              R (ZAR)
            </button>
            <button
              type="button"
              className={'currency-btn ' + (currency === 'M' ? 'active' : '')}
              onClick={() => setCurrency('M')}
              title="Lesotho Maloti (LSL - 1:1 Pegged)"
            >
              M (Maloti)
            </button>
          </div>
        </div>

        <nav>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
            >
              <span className="nav-icon">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <p className="sidebar-foot">Maseru, Lesotho</p>
      </aside>

      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/fruits" element={<Fruits />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/purchases" element={<Purchases />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <CurrencyProvider>
      <AppLayout />
    </CurrencyProvider>
  );
}
