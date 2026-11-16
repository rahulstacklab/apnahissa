import React, { useState, useEffect, useMemo, createContext, useContext } from 'react';
import {
  Wallet, Users, Plus, ArrowUpRight, ArrowDownLeft, CheckCircle2, Clock,
  PieChart, BarChart3, Receipt, Settings, Bell, Search, Filter, Download,
  LogOut, Moon, Sun, Share2, Trash2, Edit3, Check, X, ChevronRight,
  CreditCard, Banknote, Smartphone, AlertCircle, Sparkles, ShieldCheck,
  UserPlus, Copy, Home, Layers, History, HelpCircle, Menu, ArrowRight
} from 'lucide-react';

// ============================================================================
// 1. CURRENCY & INTEGER PAISA ARITHMETIC ENGINE (ZERO FLOATING-POINT ERRORS)
// ============================================================================
const CURRENCIES = {
  INR: { symbol: '₹', code: 'INR', name: 'Indian Rupee', minorFactor: 100 },
  USD: { symbol: '$', code: 'USD', name: 'US Dollar', minorFactor: 100 },
  EUR: { symbol: '€', code: 'EUR', name: 'Euro', minorFactor: 100 },
};

const toPaise = (amount) => {
  const num = parseFloat(amount);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
};

const formatCurrency = (paise, currencyCode = 'INR', showSign = false) => {
  const curr = CURRENCIES[currencyCode] || CURRENCIES.INR;
  const isNegative = paise < 0;
  const absVal = Math.abs(paise) / 100;
  const formatted = absVal.toLocaleString('en-IN', {
    minimumFractionDigits: absVal % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
  const sign = showSign ? (isNegative ? '-' : paise > 0 ? '+' : '') : isNegative ? '-' : '';
  return `${sign}${curr.symbol}${formatted}`;
};

// ============================================================================
// 2. DEBT SIMPLIFICATION & BALANCE CALCULATION ENGINE
// ============================================================================
/**
 * Computes net balances in paise for every member across expenses and confirmed settlements.
 * Positive balance = Owed money (creditor).
 * Negative balance = Owes money (debtor).
 */
function calculateNetBalances(members, expenses, settlements) {
  const balances = {};
  members.forEach((m) => {
    balances[m.id] = 0;
  });

  // Process Expenses
  expenses.forEach((exp) => {
    // Payers get credited
    if (exp.payers && Array.isArray(exp.payers)) {
      exp.payers.forEach((p) => {
        if (balances[p.userId] !== undefined) {
          balances[p.userId] += p.amountPaise;
        }
      });
    } else if (exp.paidBy) {
      if (balances[exp.paidBy] !== undefined) {
        balances[exp.paidBy] += exp.amountPaise;
      }
    }

    // Participants get debited
    if (exp.splits && Array.isArray(exp.splits)) {
      exp.splits.forEach((s) => {
        if (balances[s.userId] !== undefined) {
          balances[s.userId] -= s.amountPaise;
        }
      });
    }
  });

  // Process Confirmed Settlements
  settlements
    .filter((s) => s.status === 'CONFIRMED')
    .forEach((settle) => {
      if (balances[settle.fromUserId] !== undefined) {
        balances[settle.fromUserId] += settle.amountPaise;
      }
      if (balances[settle.toUserId] !== undefined) {
        balances[settle.toUserId] -= settle.amountPaise;
      }
    });

  return balances;
}

/**
 * Greedy Min-Cash-Flow Debt Simplification Algorithm
 * Minimizes the total number of transactions needed to settle all group debts.
 */
function simplifyDebts(balancesMap) {
  const debtors = [];
  const creditors = [];

  Object.entries(balancesMap).forEach(([userId, amount]) => {
    if (amount < -1) debtors.push({ userId, amount: -amount }); // amount owed
    else if (amount > 1) creditors.push({ userId, amount }); // amount to receive
  });

  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);

  const transactions = [];
  let i = 0;
  let j = 0;

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const settleAmount = Math.min(debtor.amount, creditor.amount);

    if (settleAmount > 0) {
      transactions.push({
        from: debtor.userId,
        to: creditor.userId,
        amountPaise: settleAmount,
      });
    }

    debtor.amount -= settleAmount;
    creditor.amount -= settleAmount;

    if (debtor.amount <= 1) i++;
    if (creditor.amount <= 1) j++;
  }

  return transactions;
}

// ============================================================================
// 3. CUSTOM BRAND LOGO (APNAHISSA)
// ============================================================================
const ApnaHissaLogo = ({ size = 36, showText = true }) => (
  <div className="flex items-center gap-2.5 select-none">
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 drop-shadow-sm"
    >
      <defs>
        <linearGradient id="apnaGrad1" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#059669" />
          <stop offset="100%" stopColor="#0D9488" />
        </linearGradient>
        <linearGradient id="apnaGrad2" x1="24" y1="8" x2="42" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#EA580C" />
        </linearGradient>
      </defs>
      <rect x="4" y="4" width="40" height="40" rx="12" fill="url(#apnaGrad1)" />
      {/* Interlocking Split Ledger Geometry */}
      <path
        d="M15 31L22 15H26L33 31H28.5L27 27.2H21L19.5 31H15ZM22.2 23.8H25.8L24 19.2L22.2 23.8Z"
        fill="white"
      />
      <circle cx="35" cy="14" r="6" fill="url(#apnaGrad2)" stroke="#ffffff" strokeWidth="2" />
      <path d="M33 14H37M35 12V16" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
    {showText && (
      <div className="flex flex-col">
        <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-300 bg-clip-text text-transparent">
          ApnaHissa
        </span>
        <span className="text-[10px] font-medium uppercase tracking-widest text-slate-400 dark:text-slate-500 -mt-1">
          Fair Splits • Clear Ledgers
        </span>
      </div>
    )}
  </div>
);

