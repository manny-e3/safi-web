import React, { useState, useEffect, useCallback } from 'react';
import MeridianDashboard from './components/MeridianDashboard';
import SafiModalOverlay from './components/safi/SafiModalOverlay';
import SafiCoreDashboard from './components/SafiCoreDashboard';
import SafiConfigWizard from './components/SafiConfigWizard';
import TransactionsPage from './components/TransactionsPage';
import TransferModal from './components/TransferModal';
import FundAccountModal from './components/FundAccountModal';
import AuthLayout from './components/auth/AuthLayout';
import authService from './services/authService';
import bankingService from './services/bankingService';
import safiConfigService from './services/safiConfigService';
import './App.css';

export const VIEW_TO_PATH = {
  meridian: '/dashboard',
  accounts: '/accounts',
  transactions: '/transactions',
  safi_dashboard: '/safi-protection',
  wizard: '/wizard',
  login: '/login',
  register: '/register',
  forgot_password: '/forgot-password',
  reset_password: '/reset-password',
};

export function parseRouteFromLocation() {
  try {
    const searchParams = new URLSearchParams(window.location.search);
    const pathname = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase().replace(/^#\/?/, '');
    const viewParam = searchParams.get('view');
    const tokenParam = searchParams.get('token');
    const emailParam = searchParams.get('email');

    // 1. Password reset token detection
    if (tokenParam || pathname.includes('reset') || viewParam === 'reset_password' || hash.includes('reset')) {
      return {
        view: 'reset_password',
        token: tokenParam || '',
        email: emailParam || '',
      };
    }

    // 2. Query param checks (?view=...)
    if (viewParam) {
      const v = viewParam.toLowerCase();
      if (['dashboard', 'meridian', 'overview'].includes(v)) return { view: 'meridian' };
      if (['accounts', 'account'].includes(v)) return { view: 'accounts' };
      if (['transactions', 'statements', 'ledger'].includes(v)) return { view: 'transactions' };
      if (['safi', 'safi_dashboard', 'protection'].includes(v)) return { view: 'safi_dashboard' };
      if (['wizard', 'setup'].includes(v)) return { view: 'wizard' };
      if (['login', 'signin'].includes(v)) return { view: 'login' };
      if (['register', 'signup'].includes(v)) return { view: 'register' };
      if (['forgot_password', 'forgot-password'].includes(v)) return { view: 'forgot_password' };
    }

    // 3. Hash routing fallback (e.g. #/transactions, #/dashboard)
    if (hash) {
      if (hash.includes('transaction') || hash.includes('statement')) return { view: 'transactions' };
      if (hash.includes('account')) return { view: 'accounts' };
      if (hash.includes('safi')) return { view: 'safi_dashboard' };
      if (hash.includes('wizard')) return { view: 'wizard' };
      if (hash.includes('register') || hash.includes('signup')) return { view: 'register' };
      if (hash.includes('forgot')) return { view: 'forgot_password' };
      if (hash.includes('login') || hash.includes('signin')) return { view: 'login' };
      if (hash.includes('dashboard') || hash.includes('meridian')) return { view: 'meridian' };
    }

    // 4. Clean HTML5 Pathname (e.g. /dashboard, /transactions)
    if (pathname.includes('/transaction') || pathname.includes('/statement')) return { view: 'transactions' };
    if (pathname.includes('/account')) return { view: 'accounts' };
    if (pathname.includes('/safi') || pathname.includes('/protection')) return { view: 'safi_dashboard' };
    if (pathname.includes('/wizard')) return { view: 'wizard' };
    if (pathname.includes('/register') || pathname.includes('/signup')) return { view: 'register' };
    if (pathname.includes('/forgot')) return { view: 'forgot_password' };
    if (pathname.includes('/login') || pathname.includes('/signin')) return { view: 'login' };
    if (pathname.includes('/dashboard') || pathname.includes('/meridian')) return { view: 'meridian' };

  } catch {
    // fallback
  }

  return { view: null };
}

export default function App() {
  // User authentication session state
  const [currentUser, setCurrentUser] = useState(() => authService.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState(() => authService.isAuthenticated());

  // Deep-linking params
  const [initialAuthEmail, setInitialAuthEmail] = useState('');
  const [initialAuthToken, setInitialAuthToken] = useState('');

  // Navigation State with full browser URL routing
  const [currentView, setCurrentView] = useState(() => {
    const isAuthed = authService.isAuthenticated();
    const route = parseRouteFromLocation();

    if (route.view) {
      if (isAuthed) {
        if (['login', 'register'].includes(route.view)) {
          return 'meridian';
        }
        return route.view;
      }
      if (['register', 'forgot_password', 'reset_password'].includes(route.view)) {
        return route.view;
      }
      return 'login';
    }

    return isAuthed ? 'meridian' : 'login';
  });

  // Modals state
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isFundOpen, setIsFundOpen] = useState(false);
  const [isSafiOpen, setIsSafiOpen] = useState(false);
  const [safiInitialScreen, setSafiInitialScreen] = useState('safi_welcome');


  // Live Core Banking State (Fetched from safi-api backend)
  const [wallet, setWallet] = useState(null);
  const [totalBalance, setTotalBalance] = useState(0);
  const [protectedFunds, setProtectedFunds] = useState(0);
  const [spendableFunds, setSpendableFunds] = useState(0);

  // Live SAFI Configuration State (Fetched from safi_configs table in backend)
  const [safiConfig, setSafiConfig] = useState(null);
  const [safiDashboard, setSafiDashboard] = useState(null);
  const [safiHistory, setSafiHistory] = useState(null);
  const [protectionMode, setProtectionMode] = useState('Flexible');
  const [spendAllocation, setSpendAllocation] = useState(0);

  // Live Transactions Ledger (Fetched from core_banking_transactions table)
  const [transactions, setTransactions] = useState([]);
  const [isLoadingBanking, setIsLoadingBanking] = useState(false);

  // Fetch real wallet, active SAFI config, and live transaction records from backend
  const fetchBankingData = useCallback(async () => {
    if (!authService.isAuthenticated()) return;
    setIsLoadingBanking(true);

    try {
      const [walletData, txsData] = await Promise.all([
        bankingService.getWallet().catch((err) => {
          console.warn('Could not fetch wallet:', err);
          return null;
        }),
        bankingService.getTransactions({ limit: 50 }).catch((err) => {
          console.warn('Could not fetch transactions:', err);
          return [];
        }),
      ]);

      let currentAccountNum = null;
      if (walletData) {
        setWallet(walletData);
        currentAccountNum = walletData.accountNumber;
        const rawBal = Number(walletData.balance || 0);
        setTotalBalance(rawBal);
      }

      // Fetch active SAFI configuration, dashboard metrics, and history if we have an account number
      if (currentAccountNum) {
        const [fetchedConfig, fetchedDashboard, fetchedHistory] = await Promise.all([
          safiConfigService.getConfig(currentAccountNum).catch(() => null),
          safiConfigService.getDashboard(currentAccountNum).catch(() => null),
          safiConfigService.getHistory(currentAccountNum).catch(() => null),
        ]);

        const currentBal = walletData ? Number(walletData.balance || 0) : totalBalance;

        // SAFI IS OPTIONAL: Only activate SAFI if the user has an active configuration
        if (fetchedConfig) {
          setSafiConfig(fetchedConfig);
          setSafiDashboard(fetchedDashboard);
          setSafiHistory(fetchedHistory);

          let rawProt = Number(fetchedConfig.protectedSum || 0);
          let rawInc = Number(fetchedConfig.income || 0);

          // Auto-normalize if stored in kobo (value is > 2x current balance)
          if (currentBal > 0 && rawProt > currentBal * 2) {
            rawProt = Math.round(rawProt / 100);
            rawInc = Math.round(rawInc / 100);
          }

          setProtectedFunds(rawProt);
          setSpendableFunds(Math.max(0, currentBal - rawProt));
          setProtectionMode(
            fetchedConfig.governanceMode
              ? fetchedConfig.governanceMode.charAt(0).toUpperCase() + fetchedConfig.governanceMode.slice(1)
              : 'Flexible'
          );
          setSpendAllocation(Math.max(0, (rawInc || currentBal) - rawProt));
        } else {
          // Standard core banking user: SAFI is not configured
          setSafiConfig(null);
          setSafiDashboard(null);
          setSafiHistory(null);
          setProtectedFunds(0);
          setSpendableFunds(currentBal);
          setProtectionMode(null);
          setSpendAllocation(0);
        }
      }

      const txList = Array.isArray(txsData)
        ? txsData
        : txsData?.data && Array.isArray(txsData.data)
        ? txsData.data
        : [];

      const formattedList = txList
        .map((tx) => bankingService.formatTransaction(tx))
        .filter(Boolean);

      setTransactions(formattedList);
    } catch (error) {
      console.error('Error fetching core banking data:', error);
    } finally {
      setIsLoadingBanking(false);
    }
  }, [totalBalance]);

  // Update browser URL using History API to keep route in address bar
  const updateBrowserUrl = useCallback((view, replace = false) => {
    try {
      const targetPath = VIEW_TO_PATH[view] || '/dashboard';
      const currentPath = window.location.pathname;
      const currentSearch = window.location.search;

      if (currentPath === targetPath && !currentSearch) return;

      if (replace) {
        window.history.replaceState({ view }, '', targetPath);
      } else {
        window.history.pushState({ view }, '', targetPath);
      }
    } catch {
      // ignore
    }
  }, []);

  // Handle URL params, session validation, and browser back/forward navigation
  useEffect(() => {
    try {
      const route = parseRouteFromLocation();
      const isAuthed = authService.isAuthenticated();

      if (route.token) setInitialAuthToken(route.token);
      if (route.email) setInitialAuthEmail(route.email);

      if (isAuthed) {
        // If logged in but route is login or register, switch to dashboard
        if (!route.view || ['login', 'register'].includes(route.view)) {
          updateBrowserUrl('meridian', true);
          setCurrentView('meridian');
        } else {
          updateBrowserUrl(route.view, true);
          setCurrentView(route.view);
        }

        // Validate session with backend without clearing valid local session on network glitch or 401
        authService
          .getMe()
          .then((data) => {
            const user = data?.user || (data?.email ? data : null);
            if (user) {
              setCurrentUser(user);
              setIsAuthenticated(true);
            }
          })
          .catch((err) => {
            console.warn('Session verification notice (cached credentials retained):', err?.message || err);
            const cachedUser = authService.getUser();
            if (cachedUser) {
              setCurrentUser(cachedUser);
              setIsAuthenticated(true);
            } else {
              authService.clearAuth();
              setIsAuthenticated(false);
              setCurrentUser(null);
              updateBrowserUrl('login', true);
              setCurrentView('login');
            }
          });
      } else {
        if (route.view && ['register', 'forgot_password', 'reset_password'].includes(route.view)) {
          updateBrowserUrl(route.view, true);
          setCurrentView(route.view);
        } else {
          updateBrowserUrl('login', true);
          setCurrentView('login');
        }
      }

      // Handle browser back and forward history buttons
      const handlePopState = () => {
        const popRoute = parseRouteFromLocation();
        const currentAuthed = authService.isAuthenticated();

        if (currentAuthed) {
          if (['login', 'register'].includes(popRoute.view)) {
            setCurrentView('meridian');
          } else if (popRoute.view) {
            setCurrentView(popRoute.view);
          } else {
            setCurrentView('meridian');
          }
        } else {
          if (['register', 'forgot_password', 'reset_password'].includes(popRoute.view)) {
            setCurrentView(popRoute.view);
          } else {
            setCurrentView('login');
          }
        }
      };

      window.addEventListener('popstate', handlePopState);
      return () => window.removeEventListener('popstate', handlePopState);
    } catch {
      // ignore
    }
  }, [updateBrowserUrl]);


  // Fetch real banking data when authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      fetchBankingData();
    }
  }, [isAuthenticated, currentUser, fetchBankingData]);

  // Handle funding account: synchronize with live backend
  const handleFundSuccess = (newTx, rawResult) => {
    if (newTx) {
      setTransactions((prev) => [newTx, ...prev]);
      if (rawResult?.wallet?.balance !== undefined) {
        const newBal = Number(rawResult.wallet.balance);
        setTotalBalance(newBal);
        if (safiConfig) {
          const rawProt = Number(safiConfig.protectedSum || 0);
          setSpendableFunds(Math.max(0, newBal - rawProt));
        } else {
          const autoProtected = Math.round(newBal * 0.56);
          setProtectedFunds(autoProtected);
          setSpendableFunds(newBal - autoProtected);
        }
      }
    }
    fetchBankingData();
  };

  // Handle transferring funds: synchronize with live backend
  const handleTransferSuccess = (newTx, rawResult) => {
    if (newTx) {
      setTransactions((prev) => [newTx, ...prev]);
      if (rawResult?.wallet?.balance !== undefined) {
        const newBal = Number(rawResult.wallet.balance);
        setTotalBalance(newBal);
        if (safiConfig) {
          let rawProt = Number(safiConfig.protectedSum || 0);
          if (newBal > 0 && rawProt > newBal * 2) {
            rawProt = Math.round(rawProt / 100);
          }
          setProtectedFunds(rawProt);
          setSpendableFunds(Math.max(0, newBal - rawProt));
        } else {
          setSpendableFunds((prev) => Math.max(0, prev - newTx.amount));
        }
      }
    }
    fetchBankingData();
  };

  // Handle SAFI configuration saved in wizard
  const handleConfigSaved = (newConfig) => {
    setSafiConfig(newConfig);
    if (newConfig) {
      let rawProt = Number(newConfig.protectedSum || 0);
      let rawInc = Number(newConfig.income || 0);
      if (totalBalance > 0 && rawProt > totalBalance * 2) {
        rawProt = Math.round(rawProt / 100);
        rawInc = Math.round(rawInc / 100);
      }
      setProtectedFunds(rawProt);
      setSpendableFunds(Math.max(0, totalBalance - rawProt));
      setProtectionMode(
        newConfig.governanceMode
          ? newConfig.governanceMode.charAt(0).toUpperCase() + newConfig.governanceMode.slice(1)
          : 'Flexible'
      );
      setSpendAllocation(Math.max(0, (rawInc || totalBalance) - rawProt));
    }
    fetchBankingData();
  };

  // Handle Navigation with Browser URL History Sync
  const handleNavigate = useCallback(
    (view, options = {}) => {
      const { replace = false } = options;

      if (view === 'wizard') {
        setSafiInitialScreen('safi_welcome');
        setIsSafiOpen(true);
        updateBrowserUrl('wizard', replace);
        setCurrentView('wizard');
        return;
      }

      if (view === 'safi_dashboard') {
        setSafiInitialScreen(safiConfig ? 'dashboard' : 'safi_welcome');
        setIsSafiOpen(true);
        updateBrowserUrl('safi_dashboard', replace);
        setCurrentView('safi_dashboard');
        return;
      }

      updateBrowserUrl(view, replace);
      setCurrentView(view);
    },
    [safiConfig, updateBrowserUrl]
  );

  // Handle SAFI deactivation
  const handleDeactivateSafi = () => {
    setSafiConfig(null);
    setProtectedFunds(0);
    setSpendableFunds(totalBalance);
    setIsSafiOpen(false);
    fetchBankingData();
    handleNavigate('meridian', { replace: true });
  };

  // Handle user logout
  const handleLogout = async () => {
    await authService.logout();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setWallet(null);
    setTotalBalance(0);
    setProtectedFunds(0);
    setSpendableFunds(0);
    setSafiConfig(null);
    setTransactions([]);
    handleNavigate('login', { replace: true });
  };

  // Handle successful login
  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    const route = parseRouteFromLocation();
    const target =
      route.view && !['login', 'register'].includes(route.view) ? route.view : 'meridian';
    handleNavigate(target, { replace: true });
  };

  // =========================================================================
  // STRICT AUTHENTICATION GATE:
  // If user is not authenticated, ONLY render Auth views (Login, Register, Forgot Password, Reset Password)
  // Dashboard and internal views cannot be viewed or accessed.
  // =========================================================================
  if (!isAuthenticated || !currentUser) {
    const authView = ['register', 'forgot_password', 'reset_password'].includes(currentView)
      ? currentView
      : 'login';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
        <AuthLayout
          initialView={authView}
          initialEmail={initialAuthEmail}
          initialToken={initialAuthToken}
          onLoginSuccess={handleLoginSuccess}
          onNavigate={(view) => handleNavigate(view)}
        />
      </div>
    );
  }

  // Determine if viewing wizard
  const isWizardActive = ['wizard', 'wizard_step1', 'wizard_step2'].includes(currentView);

  // =========================================================================
  // AUTHENTICATED APPLICATION:
  // Access granted exclusively to authenticated users.
  // =========================================================================
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      {/* View 1: Meridian Bank Dashboard */}
      {(currentView === 'meridian' || currentView === 'accounts' || currentView === 'safi_dashboard' || isWizardActive) && (
        <MeridianDashboard
          totalBalance={totalBalance}
          protectedFunds={protectedFunds}
          spendableFunds={spendableFunds}
          transactions={transactions}
          currentUser={currentUser}
          wallet={wallet}
          safiConfig={safiConfig}
          safiDashboard={safiDashboard}
          safiHistory={safiHistory}
          isLoadingBanking={isLoadingBanking}
          onRefreshBanking={fetchBankingData}
          onNavigate={handleNavigate}
          onOpenTransfer={() => setIsTransferOpen(true)}
          onOpenFund={() => setIsFundOpen(true)}
          onLogout={handleLogout}
        />
      )}

      {/* View 2: Comprehensive Transactions Ledger */}
      {currentView === 'transactions' && (
        <TransactionsPage
          transactions={transactions}
          currentUser={currentUser}
          wallet={wallet}
          safiConfig={safiConfig}
          onNavigate={handleNavigate}
          onOpenTransfer={() => setIsTransferOpen(true)}
          onOpenFund={() => setIsFundOpen(true)}
          onLogout={handleLogout}
        />
      )}

      {/* Fund Account Modal */}
      <FundAccountModal
        isOpen={isFundOpen}
        onClose={() => setIsFundOpen(false)}
        onFundSuccess={handleFundSuccess}
        accountNumber={wallet?.accountNumber}
        userName={currentUser?.name}
      />

      {/* Transfer Funds Modal with Nova Intervention Override */}
      <TransferModal
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        totalBalance={totalBalance}
        spendableFunds={spendableFunds}
        protectedFunds={protectedFunds}
        protectionMode={protectionMode}
        safiConfig={safiConfig}
        onTransferSuccess={handleTransferSuccess}
      />

      {/* SAFI Nova-Aligned Protection Portal & Setup Modal */}
      <SafiModalOverlay
        isOpen={isSafiOpen || currentView === 'safi_dashboard' || isWizardActive}
        onClose={() => {
          setIsSafiOpen(false);
          if (currentView === 'safi_dashboard' || isWizardActive) {
            handleNavigate('meridian', { replace: true });
          }
        }}
        initialScreen={
          isWizardActive
            ? 'safi_welcome'
            : currentView === 'safi_dashboard'
            ? safiConfig ? 'dashboard' : 'safi_welcome'
            : safiInitialScreen
        }
        currentUser={currentUser}
        wallet={wallet}
        totalBalance={totalBalance}
        safiConfig={safiConfig}
        onConfigSaved={handleConfigSaved}
        onDeactivateSafi={handleDeactivateSafi}
        onLogout={handleLogout}
      />
    </div>
  );
}