// ============================================================================
// 4. CATEGORIES & INITIAL SEED DATA (REALISTIC INDIAN & GLOBAL SCENARIOS)
// ============================================================================
const CATEGORIES = [
  { id: 'Food', label: 'Food & Dining', color: '#F59E0B', bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400' },
  { id: 'Rent', label: 'Rent & Housing', color: '#6366F1', bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' },
  { id: 'Shopping', label: 'Shopping', color: '#EC4899', bg: 'bg-pink-500/10 text-pink-600 dark:text-pink-400' },
  { id: 'Travel', label: 'Travel & Trips', color: '#0EA5E9', bg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400' },
  { id: 'Groceries', label: 'Groceries', color: '#10B981', bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
  { id: 'Utilities', label: 'Utilities & Bills', color: '#8B5CF6', bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400' },
  { id: 'Entertainment', label: 'Entertainment', color: '#F43F5E', bg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400' },
  { id: 'Transport', label: 'Transport & Fuel', color: '#14B8A6', bg: 'bg-teal-500/10 text-teal-600 dark:text-teal-400' },
  { id: 'Other', label: 'Other', color: '#64748B', bg: 'bg-slate-500/10 text-slate-600 dark:text-slate-400' },
];

const INITIAL_USERS = [
  { id: 'u1', name: 'Aarav Sharma', email: 'aarav@apnahissa.app', phone: '+91 98765 43210', avatar: 'AS', color: 'bg-emerald-600' },
  { id: 'u2', name: 'Priya Patel', email: 'priya@apnahissa.app', phone: '+91 98234 11223', avatar: 'PP', color: 'bg-indigo-600' },
  { id: 'u3', name: 'Rohan Verma', email: 'rohan@apnahissa.app', phone: '+91 99887 76655', avatar: 'RV', color: 'bg-amber-600' },
  { id: 'u4', name: 'Sneha Nair', email: 'sneha@apnahissa.app', phone: '+91 91234 56789', avatar: 'SN', color: 'bg-rose-600' },
  { id: 'u5', name: 'Kabir Mehta', email: 'kabir@apnahissa.app', phone: '+91 97654 32109', avatar: 'KM', color: 'bg-cyan-600' },
];

const INITIAL_GROUPS = [
  {
    id: 'g1',
    name: 'Flatmates - Koramangala 4B',
    type: 'Flatmates',
    inviteCode: 'FLAT-4B92',
    currency: 'INR',
    createdBy: 'u1',
    members: ['u1', 'u2', 'u3', 'u4'],
    archived: false,
    createdAt: '2026-10-01',
  },
  {
    id: 'g2',
    name: 'Trip to Manali & Kasol',
    type: 'Trip',
    inviteCode: 'MANALI-26',
    currency: 'INR',
    createdBy: 'u2',
    members: ['u1', 'u2', 'u3', 'u5'],
    archived: false,
    createdAt: '2026-10-18',
  },
  {
    id: 'g3',
    name: 'Office Lunch Squad',
    type: 'Office Friends',
    inviteCode: 'LUNCH-88',
    currency: 'INR',
    createdBy: 'u1',
    members: ['u1', 'u3', 'u4'],
    archived: false,
    createdAt: '2026-11-01',
  },
];

const INITIAL_EXPENSES = [
  {
    id: 'e1',
    groupId: 'g1',
    title: 'November Apartment Rent',
    description: 'Monthly 3BHK rent transferred to landlord',
    amountPaise: 4800000, // ₹48,000
    currency: 'INR',
    category: 'Rent',
    date: '2026-11-02',
    paidBy: 'u1',
    payers: [{ userId: 'u1', amountPaise: 4800000 }],
    splitMethod: 'EQUAL',
    splits: [
      { userId: 'u1', amountPaise: 1200000 },
      { userId: 'u2', amountPaise: 1200000 },
      { userId: 'u3', amountPaise: 1200000 },
      { userId: 'u4', amountPaise: 1200000 },
    ],
    createdBy: 'u1',
  },
  {
    id: 'e2',
    groupId: 'g1',
    title: 'Weekend Dinner at Truffles (Sneha skipped)',
    description: 'Burgers & shakes — split among Aarav, Priya & Rohan only',
    amountPaise: 210000, // ₹2,100
    currency: 'INR',
    category: 'Food',
    date: '2026-11-08',
    paidBy: 'u2',
    payers: [{ userId: 'u2', amountPaise: 210000 }],
    splitMethod: 'EQUAL',
    splits: [
      { userId: 'u1', amountPaise: 70000 },
      { userId: 'u2', amountPaise: 70000 },
      { userId: 'u3', amountPaise: 70000 },
    ],
    createdBy: 'u2',
  },
  {
    id: 'e3',
    groupId: 'g2',
    title: 'Volvo Sleeper Bus & Cab Booking',
    description: 'Delhi to Manali round trip',
    amountPaise: 1400000, // ₹14,000
    currency: 'INR',
    category: 'Travel',
    date: '2026-10-22',
    paidBy: 'u3',
    payers: [{ userId: 'u3', amountPaise: 1400000 }],
    splitMethod: 'EQUAL',
    splits: [
      { userId: 'u1', amountPaise: 350000 },
      { userId: 'u2', amountPaise: 350000 },
      { userId: 'u3', amountPaise: 350000 },
      { userId: 'u5', amountPaise: 350000 },
    ],
    createdBy: 'u3',
  },
  {
    id: 'e4',
    groupId: 'g1',
    title: 'ACT Fibernet & BESCOM Electricity',
    description: 'High-speed broadband + electricity bill',
    amountPaise: 440000, // ₹4,400
    currency: 'INR',
    category: 'Utilities',
    date: '2026-11-11',
    paidBy: 'u4',
    payers: [{ userId: 'u4', amountPaise: 440000 }],
    splitMethod: 'EQUAL',
    splits: [
      { userId: 'u1', amountPaise: 110000 },
      { userId: 'u2', amountPaise: 110000 },
      { userId: 'u3', amountPaise: 110000 },
      { userId: 'u4', amountPaise: 110000 },
    ],
    createdBy: 'u4',
  },
  {
    id: 'e5',
    groupId: 'g3',
    title: 'Friday Team Biryani Feast',
    description: 'Behrouz Biryani office order',
    amountPaise: 180000, // ₹1,800
    currency: 'INR',
    category: 'Food',
    date: '2026-11-14',
    paidBy: 'u1',
    payers: [{ userId: 'u1', amountPaise: 180000 }],
    splitMethod: 'SHARES',
    splits: [
      { userId: 'u1', amountPaise: 60000 },
      { userId: 'u3', amountPaise: 60000 },
      { userId: 'u4', amountPaise: 60000 },
    ],
    createdBy: 'u1',
  },
];

const INITIAL_SETTLEMENTS = [
  {
    id: 's1',
    groupId: 'g1',
    fromUserId: 'u3',
    toUserId: 'u1',
    amountPaise: 500000, // ₹5,000
    method: 'UPI',
    reference: 'UPI Ref #631904821',
    status: 'CONFIRMED',
    date: '2026-11-05',
  },
  {
    id: 's2',
    groupId: 'g1',
    fromUserId: 'u2',
    toUserId: 'u1',
    amountPaise: 600000, // ₹6,000
    method: 'UPI',
    reference: 'GPay #99412031',
    status: 'PENDING',
    date: '2026-11-15',
  },
];

const INITIAL_NOTIFICATIONS = [
  {
    id: 'n1',
    title: 'Settlement Confirmation Needed',
    message: 'Priya Patel recorded a ₹6,000 UPI payment to you in Flatmates - Koramangala 4B.',
    time: '2 hours ago',
    read: false,
    type: 'settlement',
  },
  {
    id: 'n2',
    title: 'New Expense Added',
    message: 'Sneha Nair added "ACT Fibernet & BESCOM Electricity" (₹4,400). Your share: ₹1,100.',
    time: '2 days ago',
    read: false,
    type: 'expense',
  },
  {
    id: 'n3',
    title: 'Payment Verified',
    message: 'You confirmed Rohan Verma’s ₹5,000 settlement.',
    time: '6 days ago',
    read: true,
    type: 'confirmed',
  },
];

// ============================================================================
// 5. APPLICATION CONTEXT & STATE STORE (WITH LOCALSTORAGE PERSISTENCE)
// ============================================================================
const AppContext = createContext(null);

const STORAGE_KEY = 'apnahissa_v1_state';

function AppProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('apnahissa_theme');
    return saved ? saved === 'dark' : false;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('apnahissa_user');
    return savedUser ? JSON.parse(savedUser) : INITIAL_USERS[0];
  });

  const [users, setUsers] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).users : INITIAL_USERS;
  });

  const [groups, setGroups] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).groups : INITIAL_GROUPS;
  });

  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).expenses : INITIAL_EXPENSES;
  });

  const [settlements, setSettlements] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).settlements : INITIAL_SETTLEMENTS;
  });

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved).notifications : INITIAL_NOTIFICATIONS;
  });

  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ users, groups, expenses, settlements, notifications })
    );
  }, [users, groups, expenses, settlements, notifications]);

  useEffect(() => {
    localStorage.setItem('apnahissa_theme', darkMode ? 'dark' : 'light');
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('apnahissa_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('apnahissa_user');
    }
  }, [currentUser]);

  const addToast = (message, type = 'success') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  const pushNotification = (title, message, type = 'info') => {
    setNotifications((prev) => [
      {
        id: 'n_' + Date.now(),
        title,
        message,
        time: 'Just now',
        read: false,
        type,
      },
      ...prev,
    ]);
  };

  const getUserById = (id) => users.find((u) => u.id === id) || { id, name: 'Unknown Member', avatar: '??', color: 'bg-slate-500' };

  const resetDemoData = () => {
    setUsers(INITIAL_USERS);
    setGroups(INITIAL_GROUPS);
    setExpenses(INITIAL_EXPENSES);
    setSettlements(INITIAL_SETTLEMENTS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setCurrentUser(INITIAL_USERS[0]);
    addToast('Demo ledger reset to clean initial state.', 'info');
  };

  return (
    <AppContext.Provider
      value={{
        darkMode,
        setDarkMode,
        currentUser,
        setCurrentUser,
        users,
        setUsers,
        groups,
        setGroups,
        expenses,
        setExpenses,
        settlements,
        setSettlements,
        notifications,
        setNotifications,
        addToast,
        pushNotification,
        getUserById,
        resetDemoData,
      }}
    >
      {children}
      {/* Toast Notification Stack */}
      <div className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border backdrop-blur-md transition-all animate-fade-in ${
              t.type === 'error'
                ? 'bg-rose-950/90 border-rose-700 text-rose-100'
                : t.type === 'info'
                ? 'bg-slate-900/90 border-slate-700 text-slate-100'
                : 'bg-emerald-950/90 border-emerald-700 text-emerald-100'
            }`}
          >
            {t.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            )}
            <p className="text-sm font-medium">{t.message}</p>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
}

const useApp = () => useContext(AppContext);

// ============================================================================
// 6. AUTHENTICATION SCREEN (LOGIN, REGISTER, GOOGLE, FORGOT PASSWORD)
// ============================================================================
function AuthScreen() {
  const { users, setUsers, setCurrentUser, addToast } = useApp();
  const [mode, setMode] = useState('login'); // login | register | forgot
  const [email, setEmail] = useState('aarav@apnahissa.app');
  const [password, setPassword] = useState('••••••••••••');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (mode === 'forgot') {
      addToast(`Password reset link sent to ${email}`, 'info');
      setMode('login');
      return;
    }

    if (mode === 'register') {
      if (!name.trim() || !email.trim()) {
        addToast('Please fill in your full name and email.', 'error');
        return;
      }
      const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        setCurrentUser(existing);
        addToast(`Welcome back, ${existing.name}!`);
        return;
      }
      const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      const newUser = {
        id: 'u_' + Date.now(),
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || '+91 90000 00000',
        avatar: initials || 'US',
        color: 'bg-teal-600',
      };
      setUsers((prev) => [...prev, newUser]);
      setCurrentUser(newUser);
      addToast(`Account created! Welcome to ApnaHissa, ${newUser.name}.`);
      return;
    }

    // Login
    const matched = users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || users[0];
    setCurrentUser(matched);
    addToast(`Signed in as ${matched.name}`);
  };

  const handleGoogleSignIn = () => {
    setCurrentUser(users[0]);
    addToast('Signed in with Google (Aarav Sharma)');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-8">
        <div className="flex justify-center mb-6">
          <ApnaHissaLogo size={44} />
        </div>

        <h2 className="text-2xl font-bold text-center text-slate-900 dark:text-white">
          {mode === 'login' && 'Welcome back'}
          {mode === 'register' && 'Create your ApnaHissa account'}
          {mode === 'forgot' && 'Reset your password'}
        </h2>
        <p className="text-sm text-center text-slate-500 dark:text-slate-400 mt-1.5 mb-6">
          {mode === 'login' && 'Track shared expenses & settle group debts effortlessly.'}
          {mode === 'register' && 'Join thousands splitting rent, trips, and dinners fairly.'}
          {mode === 'forgot' && 'Enter your email to receive a secure recovery link.'}
        </p>

        {mode !== 'forgot' && (
          <>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 font-medium text-sm transition shadow-sm"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                />
                <path
                  fill="#34A853"
                  d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.565 24 12.255 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 000 10.76l3.98-3.09z"
                />
                <path
                  fill="#EA4335"
                  d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.69 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                />
              </svg>
              Continue with Google
            </button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200 dark:border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-slate-900 px-3 text-slate-400">or with email</span>
              </div>
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Vikramaditya Rao"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Phone Number (for UPI & Invites)
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Password
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition"
          >
            {mode === 'login' && 'Sign In to ApnaHissa'}
            {mode === 'register' && 'Create Free Account'}
            {mode === 'forgot' && 'Send Reset Link'}
          </button>
        </form>

        {/* Quick Demo Switcher */}
        <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2.5 text-center">
            Instant Demo Accounts (1-Click Switch)
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {users.slice(0, 4).map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => {
                  setCurrentUser(u);
                  addToast(`Switched demo profile to ${u.name}`);
                }}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
              >
                {u.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-center text-slate-500 dark:text-slate-400 mt-6">
          {mode === 'login' ? (
            <>
              New to ApnaHissa?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// 7. ADVANCED BILL SPLITTING MODAL (EQUAL, UNEQUAL, PERCENTAGE, SHARES, EXACT)
// ============================================================================
function AddExpenseModal({ isOpen, onClose, defaultGroupId = null, editExpense = null }) {
  const { currentUser, groups, users, setExpenses, addToast, pushNotification, getUserById } = useApp();

  const activeGroups = groups.filter((g) => !g.archived);
  const [groupId, setGroupId] = useState(editExpense?.groupId || defaultGroupId || activeGroups[0]?.id || '');
  const [title, setTitle] = useState(editExpense?.title || '');
  const [description, setDescription] = useState(editExpense?.description || '');
  const [amountInput, setAmountInput] = useState(editExpense ? (editExpense.amountPaise / 100).toString() : '');
  const [currency, setCurrency] = useState(editExpense?.currency || 'INR');
  const [category, setCategory] = useState(editExpense?.category || 'Food');
  const [date, setDate] = useState(editExpense?.date || new Date().toISOString().split('T')[0]);
  const [paidBy, setPaidBy] = useState(editExpense?.paidBy || currentUser.id);
  const [splitMethod, setSplitMethod] = useState(editExpense?.splitMethod || 'EQUAL'); // EQUAL | UNEQUAL | PERCENTAGE | SHARES | EXACT
  const [receiptName, setReceiptName] = useState(editExpense?.receiptName || '');

  const selectedGroup = groups.find((g) => g.id === groupId) || activeGroups[0];
  const groupMembers = useMemo(
    () => (selectedGroup ? selectedGroup.members.map((id) => getUserById(id)) : []),
    [selectedGroup, users]
  );

  // Selected participants for EQUAL split, or custom inputs per user
  const [selectedParticipants, setSelectedParticipants] = useState({});
  const [customValues, setCustomValues] = useState({});

  useEffect(() => {
    if (!groupMembers.length) return;
    if (editExpense && editExpense.groupId === groupId) {
      const partMap = {};
      const valMap = {};
      groupMembers.forEach((m) => {
        const found = editExpense.splits.find((s) => s.userId === m.id);
        partMap[m.id] = !!found;
        if (found) {
          if (editExpense.splitMethod === 'UNEQUAL' || editExpense.splitMethod === 'EXACT') {
            valMap[m.id] = (found.amountPaise / 100).toString();
          } else {
            valMap[m.id] = '1';
          }
        } else {
          valMap[m.id] = '0';
        }
      });
      setSelectedParticipants(partMap);
      setCustomValues(valMap);
    } else {
      const partMap = {};
      const valMap = {};
      groupMembers.forEach((m) => {
        partMap[m.id] = true;
        valMap[m.id] = splitMethod === 'SHARES' ? '1' : '';
      });
      setSelectedParticipants(partMap);
      setCustomValues(valMap);
      if (!groupMembers.some((m) => m.id === paidBy)) {
        setPaidBy(groupMembers[0].id);
      }
    }
  }, [groupId, editExpense]);

  if (!isOpen) return null;

  const totalPaise = toPaise(amountInput);

  // Compute live split breakdown in paise
  const computeSplits = () => {
    if (totalPaise <= 0) return { valid: false, splits: [], error: 'Enter a valid amount greater than 0.' };

    if (splitMethod === 'EQUAL') {
      const activeIds = groupMembers.filter((m) => selectedParticipants[m.id]).map((m) => m.id);
      if (activeIds.length === 0) {
        return { valid: false, splits: [], error: 'Select at least one participant.' };
      }
      const baseShare = Math.floor(totalPaise / activeIds.length);
      let remainder = totalPaise - baseShare * activeIds.length;
      const splits = activeIds.map((uid) => {
        const extra = remainder > 0 ? 1 : 0;
        if (remainder > 0) remainder--;
        return { userId: uid, amountPaise: baseShare + extra };
      });
      return { valid: true, splits, error: null };
    }

    if (splitMethod === 'UNEQUAL' || splitMethod === 'EXACT') {
      let sumPaise = 0;
      const splits = [];
      groupMembers.forEach((m) => {
        const valPaise = toPaise(customValues[m.id] || 0);
        if (valPaise > 0) {
          sumPaise += valPaise;
          splits.push({ userId: m.id, amountPaise: valPaise });
        }
      });
      const diff = totalPaise - sumPaise;
      if (Math.abs(diff) > 0) {
        return {
          valid: false,
          splits,
          error:
            diff > 0
              ? `${formatCurrency(diff, currency)} remaining to allocate`
              : `Over-allocated by ${formatCurrency(-diff, currency)}`,
        };
      }
      return { valid: true, splits, error: null };
    }

    if (splitMethod === 'PERCENTAGE') {
      let totalPct = 0;
      const entries = [];
      groupMembers.forEach((m) => {
        const pct = parseFloat(customValues[m.id] || 0);
        if (pct > 0) {
          totalPct += pct;
          entries.push({ userId: m.id, pct });
        }
      });
      if (Math.abs(totalPct - 100) > 0.01) {
        return {
          valid: false,
          splits: [],
          error: `Percentages sum to ${totalPct.toFixed(1)}% (must equal 100%)`,
        };
      }
      let allocated = 0;
      const splits = entries.map((item, idx) => {
        if (idx === entries.length - 1) {
          return { userId: item.userId, amountPaise: totalPaise - allocated };
        }
        const share = Math.round((totalPaise * item.pct) / 100);
        allocated += share;
        return { userId: item.userId, amountPaise: share };
      });
      return { valid: true, splits, error: null };
    }

    if (splitMethod === 'SHARES') {
      let totalShares = 0;
      const entries = [];
      groupMembers.forEach((m) => {
        const sh = parseFloat(customValues[m.id] || 0);
        if (sh > 0) {
          totalShares += sh;
          entries.push({ userId: m.id, shares: sh });
        }
      });
      if (totalShares <= 0) {
        return { valid: false, splits: [], error: 'Assign at least 1 share to a participant.' };
      }
      let allocated = 0;
      const splits = entries.map((item, idx) => {
        if (idx === entries.length - 1) {
          return { userId: item.userId, amountPaise: totalPaise - allocated };
        }
        const share = Math.round((totalPaise * item.shares) / totalShares);
        allocated += share;
        return { userId: item.userId, amountPaise: share };
      });
      return { valid: true, splits, error: null };
    }

    return { valid: false, splits: [], error: 'Invalid split method.' };
  };

  const splitPreview = computeSplits();

  const handleSave = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      addToast('Please enter an expense title.', 'error');
      return;
    }
    if (!splitPreview.valid) {
      addToast(splitPreview.error, 'error');
      return;
    }

    const expenseObj = {
      id: editExpense ? editExpense.id : 'exp_' + Date.now(),
      groupId,
      title: title.trim(),
      description: description.trim(),
      amountPaise: totalPaise,
      currency,
      category,
      date,
      paidBy,
      payers: [{ userId: paidBy, amountPaise: totalPaise }],
      splitMethod,
      splits: splitPreview.splits,
      receiptName,
      createdBy: editExpense ? editExpense.createdBy : currentUser.id,
    };

    if (editExpense) {
      setExpenses((prev) => prev.map((item) => (item.id === editExpense.id ? expenseObj : item)));
      addToast('Expense updated & balances recalculated.');
    } else {
      setExpenses((prev) => [expenseObj, ...prev]);
      const payerName = getUserById(paidBy).name;
      pushNotification(
        `New Expense in ${selectedGroup?.name}`,
        `${payerName} paid ${formatCurrency(totalPaise, currency)} for "${title.trim()}".`,
        'expense'
      );
      addToast('Expense added successfully!');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editExpense ? 'Edit Expense' : 'Add Shared Expense'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Exact integer-paisa split calculation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Group & Category Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Group
              </label>
              <select
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {activeGroups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Expense Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Dinner at Mainland China"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Amount ({CURRENCIES[currency].symbol})
              </label>
              <div className="flex">
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="px-2.5 py-2.5 rounded-l-xl border border-r-0 border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-sm font-semibold"
                >
                  {Object.keys(CURRENCIES).map((code) => (
                    <option key={code} value={code}>
                      {CURRENCIES[code].symbol}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="2000.00"
                  className="w-full px-3 py-2.5 rounded-r-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Paid By & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Paid By
              </label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {groupMembers.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.id === currentUser.id ? '(You)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Notes & Optional Receipt */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Description / Note (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Split among 3 who attended"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Attach Receipt (Optional)
              </label>
              <label className="flex items-center justify-between px-3.5 py-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-xs text-slate-500 dark:text-slate-400 cursor-pointer hover:border-emerald-500 transition">
                <span className="truncate">{receiptName || 'Upload bill image / PDF...'}</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold ml-2">Browse</span>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) setReceiptName(e.target.files[0].name);
                  }}
                />
              </label>
            </div>
          </div>

          {/* Splitting Method Selector */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Split Method
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'EQUAL', label: 'Equally' },
                  { id: 'UNEQUAL', label: 'Unequally' },
                  { id: 'PERCENTAGE', label: 'Percentage (%)' },
                  { id: 'SHARES', label: 'Shares' },
                  { id: 'EXACT', label: 'Exact Amounts' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSplitMethod(tab.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      splitMethod === tab.id
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Participant Split List */}
            <div className="space-y-2.5 mt-3">
              {groupMembers.map((member) => {
                const calculatedSplit = splitPreview.splits.find((s) => s.userId === member.id);
                const isChecked = !!selectedParticipants[member.id];

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800"
                  >
                    <div className="flex items-center gap-3">
                      {splitMethod === 'EQUAL' && (
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            setSelectedParticipants((prev) => ({
                              ...prev,
                              [member.id]: e.target.checked,
                            }))
                          }
                          className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                        />
                      )}
                      <div
                        className={`w-8 h-8 rounded-full ${member.color} text-white text-xs font-bold flex items-center justify-center`}
                      >
                        {member.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                          {member.name} {member.id === currentUser.id && '(You)'}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          {calculatedSplit
                            ? `Owes ${formatCurrency(calculatedSplit.amountPaise, currency)}`
                            : 'Excluded (₹0)'}
                        </p>
                      </div>
                    </div>

                    {splitMethod === 'EQUAL' ? (
                      <span
                        className={`text-sm font-bold ${
                          isChecked ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 line-through'
                        }`}
                      >
                        {calculatedSplit ? formatCurrency(calculatedSplit.amountPaise, currency) : '₹0'}
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          step={splitMethod === 'SHARES' ? '0.5' : '0.01'}
                          min="0"
                          value={customValues[member.id] ?? ''}
                          onChange={(e) =>
                            setCustomValues((prev) => ({
                              ...prev,
                              [member.id]: e.target.value,
                            }))
                          }
                          placeholder="0"
                          className="w-24 px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-right text-sm font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <span className="text-xs font-bold text-slate-500 w-6">
                          {splitMethod === 'PERCENTAGE'
                            ? '%'
                            : splitMethod === 'SHARES'
                            ? 'sh'
                            : CURRENCIES[currency].symbol}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Validation Status Banner */}
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              {splitPreview.valid ? (
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  Split balanced accurately ({formatCurrency(totalPaise, currency)})
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold">
                  <AlertCircle className="w-4 h-4" />
                  {splitPreview.error}
                </span>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!splitPreview.valid}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold shadow-md shadow-emerald-600/20 transition"
            >
              {editExpense ? 'Save Changes' : 'Save Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// 8. SETTLE UP MODAL (WITH UPI VERIFICATION SAFEGUARD & CONFIRMATION FLOW)
// ============================================================================
function SettleUpModal({ isOpen, onClose, prefill = null }) {
  const { currentUser, groups, setSettlements, addToast, pushNotification, getUserById } = useApp();

  const activeGroups = groups.filter((g) => !g.archived);
  const [groupId, setGroupId] = useState(prefill?.groupId || activeGroups[0]?.id || '');
  const [fromUserId, setFromUserId] = useState(prefill?.fromUserId || currentUser.id);
  const [toUserId, setToUserId] = useState(prefill?.toUserId || '');
  const [amountInput, setAmountInput] = useState(prefill?.amountPaise ? (prefill.amountPaise / 100).toString() : '');
  const [method, setMethod] = useState('UPI');
  const [reference, setReference] = useState('');

  const selectedGroup = groups.find((g) => g.id === groupId) || activeGroups[0];
  const members = selectedGroup ? selectedGroup.members.map((id) => getUserById(id)) : [];

  useEffect(() => {
    if (prefill) {
      setGroupId(prefill.groupId);
      setFromUserId(prefill.fromUserId);
      setToUserId(prefill.toUserId);
      setAmountInput((prefill.amountPaise / 100).toString());
    } else if (members.length >= 2 && !toUserId) {
      const other = members.find((m) => m.id !== fromUserId);
      if (other) setToUserId(other.id);
    }
  }, [prefill, groupId]);

  if (!isOpen) return null;

  const handleRecordSettlement = (e) => {
    e.preventDefault();
    const amountPaise = toPaise(amountInput);
    if (amountPaise <= 0) {
      addToast('Enter a valid settlement amount.', 'error');
      return;
    }
    if (fromUserId === toUserId) {
      addToast('Payer and recipient cannot be the same person.', 'error');
      return;
    }

    // Security rule: UPI or external payment stays PENDING until recipient verifies receipt,
    // unless the recipient themselves is logging cash received directly.
    const autoConfirmed = toUserId === currentUser.id && method === 'Cash';

    const newSettlement = {
      id: 'stl_' + Date.now(),
      groupId,
      fromUserId,
      toUserId,
      amountPaise,
      method,
      reference: reference.trim() || `${method} Transfer`,
      status: autoConfirmed ? 'CONFIRMED' : 'PENDING',
      date: new Date().toISOString().split('T')[0],
    };

    setSettlements((prev) => [newSettlement, ...prev]);

    const payer = getUserById(fromUserId);
    const receiver = getUserById(toUserId);

    pushNotification(
      autoConfirmed ? 'Cash Settlement Recorded' : 'Settlement Awaiting Confirmation',
      `${payer.name} recorded ${formatCurrency(amountPaise)} via ${method} to ${receiver.name}.`,
      'settlement'
    );

    addToast(
      autoConfirmed
        ? 'Cash payment confirmed and balances updated!'
        : `Settlement recorded as PENDING until ${receiver.name} confirms payment verification.`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Settle Up Balance</h3>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleRecordSettlement} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Group
            </label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
            >
              {activeGroups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Payer (From)
              </label>
              <select
                value={fromUserId}
                onChange={(e) => setFromUserId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Recipient (To)
              </label>
              <select
                value={toUserId}
                onChange={(e) => setToUserId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Settlement Amount (₹)
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              required
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="0.00"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-lg font-bold outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Payment Method
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'UPI', icon: Smartphone },
                { id: 'Cash', icon: Banknote },
                { id: 'Bank', icon: CreditCard },
                { id: 'Other', icon: Wallet },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setMethod(item.id)}
                    className={`flex flex-col items-center justify-center gap-1 py-2.5 rounded-xl border text-xs font-semibold transition ${
                      method === item.id
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.id}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              UTR / Reference ID (Optional)
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g., UPI Ref #492817492"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
            />
          </div>

          {method === 'UPI' && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <span>
                <strong>Payment Verification Safeguard:</strong> UPI transfers remain marked as{' '}
                <em>Pending Verification</em> until the recipient confirms receipt in their bank account.
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-md"
            >
              Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// 9. CREATE / JOIN GROUP MODAL
// ============================================================================
function GroupModal({ isOpen, onClose }) {
  const { currentUser, users, setUsers, groups, setGroups, addToast } = useApp();
  const [tab, setTab] = useState('create'); // create | join
  const [groupName, setGroupName] = useState('');
  const [groupType, setGroupType] = useState('Flatmates');
  const [selectedMembers, setSelectedMembers] = useState([currentUser.id]);
  const [newInviteName, setNewInviteName] = useState('');
  const [newInviteEmail, setNewInviteEmail] = useState('');
  const [inviteCodeInput, setInviteCodeInput] = useState('');

  if (!isOpen) return null;

  const toggleMember = (id) => {
    if (id === currentUser.id) return;
    setSelectedMembers((prev) => (prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]));
  };

  const handleAddCustomMember = () => {
    if (!newInviteName.trim()) return;
    const initials = newInviteName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    const created = {
      id: 'u_' + Date.now(),
      name: newInviteName.trim(),
      email: newInviteEmail.trim() || `${newInviteName.toLowerCase().replace(/\s+/g, '')}@invite.app`,
      phone: '+91 98000 00000',
      avatar: initials || 'MB',
      color: 'bg-purple-600',
    };
    setUsers((prev) => [...prev, created]);
    setSelectedMembers((prev) => [...prev, created.id]);
    setNewInviteName('');
    setNewInviteEmail('');
    addToast(`Added ${created.name} to invite list.`);
  };

  const handleCreateGroup = (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      addToast('Enter a group name.', 'error');
      return;
    }
    const code =
      groupName
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase()
        .slice(0, 5) +
      '-' +
      Math.floor(10 + Math.random() * 89);

    const newGroup = {
      id: 'g_' + Date.now(),
      name: groupName.trim(),
      type: groupType,
      inviteCode: code,
      currency: 'INR',
      createdBy: currentUser.id,
      members: selectedMembers,
      archived: false,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setGroups((prev) => [newGroup, ...prev]);
    addToast(`Group "${newGroup.name}" created! Invite Code: ${code}`);
    setGroupName('');
    onClose();
  };

  const handleJoinGroup = (e) => {
    e.preventDefault();
    const cleaned = inviteCodeInput.trim().toUpperCase();
    const target = groups.find((g) => g.inviteCode.toUpperCase() === cleaned);
    if (!target) {
      addToast('Invalid invite code. Try "FLAT-4B92" or "MANALI-26".', 'error');
      return;
    }
    if (target.members.includes(currentUser.id)) {
      addToast(`You are already a member of ${target.name}.`, 'info');
      onClose();
      return;
    }
    setGroups((prev) =>
      prev.map((g) => (g.id === target.id ? { ...g, members: [...g.members, currentUser.id] } : g))
    );
    addToast(`Joined "${target.name}" successfully!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex gap-2">
            <button
              onClick={() => setTab('create')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                tab === 'create'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Create New Group
            </button>
            <button
              onClick={() => setTab('join')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                tab === 'join'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              Join via Invite Code
            </button>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {tab === 'create' ? (
          <form onSubmit={handleCreateGroup} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Group Name
              </label>
              <input
                type="text"
                required
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g., Goa Beach Villa, Flatmates, Family"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Group Type
              </label>
              <div className="flex flex-wrap gap-2">
                {['Flatmates', 'Trip', 'Office Friends', 'College Friends', 'Family', 'Couple'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setGroupType(t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                      groupType === t
                        ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Select Members ({selectedMembers.length} selected)
              </label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {users.map((u) => (
                  <label
                    key={u.id}
                    className="flex items-center justify-between p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-full ${u.color} text-white text-xs font-bold flex items-center justify-center`}>
                        {u.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {u.name} {u.id === currentUser.id && '(You)'}
                        </p>
                        <p className="text-[11px] text-slate-400">{u.email}</p>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(u.id)}
                      disabled={u.id === currentUser.id}
                      onChange={() => toggleMember(u.id)}
                      className="w-4 h-4 accent-emerald-600"
                    />
                  </label>
                ))}
              </div>
            </div>

            {/* Invite New Friend Inline */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5 text-emerald-600" /> Invite Someone New
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newInviteName}
                  onChange={(e) => setNewInviteName(e.target.value)}
                  placeholder="Friend's Name"
                  className="w-1/2 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                />
                <input
                  type="email"
                  value={newInviteEmail}
                  onChange={(e) => setNewInviteEmail(e.target.value)}
                  placeholder="Email (optional)"
                  className="w-1/2 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleAddCustomMember}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-emerald-600 text-white text-xs font-semibold shrink-0"
                >
                  Add
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-md"
              >
                Create Group
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleJoinGroup} className="p-6 space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Enter an invitation code shared by your group admin to join immediately.
            </p>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                Invitation Code
              </label>
              <input
                type="text"
                required
                value={inviteCodeInput}
                onChange={(e) => setInviteCodeInput(e.target.value)}
                placeholder="e.g., MANALI-26"
                className="w-full px-4 py-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono uppercase tracking-widest text-center text-base"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-md"
              >
                Join Group
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 10. MAIN APPLICATION SHELL & VIEWS
// ============================================================================
function MainApp() {
  const {
    darkMode,
    setDarkMode,
    currentUser,
    setCurrentUser,
    users,
    groups,
    setGroups,
    expenses,
    setExpenses,
    settlements,
    setSettlements,
    notifications,
    setNotifications,
    addToast,
    getUserById,
    resetDemoData,
  } = useApp();

  const [activeView, setActiveView] = useState('dashboard'); // dashboard | groups | groupDetail | activity | analytics | settings
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [showSettleUp, setShowSettleUp] = useState(false);
  const [settlePrefill, setSettlePrefill] = useState(null);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);

  // Filters for Personal Expense History
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterGroup, setFilterGroup] = useState('ALL');

  // Compute global balances for current user across all groups
  const userGroups = useMemo(
    () => groups.filter((g) => g.members.includes(currentUser.id)),
    [groups, currentUser.id]
  );

  const financialSummary = useMemo(() => {
    let totalOwedToMe = 0;
    let totalIOwe = 0;
    let monthlySpendPaise = 0;
    const currentMonthPrefix = '2026-11';

    userGroups.forEach((g) => {
      const gExpenses = expenses.filter((e) => e.groupId === g.id);
      const gSettlements = settlements.filter((s) => s.groupId === g.id);
      const memberObjs = g.members.map((id) => getUserById(id));
      const netMap = calculateNetBalances(memberObjs, gExpenses, gSettlements);
      const simplified = simplifyDebts(netMap);

      simplified.forEach((tx) => {
        if (tx.to === currentUser.id) totalOwedToMe += tx.amountPaise;
        if (tx.from === currentUser.id) totalIOwe += tx.amountPaise;
      });
    });

    expenses.forEach((exp) => {
      if (exp.date.startsWith(currentMonthPrefix)) {
        const mySplit = exp.splits.find((s) => s.userId === currentUser.id);
        if (mySplit) monthlySpendPaise += mySplit.amountPaise;
      }
    });

    return {
      totalOwedToMe,
      totalIOwe,
      netBalance: totalOwedToMe - totalIOwe,
      monthlySpendPaise,
    };
  }, [userGroups, expenses, settlements, currentUser.id, users]);

  const pendingSettlementsForUser = useMemo(
    () =>
      settlements.filter(
        (s) =>
          s.status === 'PENDING' &&
          (s.toUserId === currentUser.id || s.fromUserId === currentUser.id)
      ),
    [settlements, currentUser.id]
  );

  const unreadNotifCount = notifications.filter((n) => !n.read).length;

  const handleConfirmSettlement = (settlementId) => {
    setSettlements((prev) =>
      prev.map((s) => (s.id === settlementId ? { ...s, status: 'CONFIRMED' } : s))
    );
    addToast('Payment confirmed! Group balances updated.');
  };

  const handleRejectSettlement = (settlementId) => {
    setSettlements((prev) =>
      prev.map((s) => (s.id === settlementId ? { ...s, status: 'REJECTED' } : s))
    );
    addToast('Settlement request rejected.', 'error');
  };

  const handleDeleteExpense = (exp) => {
    if (exp.createdBy !== currentUser.id && exp.paidBy !== currentUser.id) {
      addToast('Permission denied: Only the creator or payer can delete this expense.', 'error');
      return;
    }
    setExpenses((prev) => prev.filter((e) => e.id !== exp.id));
    addToast('Expense deleted and balances recalculated.');
  };

  const handleExportCSV = () => {
    const headers = ['Date', 'Title', 'Group', 'Category', 'Total Amount (INR)', 'Paid By', 'Your Share (INR)'];
    const rows = expenses.map((e) => {
      const grp = groups.find((g) => g.id === e.groupId)?.name || 'Unknown';
      const payer = getUserById(e.paidBy).name;
      const myShare = e.splits.find((s) => s.userId === currentUser.id)?.amountPaise || 0;
      return [
        e.date,
        `"${e.title.replace(/"/g, '""')}"`,
        `"${grp}"`,
        e.category,
        (e.amountPaise / 100).toFixed(2),
        `"${payer}"`,
        (myShare / 100).toFixed(2),
      ].join(',');
    });
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ApnaHissa_Statement_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Expense statement exported to CSV.');
  };

  // ==========================================================================
  // VIEW 1: DASHBOARD
  // ==========================================================================
  const renderDashboard = () => {
    const recentExpenses = [...expenses]
      .filter((e) => userGroups.some((g) => g.id === e.groupId))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);

    return (
      <div className="space-y-6">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Namaste, {currentUser.name.split(' ')[0]}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Here is your real-time shared expense & settlement overview.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => {
                setEditingExpense(null);
                setShowAddExpense(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-md shadow-emerald-600/20 transition"
            >
              <Plus className="w-4 h-4" /> Add Expense
            </button>
            <button
              onClick={() => {
                setSettlePrefill(null);
                setShowSettleUp(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold shadow-md shadow-teal-600/20 transition"
            >
              <CheckCircle2 className="w-4 h-4" /> Settle Up
            </button>
            <button
              onClick={() => setShowGroupModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 text-sm font-semibold transition"
            >
              <Users className="w-4 h-4 text-emerald-600" /> New Group
            </button>
          </div>
        </div>

        {/* 4 Summary Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Net Balance</span>
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Wallet className="w-4 h-4" />
              </div>
            </div>
            <p
              className={`text-2xl font-extrabold ${
                financialSummary.netBalance >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatCurrency(financialSummary.netBalance, 'INR', true)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {financialSummary.netBalance >= 0 ? 'Overall you are owed' : 'Overall you owe'}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">You Are Owed</span>
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {formatCurrency(financialSummary.totalOwedToMe)}
            </p>
            <p className="text-xs text-teal-600 dark:text-teal-400 mt-1">Across {userGroups.length} active groups</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">You Owe</span>
              <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {formatCurrency(financialSummary.totalIOwe)}
            </p>
            <p className="text-xs text-rose-500 mt-1">Simplified debt total</p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Nov Personal Share</span>
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <PieChart className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {formatCurrency(financialSummary.monthlySpendPaise)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Your share of Nov bills</p>
          </div>
        </div>

        {/* Pending Settlement Verification Banner */}
        {pendingSettlementsForUser.length > 0 && (
          <div className="p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Pending Settlement Verifications ({pendingSettlementsForUser.length})
              </h3>
            </div>
            <div className="space-y-2.5">
              {pendingSettlementsForUser.map((stl) => {
                const payer = getUserById(stl.fromUserId);
                const receiver = getUserById(stl.toUserId);
                const grp = groups.find((g) => g.id === stl.groupId);
                const isRecipient = stl.toUserId === currentUser.id;

                return (
                  <div
                    key={stl.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/70 dark:border-slate-800"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {payer.name} paid {receiver.name}{' '}
                        <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                          {formatCurrency(stl.amountPaise)}
                        </span>
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {grp?.name} • {stl.method} ({stl.reference}) • {stl.date}
                      </p>
                    </div>
                    {isRecipient ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleConfirmSettlement(stl.id)}
                          className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Confirm Receipt
                        </button>
                        <button
                          onClick={() => handleRejectSettlement(stl.id)}
                          className="px-3 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-xs font-semibold"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 self-start sm:self-center">
                        Awaiting {receiver.name}'s confirmation
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Groups & Recent Transactions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Active Groups */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Active Groups</h2>
              <button
                onClick={() => setActiveView('groups')}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                View all <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {userGroups
                .filter((g) => !g.archived)
                .map((grp) => {
                  const gExpenses = expenses.filter((e) => e.groupId === grp.id);
                  const gSettlements = settlements.filter((s) => s.groupId === grp.id);
                  const memberObjs = grp.members.map((id) => getUserById(id));
                  const netMap = calculateNetBalances(memberObjs, gExpenses, gSettlements);
                  const myNet = netMap[currentUser.id] || 0;

                  return (
                    <div
                      key={grp.id}
                      onClick={() => {
                        setSelectedGroupId(grp.id);
                        setActiveView('groupDetail');
                      }}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500/60 cursor-pointer transition shadow-sm group"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {grp.type}
                          </span>
                          <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                            {grp.name}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {grp.members.length} members • {gExpenses.length} expenses
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-slate-400 block">Your balance</span>
                          <span
                            className={`text-sm font-extrabold ${
                              myNet > 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : myNet < 0
                                ? 'text-rose-600 dark:text-rose-400'
                                : 'text-slate-500'
                            }`}
                          >
                            {myNet === 0 ? 'Settled' : formatCurrency(myNet, grp.currency, true)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Expenses</h2>
              <button
                onClick={() => setActiveView('activity')}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                Full ledger <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-sm">
              {recentExpenses.map((exp) => {
                const grp = groups.find((g) => g.id === exp.groupId);
                const payer = getUserById(exp.paidBy);
                const mySplit = exp.splits.find((s) => s.userId === currentUser.id);
                const catMeta = CATEGORIES.find((c) => c.id === exp.category) || CATEGORIES[8];

                return (
                  <div key={exp.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${catMeta.bg}`}>
                        {exp.category.slice(0, 3).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{exp.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {payer.id === currentUser.id ? 'You' : payer.name} paid{' '}
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {formatCurrency(exp.amountPaise, exp.currency)}
                          </span>{' '}
                          • {grp?.name}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {exp.paidBy === currentUser.id ? (
                        <>
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium block">
                            You lent
                          </span>
                          <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(exp.amountPaise - (mySplit?.amountPaise || 0), exp.currency)}
                          </span>
                        </>
                      ) : mySplit ? (
                        <>
                          <span className="text-[11px] text-rose-500 font-medium block">You borrowed</span>
                          <span className="text-sm font-extrabold text-rose-600 dark:text-rose-400">
                            {formatCurrency(mySplit.amountPaise, exp.currency)}
                          </span>
                        </>
                      ) : (
                        <span className="text-xs font-medium text-slate-400">Not involved</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================================================
  // VIEW 2: GROUP DETAIL (BALANCES, SIMPLIFIED DEBTS, EXPENSES, MEMBERS)
  // ==========================================================================
  const renderGroupDetail = () => {
    const grp = groups.find((g) => g.id === selectedGroupId) || userGroups[0];
    if (!grp) return null;

    const gExpenses = expenses.filter((e) => e.groupId === grp.id);
    const gSettlements = settlements.filter((s) => s.groupId === grp.id);
    const memberObjs = grp.members.map((id) => getUserById(id));
    const netMap = calculateNetBalances(memberObjs, gExpenses, gSettlements);
    const simplified = simplifyDebts(netMap);
    const totalGroupSpend = gExpenses.reduce((acc, e) => acc + e.amountPaise, 0);

    const handleCopyInvite = () => {
      navigator.clipboard?.writeText(`Join "${grp.name}" on ApnaHissa with code: ${grp.inviteCode}`);
      addToast(`Invite code "${grp.inviteCode}" copied to clipboard!`);
    };

    const handleArchiveToggle = () => {
      if (grp.createdBy !== currentUser.id) {
        addToast('Only the group creator can archive or restore this group.', 'error');
        return;
      }
      setGroups((prev) => prev.map((g) => (g.id === grp.id ? { ...g, archived: !g.archived } : g)));
      addToast(grp.archived ? 'Group restored!' : 'Group archived.');
    };

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button
                onClick={() => setActiveView('groups')}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                ← All Groups
              </button>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <span className="text-xs font-semibold text-slate-500">{grp.type}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">{grp.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Total Group Spend: <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(totalGroupSpend, grp.currency)}</strong></span>
              <span>•</span>
              <button
                onClick={handleCopyInvite}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition"
              >
                <Copy className="w-3 h-3 text-emerald-600" /> Invite: {grp.inviteCode}
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => {
                setEditingExpense(null);
                setShowAddExpense(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-sm"
            >
              <Plus className="w-4 h-4" /> Add Expense
            </button>
            <button
              onClick={() => {
                setSettlePrefill({ groupId: grp.id, fromUserId: currentUser.id, toUserId: '', amountPaise: 0 });
                setShowSettleUp(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" /> Settle Up
            </button>
            <button
              onClick={handleArchiveToggle}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {grp.archived ? 'Unarchive' : 'Archive'}
            </button>
          </div>
        </div>

        {/* Simplified Debt Suggestions & Member Balances */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Simplified Settlement Plan */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-500" /> Simplified Settlement Plan
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Minimum transfers required to clear all group debts
                </p>
              </div>
            </div>

            {simplified.length === 0 ? (
              <div className="py-8 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">All balances are settled!</p>
                <p className="text-xs text-slate-400">Nobody owes anything in this group.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {simplified.map((tx, idx) => {
                  const fromUser = getUserById(tx.from);
                  const toUser = getUserById(tx.to);
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60"
                    >
                      <div className="flex items-center gap-2.5 text-sm">
                        <span className="font-bold text-slate-800 dark:text-slate-200">{fromUser.name}</span>
                        <ArrowRight className="w-4 h-4 text-slate-400" />
                        <span className="font-bold text-slate-800 dark:text-slate-200">{toUser.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(tx.amountPaise, grp.currency)}
                        </span>
                        <button
                          onClick={() => {
                            setSettlePrefill({
                              groupId: grp.id,
                              fromUserId: tx.from,
                              toUserId: tx.to,
                              amountPaise: tx.amountPaise,
                            });
                            setShowSettleUp(true);
                          }}
                          className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
                        >
                          Settle
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Individual Member Net Balances */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Member Net Positions</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Total paid minus total share consumed
            </p>
            <div className="space-y-3">
              {memberObjs.map((m) => {
                const net = netMap[m.id] || 0;
                return (
                  <div key={m.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${m.color} text-white text-xs font-bold flex items-center justify-center`}>
                        {m.avatar}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {m.name} {m.id === currentUser.id && '(You)'}
                        </p>
                        <p className="text-[11px] text-slate-400">{m.email}</p>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-extrabold ${
                        net > 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : net < 0
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {net === 0 ? '₹0 (Settled)' : formatCurrency(net, grp.currency, true)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Group Expense Ledger */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Group Expense History ({gExpenses.length})
            </h3>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {gExpenses.length === 0 ? (
              <p className="p-8 text-center text-sm text-slate-400">No expenses logged in this group yet.</p>
            ) : (
              gExpenses.map((exp) => {
                const payer = getUserById(exp.paidBy);
                const catMeta = CATEGORIES.find((c) => c.id === exp.category) || CATEGORIES[8];
                return (
                  <div key={exp.id} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${catMeta.bg}`}>
                        {exp.category.slice(0, 3).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{exp.title}</h4>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500">
                            {exp.splitMethod}
                          </span>
                        </div>
                        {exp.description && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{exp.description}</p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                          Paid by <strong className="text-slate-600 dark:text-slate-300">{payer.name}</strong> on {exp.date} • Split among {exp.splits.length} members
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <span className="text-base font-extrabold text-slate-900 dark:text-white">
                        {formatCurrency(exp.amountPaise, exp.currency)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingExpense(exp);
                            setShowAddExpense(true);
                          }}
                          title="Edit Expense"
                          className="p-2 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(exp)}
                          title="Delete Expense"
                          className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    );
  };

  // ==========================================================================
  // VIEW 3: GROUPS DIRECTORY
  // ==========================================================================
  const renderGroupsDirectory = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Your Groups</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage flatmates, trips, office squads, and invite links.
          </p>
        </div>
        <button
          onClick={() => setShowGroupModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shadow-md"
        >
          <Plus className="w-4 h-4" /> Create / Join Group
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {userGroups.map((grp) => {
          const gExpenses = expenses.filter((e) => e.groupId === grp.id);
          const gSettlements = settlements.filter((s) => s.groupId === grp.id);
          const memberObjs = grp.members.map((id) => getUserById(id));
          const netMap = calculateNetBalances(memberObjs, gExpenses, gSettlements);
          const myNet = netMap[currentUser.id] || 0;

          return (
            <div
              key={grp.id}
              onClick={() => {
                setSelectedGroupId(grp.id);
                setActiveView('groupDetail');
              }}
              className={`p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-500 cursor-pointer transition shadow-sm flex flex-col justify-between ${
                grp.archived ? 'opacity-60' : ''
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    {grp.type}
                  </span>
                  <span className="text-xs font-mono text-slate-400">{grp.inviteCode}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{grp.name}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Created {grp.createdAt} • {grp.archived ? 'Archived' : 'Active'}
                </p>

                {/* Member Avatars */}
                <div className="flex items-center -space-x-2 mt-4">
                  {memberObjs.map((m) => (
                    <div
                      key={m.id}
                      title={m.name}
                      className={`w-8 h-8 rounded-full ${m.color} text-white text-xs font-bold flex items-center justify-center ring-2 ring-white dark:ring-slate-900`}
                    >
                      {m.avatar}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500">Your net position</span>
                <span
                  className={`text-sm font-extrabold ${
                    myNet > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : myNet < 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-400'
                  }`}
                >
                  {myNet === 0 ? 'Settled up' : formatCurrency(myNet, grp.currency, true)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ==========================================================================
  // VIEW 4: PERSONAL EXPENSE HISTORY & SEARCH/FILTER + CSV EXPORT
  // ==========================================================================
  const renderActivity = () => {
    const filtered = expenses
      .filter((e) => userGroups.some((g) => g.id === e.groupId))
      .filter((e) => {
        if (filterCategory !== 'ALL' && e.category !== filterCategory) return false;
        if (filterGroup !== 'ALL' && e.groupId !== filterGroup) return false;
        if (
          searchQuery.trim() &&
          !e.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !(e.description || '').toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Personal Expense Ledger</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Search, filter, audit, and export every shared transaction.
            </p>
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-sm font-semibold transition self-start"
          >
            <Download className="w-4 h-4" /> Export CSV Report
          </button>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title or notes..."
              className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none"
            />
          </div>

          <select
            value={filterGroup}
            onChange={(e) => setFilterGroup(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none"
          >
            <option value="ALL">All Groups</option>
            {userGroups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white outline-none"
          >
            <option value="ALL">All Categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Ledger Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-50/60 dark:bg-slate-800/40">
                  <th className="py-3.5 px-5">Date</th>
                  <th className="py-3.5 px-5">Expense</th>
                  <th className="py-3.5 px-5">Group</th>
                  <th className="py-3.5 px-5">Paid By</th>
                  <th className="py-3.5 px-5 text-right">Total Bill</th>
                  <th className="py-3.5 px-5 text-right">Your Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {filtered.map((exp) => {
                  const grp = groups.find((g) => g.id === exp.groupId);
                  const payer = getUserById(exp.paidBy);
                  const mySplit = exp.splits.find((s) => s.userId === currentUser.id);
                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30">
                      <td className="py-3.5 px-5 text-xs text-slate-500 whitespace-nowrap">{exp.date}</td>
                      <td className="py-3.5 px-5">
                        <p className="font-bold text-slate-900 dark:text-white">{exp.title}</p>
                        <span className="text-[11px] text-slate-400">{exp.category} • {exp.splitMethod}</span>
                      </td>
                      <td className="py-3.5 px-5 text-xs font-medium text-slate-600 dark:text-slate-300">
                        {grp?.name}
                      </td>
                      <td className="py-3.5 px-5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        {payer.id === currentUser.id ? 'You' : payer.name}
                      </td>
                      <td className="py-3.5 px-5 text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(exp.amountPaise, exp.currency)}
                      </td>
                      <td className="py-3.5 px-5 text-right font-extrabold text-emerald-600 dark:text-emerald-400">
                        {mySplit ? formatCurrency(mySplit.amountPaise, exp.currency) : '₹0'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================================================
  // VIEW 5: ANALYTICS & SPENDING INSIGHTS
  // ==========================================================================
  const renderAnalytics = () => {
    const categoryTotals = {};
    let totalUserConsumption = 0;
    let totalUserPaid = 0;

    expenses.forEach((exp) => {
      if (exp.paidBy === currentUser.id) totalUserPaid += exp.amountPaise;
      const mySplit = exp.splits.find((s) => s.userId === currentUser.id);
      if (mySplit) {
        totalUserConsumption += mySplit.amountPaise;
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + mySplit.amountPaise;
      }
    });

    const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Spending Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Category breakdown, personal consumption vs out-of-pocket payments, and group distribution.
          </p>
        </div>

        {/* Paid vs Consumed Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
              Category-Wise Personal Share
            </h3>
            {sortedCategories.length === 0 ? (
              <p className="text-sm text-slate-400">No spending data recorded yet.</p>
            ) : (
              <div className="space-y-4">
                {sortedCategories.map(([catId, paise]) => {
                  const catMeta = CATEGORIES.find((c) => c.id === catId) || CATEGORIES[8];
                  const pct = totalUserConsumption > 0 ? Math.round((paise / totalUserConsumption) * 100) : 0;
                  return (
                    <div key={catId}>
                      <div className="flex justify-between text-xs font-semibold mb-1.5">
                        <span className="text-slate-700 dark:text-slate-300">{catMeta.label}</span>
                        <span className="text-slate-900 dark:text-white">
                          {formatCurrency(paise)} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%`, backgroundColor: catMeta.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Total Paid vs. Total Consumed
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
                Lifetime out-of-pocket payments compared against your actual share of bills
              </p>

              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    Total You Paid Upfront
                  </span>
                  <p className="text-2xl font-extrabold text-emerald-800 dark:text-emerald-300 mt-1">
                    {formatCurrency(totalUserPaid)}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200/70 dark:border-indigo-800/50">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                    Total Your Actual Share
                  </span>
                  <p className="text-2xl font-extrabold text-indigo-800 dark:text-indigo-300 mt-1">
                    {formatCurrency(totalUserConsumption)}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
              {totalUserPaid >= totalUserConsumption
                ? `You have fronted ${formatCurrency(totalUserPaid - totalUserConsumption)} more than your personal consumption.`
                : `Your personal share exceeds upfront payments by ${formatCurrency(totalUserConsumption - totalUserPaid)}.`}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================================================
  // VIEW 6: PROFILE & SETTINGS
  // ==========================================================================
  const renderSettings = () => (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Account & Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Manage your profile, switch demo personas, or reset sandbox ledger data.
        </p>
      </div>

      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl ${currentUser.color} text-white text-xl font-extrabold flex items-center justify-center`}>
            {currentUser.avatar}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{currentUser.name}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">{currentUser.email}</p>
            <p className="text-xs text-slate-400 mt-0.5">{currentUser.phone}</p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Switch Active User Perspective (Test Multi-User Settlement Flow)
          </p>
          <div className="flex flex-wrap gap-2">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => {
                  setCurrentUser(u);
                  addToast(`Now viewing ApnaHissa as ${u.name}`);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                  u.id === currentUser.id
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                {u.name}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-slate-900 dark:text-white">Reset Demo Ledger</p>
            <p className="text-xs text-slate-500">Restore original sample groups, expenses, and settlements.</p>
          </div>
          <button
            onClick={resetDemoData}
            className="px-4 py-2 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/40"
          >
            Reset Sample Data
          </button>
        </div>
      </div>
    </div>
  );

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'activity', label: 'Ledger', icon: History },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 p-5 justify-between fixed inset-y-0 left-0 z-30">
        <div>
          <div className="mb-8 px-1">
            <ApnaHissaLogo size={36} />
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                activeView === item.id || (item.id === 'groups' && activeView === 'groupDetail');
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                    isActive
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3 px-2">
            <div className={`w-9 h-9 rounded-full ${currentUser.color} text-white text-xs font-bold flex items-center justify-center shrink-0`}>
              {currentUser.avatar}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate">{currentUser.name}</p>
              <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
            </div>
          </div>
          <button
            onClick={() => setCurrentUser(null)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-rose-600 hover:border-rose-300 transition"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen pb-20 md:pb-8">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-8 h-16 flex items-center justify-between">
          <div className="md:hidden">
            <ApnaHissaLogo size={32} />
          </div>
          <div className="hidden md:block text-xs font-medium text-slate-400">
            Integer-Paisa Precision Engine • Simplified Group Settlements
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setDarkMode(!darkMode)}
              title="Toggle Theme"
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifDrawer(!showNotifDrawer);
                  setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                }}
                className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition relative"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
                )}
              </button>

              {showNotifDrawer && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-4 z-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Notifications</h4>
                    <button onClick={() => setShowNotifDrawer(false)} className="text-slate-400 hover:text-slate-600">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2.5 max-h-72 overflow-y-auto">
                    {notifications.map((n) => (
                      <div key={n.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs">
                        <p className="font-bold text-slate-800 dark:text-slate-200">{n.title}</p>
                        <p className="text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 pt-6">
          {activeView === 'dashboard' && renderDashboard()}
          {activeView === 'groups' && renderGroupsDirectory()}
          {activeView === 'groupDetail' && renderGroupDetail()}
          {activeView === 'activity' && renderActivity()}
          {activeView === 'analytics' && renderAnalytics()}
          {activeView === 'settings' && renderSettings()}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-around py-2 z-30">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-[11px] font-semibold ${
                isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Modals */}
      <AddExpenseModal
        isOpen={showAddExpense}
        onClose={() => {
          setShowAddExpense(false);
          setEditingExpense(null);
        }}
        defaultGroupId={activeView === 'groupDetail' ? selectedGroupId : null}
        editExpense={editingExpense}
      />

      <SettleUpModal
        isOpen={showSettleUp}
        onClose={() => {
          setShowSettleUp(false);
          setSettlePrefill(null);
        }}
        prefill={settlePrefill}
      />

      <GroupModal isOpen={showGroupModal} onClose={() => setShowGroupModal(false)} />
    </div>
  );
}

// ============================================================================
// 11. ROOT ENTRY POINT
// ============================================================================
function RootRouter() {
  const { currentUser } = useApp();
  return currentUser ? <MainApp /> : <AuthScreen />;
}

export default function App() {
  return (
    <AppProvider>
      <RootRouter />
    </AppProvider>
  );
}