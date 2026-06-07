/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, 
  Gamepad2, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  User as UserIcon, 
  LogOut, 
  ChevronRight,
  Trophy,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Eye,
  EyeOff,
  Copy
} from 'lucide-react';
import { User, Question } from './types';
import { QUESTIONS } from './constants';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [view, setView] = useState<'auth' | 'dashboard' | 'game' | 'profile' | 'buy_prime' | 'history' | 'withdraw' | 'airtime' | 'data'>('auth');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [withdrawData, setWithdrawData] = useState({ bank: '', account: '', name: '', amount: '', code: '' });
  const [serviceData, setServiceData] = useState({ phone: '', amount: '', code: '' });
  const [newName, setNewName] = useState('');
  const [showBalance, setShowBalance] = useState(true);
  const [lastClaimDate, setLastClaimDate] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [paymentProof, setPaymentProof] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'confirming' | 'failed' | 'success'>('idle');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [questionsAnsweredToday, setQuestionsAnsweredToday] = useState(0);
  const [gameStatus, setGameStatus] = useState<'playing' | 'finished' | 'idle'>('idle');
  const [lastReward, setLastReward] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  // Customized non-blocking notification state
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
  };

  // Auto-dismiss notifications after 3 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('prime_pay_user');
    const savedTransactions = localStorage.getItem('prime_pay_transactions');
    const savedClaimDate = localStorage.getItem('prime_pay_last_claim_date');
    
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      setView('dashboard');
      
      if (savedClaimDate) {
        setLastClaimDate(savedClaimDate);
      }
      
      if (savedTransactions) {
        setTransactions(JSON.parse(savedTransactions));
      } else {
        const initialTransactions = [
          { title: 'Welcome Bonus', amount: '+₦85,000', time: '1 hour ago', type: 'earn' }
        ];
        setTransactions(initialTransactions);
        localStorage.setItem('prime_pay_transactions', JSON.stringify(initialTransactions));
      }
      
      // Check daily limit
      const today = new Date().toDateString();
      const lastPlayDate = localStorage.getItem('prime_pay_last_play_date');
      if (lastPlayDate === today) {
        setQuestionsAnsweredToday(Number(localStorage.getItem('prime_pay_daily_count') || 0));
      } else {
        localStorage.setItem('prime_pay_last_play_date', today);
        localStorage.setItem('prime_pay_daily_count', '0');
        setQuestionsAnsweredToday(0);
      }
    }
  }, []);

  const handleAuth = (e: FormEvent) => {
    e.preventDefault();
    if (authMode === 'register') {
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name,
        email: formData.email,
        balance: 85000,
        isLoggedIn: true,
        isPrime: false
      };
      setUser(newUser);
      localStorage.setItem('prime_pay_user', JSON.stringify(newUser));
      setView('dashboard');
      triggerToast('Registration successful! Welcome to PrimePay.', 'success');
    } else {
      // Mock login
      const savedUser = localStorage.getItem('prime_pay_user');
      if (savedUser) {
        const parsed = JSON.parse(savedUser);
        if (parsed.email === formData.email) {
          setUser(parsed);
          setView('dashboard');
          triggerToast('Welcome back to PrimePay!', 'success');
        } else {
          triggerToast('User not found. Please register.', 'error');
        }
      } else {
        triggerToast('No users found. Please register.', 'error');
      }
    }
  };

  const handleUpdateName = (e: FormEvent) => {
    e.preventDefault();
    if (user && newName.trim()) {
      const updatedUser = { ...user, name: newName };
      setUser(updatedUser);
      localStorage.setItem('prime_pay_user', JSON.stringify(updatedUser));
      setNewName('');
      triggerToast('Name updated successfully!', 'success');
    }
  };

  const handleWithdraw = (e: FormEvent) => {
    e.preventDefault();
    if (withdrawData.code !== 'primeABC') {
      triggerToast('Invalid Prime Code. Please purchase a valid code.', 'error');
      return;
    }
    const amount = Number(withdrawData.amount);
    if (user && amount > user.balance) {
      triggerToast('Insufficient balance.', 'error');
      return;
    }
    if (user) {
      const updatedUser = { ...user, balance: user.balance - amount };
      setUser(updatedUser);
      localStorage.setItem('prime_pay_user', JSON.stringify(updatedUser));
      
      const newTransaction = {
        title: 'Withdrawal',
        amount: `-₦${amount.toLocaleString()}`,
        time: 'Recent',
        type: 'spend'
      };
      const updatedTransactions = [newTransaction, ...transactions];
      setTransactions(updatedTransactions);
      localStorage.setItem('prime_pay_transactions', JSON.stringify(updatedTransactions));
      
      triggerToast('Withdrawal request submitted successfully!', 'success');
      setView('dashboard');
      setWithdrawData({ bank: '', account: '', name: '', amount: '', code: '' });
    }
  };

  const handleServicePurchase = (e: FormEvent, type: 'Airtime' | 'Data') => {
    e.preventDefault();
    if (serviceData.code !== 'primeABC') {
      triggerToast('Invalid Prime Code. Please purchase a valid code.', 'error');
      return;
    }
    const amount = Number(serviceData.amount);
    if (user && amount > user.balance) {
      triggerToast('Insufficient balance.', 'error');
      return;
    }
    if (user) {
      const updatedUser = { ...user, balance: user.balance - amount };
      setUser(updatedUser);
      localStorage.setItem('prime_pay_user', JSON.stringify(updatedUser));
      
      const newTransaction = {
        title: `${type} Purchase`,
        amount: `-₦${amount.toLocaleString()}`,
        time: 'Recent',
        type: 'spend'
      };
      const updatedTransactions = [newTransaction, ...transactions];
      setTransactions(updatedTransactions);
      localStorage.setItem('prime_pay_transactions', JSON.stringify(updatedTransactions));
      
      triggerToast(`${type} purchased successfully!`, 'success');
      setView('dashboard');
      setServiceData({ phone: '', amount: '', code: '' });
    }
  };

  const handleLogout = () => {
    setUser(null);
    setView('auth');
    triggerToast('Signed out successfully.', 'info');
  };

  const handleDailyClaim = () => {
    const today = new Date().toDateString();
    if (lastClaimDate === today) {
      triggerToast('You have already claimed your ₦30,000 for today. Come back tomorrow!', 'info');
      return;
    }

    if (user) {
      const amount = 30000;
      const updatedUser = { ...user, balance: user.balance + amount };
      setUser(updatedUser);
      localStorage.setItem('prime_pay_user', JSON.stringify(updatedUser));
      
      const todayStr = new Date().toDateString();
      setLastClaimDate(todayStr);
      localStorage.setItem('prime_pay_last_claim_date', todayStr);

      const newTransaction = {
        title: 'Daily Claim',
        amount: `+₦${amount.toLocaleString()}`,
        time: 'Recent',
        type: 'earn'
      };
      const updatedTransactions = [newTransaction, ...transactions];
      setTransactions(updatedTransactions);
      localStorage.setItem('prime_pay_transactions', JSON.stringify(updatedTransactions));
      
      triggerToast('Congratulations! You have claimed ₦30,000.', 'success');
    }
  };

  const handleAnswer = (optionIndex: number) => {
    if (feedback) return;

    const currentQuestion = QUESTIONS[currentQuestionIndex];
    const isCorrect = optionIndex === currentQuestion.correctAnswer;
    const amount = isCorrect ? 15000 : 2670;
    
    setFeedback(isCorrect ? 'correct' : 'wrong');

    if (user) {
      const newBalance = isCorrect ? user.balance + amount : user.balance - amount;
      const updatedUser = { ...user, balance: Math.max(0, newBalance) };
      setUser(updatedUser);
      localStorage.setItem('prime_pay_user', JSON.stringify(updatedUser));

      const newTransaction = {
        title: isCorrect ? 'Gaming Reward' : 'Gaming Deduction',
        amount: isCorrect ? `+₦${amount.toLocaleString()}` : `-₦${amount.toLocaleString()}`,
        time: 'Recent',
        type: isCorrect ? 'earn' : 'spend'
      };
      const updatedTransactions = [newTransaction, ...transactions];
      setTransactions(updatedTransactions);
      localStorage.setItem('prime_pay_transactions', JSON.stringify(updatedTransactions));
    }

    const newDailyCount = questionsAnsweredToday + 1;
    setQuestionsAnsweredToday(newDailyCount);
    localStorage.setItem('prime_pay_daily_count', newDailyCount.toString());

    setTimeout(() => {
      setFeedback(null);
      if (isCorrect) setScore(prev => prev + amount);
      else setScore(prev => prev - amount);

      if (currentQuestionIndex < QUESTIONS.length - 1 && newDailyCount < 30) {
        setCurrentQuestionIndex(prev => prev + 1);
      } else {
        setGameStatus('finished');
      }
    }, 1500);
  };

  const handlePaymentSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!paymentProof) {
      triggerToast('Please upload payment proof', 'error');
      return;
    }
    setPaymentStatus('confirming');
    setTimeout(() => {
      setPaymentStatus('success');
      if (user) {
        const updatedUser = { ...user, isPrime: true, primeCode: 'primeABC' };
        setUser(updatedUser);
        localStorage.setItem('prime_pay_user', JSON.stringify(updatedUser));
        triggerToast('Payment proof verified! Prime Code generated.', 'success');
      }
    }, 2500);
  };

  const startNewGame = () => {
    if (questionsAnsweredToday >= 30) {
      triggerToast('Daily limit reached! You can answer up to 30 questions per day.', 'info');
      return;
    }
    setCurrentQuestionIndex(0);
    setScore(0);
    setGameStatus('playing');
    setView('game');
  };

  // Helper toaster component renderer
  const renderToast = () => {
    return (
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4 pointer-events-none"
          >
            <div className={`p-4 rounded-xl backdrop-blur-xl border flex items-center gap-3 shadow-2xl ${
              notification.type === 'success' ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' :
              notification.type === 'error' ? 'bg-red-500/20 border-red-500/30 text-red-400' :
              'bg-blue-500/20 border-blue-500/30 text-blue-400'
            }`}>
              <div className="shrink-0">
                {notification.type === 'success' && <CheckCircle2 size={18} />}
                {notification.type === 'error' && <XCircle size={18} />}
                {notification.type === 'info' && <Trophy size={18} className="text-prime-orange" />}
              </div>
              <p className="text-sm font-semibold leading-tight">{notification.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  if (view === 'auth') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-prime-blue overflow-hidden relative">
        {/* Background Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-prime-purple/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-prime-orange/10 blur-[120px] rounded-full" />

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md z-10"
        >
          <div className="flex items-center justify-center mb-12 gap-3">
            <div className="w-12 h-12 rounded-xl prime-gradient flex items-center justify-center shadow-lg shadow-prime-purple/20">
              <span className="text-2xl font-black text-white italic">P</span>
            </div>
            <h1 className="text-4xl font-display font-bold tracking-tight">PrimePay</h1>
          </div>

          <div className="glass-card p-8 shadow-2xl">
            <h2 className="text-2xl font-bold mb-6 text-center">
              {authMode === 'register' ? 'Create Account' : 'Welcome Back'}
            </h2>
            
            <form onSubmit={handleAuth} className="space-y-4">
              {authMode === 'register' && (
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-prime-purple transition-colors"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-prime-purple transition-colors"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/60 mb-1">Password</label>
                <input 
                  type="password" 
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-prime-purple transition-colors"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                />
              </div>

              <button 
                type="submit"
                className="w-full prime-gradient py-4 rounded-xl font-bold text-lg shadow-lg shadow-prime-purple/30 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4 cursor-pointer"
              >
                {authMode === 'register' ? 'Get Started' : 'Sign In'}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button 
                onClick={() => setAuthMode(authMode === 'register' ? 'login' : 'register')}
                className="text-white/60 hover:text-white transition-colors text-sm cursor-pointer"
              >
                {authMode === 'register' ? 'Already have an account? Sign In' : "Don't have an account? Register"}
              </button>
            </div>
          </div>
        </motion.div>
        {renderToast()}
      </div>
    );
  }

  if (view === 'dashboard' && user) {
    return (
      <div className="min-h-screen bg-prime-blue pb-24 relative">
        {/* Header */}
        <header className="p-6 flex items-center justify-between sticky top-0 bg-prime-blue/80 backdrop-blur-md z-20">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg prime-gradient flex items-center justify-center">
              <span className="text-sm font-black italic">P</span>
            </div>
            <span className="font-display font-bold text-xl">PrimePay</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setView('profile')}
              className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer"
            >
              <UserIcon size={20} className="text-white/80" />
            </button>
          </div>
        </header>

        <main className="px-6 space-y-8">
          {/* Welcome */}
          <section>
            <h2 className="text-white/60 text-sm font-medium uppercase tracking-wider mb-1">Welcome back,</h2>
            <h3 className="text-3xl font-display font-bold">{user.name}</h3>
          </section>

          {/* Balance Card */}
          <section className="relative group">
            <div className="absolute inset-0 bg-prime-purple/20 blur-3xl rounded-full -z-10 group-hover:bg-prime-purple/30 transition-all" />
            <div className="prime-gradient p-6 rounded-3xl shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
              
              <div className="flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-white/70 text-xs font-medium">Available Balance</p>
                    <button 
                      onClick={() => setShowBalance(!showBalance)}
                      className="text-white/40 hover:text-white/60 transition-colors cursor-pointer"
                    >
                      {showBalance ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                  </div>
                  <h4 className="text-3xl font-display font-extrabold tracking-tight">
                    {showBalance ? `₦${user.balance.toLocaleString()}` : '••••••••'}
                  </h4>
                  <p className="text-white/40 text-[10px] mt-1">Daily spend target: Unlimited</p>
                </div>
                <button 
                  onClick={() => setView('withdraw')}
                  className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer"
                >
                  Withdraw
                </button>
              </div>
            </div>
          </section>

          {/* Prime Status Banner */}
          {user.isPrime && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-5 flex items-center justify-between shadow-lg"
            >
              <div>
                <span className="text-emerald-400 font-extrabold text-xs uppercase tracking-wider block mb-1">💎 PRIME MEMBER ACTIVE</span>
                <p className="text-sm font-semibold text-white/95">Your Prime Code: <span className="font-mono text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/10 px-2 py-0.5 rounded ml-1">primeABC</span></p>
              </div>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText('primeABC');
                  triggerToast('Prime Code copied!', 'success');
                }}
                className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 p-2.5 rounded-xl transition-all cursor-pointer"
              >
                <Copy size={18} />
              </button>
            </motion.div>
          )}

          {/* Quick Actions */}
          <section>
            <div className="grid grid-cols-4 gap-4">
              <div className="flex flex-col items-center gap-2">
                <button 
                  onClick={startNewGame}
                  className="w-14 h-14 rounded-2xl bg-prime-orange flex items-center justify-center text-white shadow-lg shadow-prime-orange/20 transition-transform active:scale-95 cursor-pointer"
                >
                  <Gamepad2 size={24} />
                </button>
                <span className="text-[11px] font-medium text-white/80">Gaming</span>
              </div>
              
              <div className="flex flex-col items-center gap-2">
                <button 
                  onClick={() => {
                    setPaymentStatus('idle');
                    setPaymentProof(null);
                    setView('buy_prime');
                  }}
                  className="w-14 h-14 rounded-2xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 transition-transform active:scale-95 cursor-pointer"
                >
                  <Trophy size={24} />
                </button>
                <span className="text-[11px] font-medium text-white/80">Buy Prime</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <button 
                  onClick={() => setView('airtime')}
                  className="w-14 h-14 rounded-2xl bg-green-500 flex items-center justify-center text-white shadow-lg shadow-green-500/20 transition-transform active:scale-95 cursor-pointer"
                >
                  <ArrowUpRight size={24} />
                </button>
                <span className="text-[11px] font-medium text-white/80">Airtime</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <button 
                  onClick={() => setView('data')}
                  className="w-14 h-14 rounded-2xl bg-prime-purple flex items-center justify-center text-white shadow-lg shadow-prime-purple/20 transition-transform active:scale-95 cursor-pointer"
                >
                  <TrendingUp size={24} />
                </button>
                <span className="text-[11px] font-medium text-white/80">Data</span>
              </div>
            </div>
          </section>

          {/* More Services */}
          <section>
            <h5 className="text-lg font-bold mb-4">More Services</h5>
            <div className="grid grid-cols-4 gap-4">
              <a 
                href="https://t.me/Godspowerde"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 group/btn cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/60 group-hover/btn:bg-white/10 group-hover/btn:text-white transition-all transform group-active/btn:scale-95 duration-200">
                  <UserIcon size={20} />
                </div>
                <span className="text-[10px] text-white/60 group-hover/btn:text-white transition-colors">Support</span>
              </a>
              <a 
                href="https://t.me/Godspowerde"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 group/btn cursor-pointer"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/60 group-hover/btn:bg-white/10 group-hover/btn:text-white transition-all transform group-active/btn:scale-95 duration-200">
                  <History size={20} />
                </div>
                <span className="text-[10px] text-white/60 group-hover/btn:text-white transition-colors">Group</span>
              </a>
              <div className="flex flex-col items-center gap-2">
                <button 
                  onClick={handleDailyClaim}
                  className="w-12 h-12 rounded-full bg-prime-orange/10 flex items-center justify-center text-prime-orange hover:bg-prime-orange/20 transition-colors cursor-pointer"
                >
                  <Trophy size={20} />
                </button>
                <span className="text-[10px] text-white/60">Earn</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <button 
                  onClick={() => setView('profile')}
                  className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:bg-white/10 transition-colors cursor-pointer"
                >
                  <UserIcon size={20} />
                </button>
                <span className="text-[10px] text-white/60 font-medium">Profile</span>
              </div>
            </div>
          </section>

          {/* Important Information */}
          <section>
            <div className="bg-prime-purple/40 border border-prime-purple/30 rounded-3xl p-6">
              <h5 className="text-lg font-bold mb-4">Important Information</h5>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-sm text-white/80">
                  <div className="w-5 h-5 rounded-full bg-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0">1</div>
                  Click on buy prime
                </li>
                <li className="flex items-start gap-3 text-sm text-white/80">
                  <div className="w-5 h-5 rounded-full bg-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
                  Copy the management account
                </li>
                <li className="flex items-start gap-3 text-sm text-white/80">
                  <div className="w-5 h-5 rounded-full bg-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0">3</div>
                  Make the required payment and upload payment proof
                </li>
                <li className="flex items-start gap-3 text-sm text-white/80">
                  <div className="w-5 h-5 rounded-full bg-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0">4</div>
                  Your prime code will appear on your dashboard
                </li>
              </ul>
            </div>
          </section>

          {/* Recent Activity */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h5 className="text-lg font-bold">Recent Activity</h5>
              <button 
                onClick={() => setView('history')}
                className="text-prime-orange text-sm font-medium cursor-pointer hover:underline"
              >
                View All
              </button>
            </div>
            <div className="space-y-3">
              {transactions.slice(0, 3).map((item, i) => (
                <div key={i} className="glass-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.type === 'earn' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                      {item.type === 'earn' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                    </div>
                    <div>
                      <p className="font-bold text-sm">{item.title}</p>
                      <p className="text-xs text-white/40">{item.time}</p>
                    </div>
                  </div>
                  <span className={`font-bold ${item.type === 'earn' ? 'text-green-400' : 'text-red-400'}`}>
                    {item.amount}
                  </span>
                </div>
              ))}
              {transactions.length === 0 && (
                <div className="text-center py-8 text-white/40 text-sm">No recent activity</div>
              )}
            </div>
          </section>
        </main>

        {/* Bottom Nav */}
        <nav className="fixed bottom-0 left-0 right-0 p-4 z-30">
          <div className="max-w-md mx-auto glass-card py-4 px-8 flex justify-between items-center shadow-2xl border-white/5">
            <button 
              onClick={() => setView('dashboard')}
              className={view === 'dashboard' ? 'text-prime-orange cursor-pointer' : 'text-white/40 cursor-pointer'}
            >
              <Wallet size={24} />
            </button>
            <button 
              onClick={() => setView('history')}
              className={view === 'history' ? 'text-prime-orange cursor-pointer' : 'text-white/40 cursor-pointer'}
            >
              <History size={24} />
            </button>
            <button 
              onClick={startNewGame}
              className="w-14 h-14 prime-gradient rounded-full flex items-center justify-center shadow-lg shadow-prime-purple/40 -mt-12 border-4 border-prime-blue cursor-pointer"
            >
              <Gamepad2 size={28} />
            </button>
            <button className="text-white/40 cursor-pointer"><TrendingUp size={24} /></button>
            <button 
              onClick={() => setView('profile')}
              className={view === 'profile' ? 'text-prime-orange cursor-pointer' : 'text-white/40 cursor-pointer'}
            >
              <UserIcon size={24} />
            </button>
          </div>
        </nav>
        {renderToast()}
      </div>
    );
  }

  if (view === 'history' && user) {
    return (
      <div className="min-h-screen bg-prime-blue pb-24">
        <header className="p-6 flex items-center gap-4 sticky top-0 bg-prime-blue/80 backdrop-blur-md z-20">
          <button 
            onClick={() => setView('dashboard')}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"
          >
            <ChevronRight className="rotate-180" />
          </button>
          <h1 className="text-xl font-display font-bold">Transaction History</h1>
        </header>

        <main className="px-6 space-y-4">
          {transactions.map((item, i) => (
            <div key={i} className="glass-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${item.type === 'earn' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {item.type === 'earn' ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                </div>
                <div>
                  <p className="font-bold text-sm">{item.title}</p>
                  <p className="text-xs text-white/40">{item.time}</p>
                </div>
              </div>
              <span className={`font-bold ${item.type === 'earn' ? 'text-green-400' : 'text-red-400'}`}>
                {item.amount}
              </span>
            </div>
          ))}
          {transactions.length === 0 && (
            <div className="text-center py-20 text-white/40">
              <History size={48} className="mx-auto mb-4 opacity-20" />
              <p>No transactions yet</p>
            </div>
          )}
        </main>

        <nav className="fixed bottom-0 left-0 right-0 p-4 z-30">
          <div className="max-w-md mx-auto glass-card py-4 px-8 flex justify-between items-center shadow-2xl border-white/5">
            <button onClick={() => setView('dashboard')} className="text-white/40 cursor-pointer"><Wallet size={24} /></button>
            <button onClick={() => setView('history')} className="text-prime-orange cursor-pointer"><History size={24} /></button>
            <button onClick={startNewGame} className="w-14 h-14 prime-gradient rounded-full flex items-center justify-center shadow-lg shadow-prime-purple/40 -mt-12 border-4 border-prime-blue cursor-pointer">
              <Gamepad2 size={28} />
            </button>
            <button className="text-white/40 cursor-pointer"><TrendingUp size={24} /></button>
            <button onClick={() => setView('profile')} className="text-white/40 cursor-pointer"><UserIcon size={24} /></button>
          </div>
        </nav>
        {renderToast()}
      </div>
    );
  }

  if (view === 'profile' && user) {
    return (
      <div className="min-h-screen bg-prime-blue pb-24">
        <header className="p-6 flex items-center gap-4 sticky top-0 bg-prime-blue/80 backdrop-blur-md z-20">
          <button 
            onClick={() => setView('dashboard')}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"
          >
            <ChevronRight className="rotate-180" />
          </button>
          <h1 className="text-xl font-display font-bold">Profile Settings</h1>
        </header>

        <main className="px-6 space-y-8">
          <div className="flex flex-col items-center py-8">
            <div className="w-24 h-24 rounded-full prime-gradient flex items-center justify-center mb-4 shadow-xl shadow-prime-purple/20">
              <span className="text-4xl font-black italic">{user.name.charAt(0)}</span>
            </div>
            <h2 className="text-2xl font-bold">{user.name}</h2>
            <p className="text-white/40 text-sm">{user.email}</p>
          </div>

          <section className="glass-card p-6 space-y-6">
            <div>
              <h3 className="text-lg font-bold mb-4">Edit Profile</h3>
              <form onSubmit={handleUpdateName} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/60 mb-1">Display Name</label>
                  <input 
                    type="text" 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-prime-purple transition-colors"
                    placeholder="New Name"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full bg-white/10 hover:bg-white/20 py-3 rounded-xl font-bold transition-all"
                >
                  Update Name
                </button>
              </form>
            </div>

            <div className="h-px bg-white/10" />

            <div>
              <h3 className="text-lg font-bold mb-4 text-red-400">Account Actions</h3>
              <button 
                onClick={handleLogout}
                className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
              >
                <LogOut size={20} /> Sign Out
              </button>
            </div>
          </section>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 p-4 z-30">
          <div className="max-w-md mx-auto glass-card py-4 px-8 flex justify-between items-center shadow-2xl border-white/5">
            <button 
              onClick={() => setView('dashboard')}
              className="text-white/40 cursor-pointer"
            >
              <Wallet size={24} />
            </button>
            <button onClick={() => setView('history')} className="text-white/40 cursor-pointer"><History size={24} /></button>
            <button 
              onClick={startNewGame}
              className="w-14 h-14 prime-gradient rounded-full flex items-center justify-center shadow-lg shadow-prime-purple/40 -mt-12 border-4 border-prime-blue cursor-pointer"
            >
              <Gamepad2 size={28} />
            </button>
            <button className="text-white/40 cursor-pointer"><TrendingUp size={24} /></button>
            <button 
              onClick={() => setView('profile')}
              className="text-prime-orange cursor-pointer"
            >
              <UserIcon size={24} />
            </button>
          </div>
        </nav>
        {renderToast()}
      </div>
    );
  }

  if (view === 'game' && user) {
    const currentQuestion = QUESTIONS[currentQuestionIndex];

    return (
      <div className="min-h-screen bg-prime-blue p-6 flex flex-col">
        <header className="flex items-center justify-between mb-8">
          <button 
            onClick={() => setView('dashboard')}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"
          >
            <ChevronRight className="rotate-180" />
          </button>
          <div className="flex items-center gap-2 bg-prime-purple/20 px-4 py-2 rounded-full border border-prime-purple/30">
            <Trophy size={16} className="text-prime-orange" />
            <span className="font-bold text-sm">₦{score.toLocaleString()}</span>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {gameStatus === 'playing' ? (
            <motion.div 
              key={currentQuestionIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col"
            >
              <div className="mb-8">
                <div className="flex justify-between items-end mb-2">
                  <span className="text-white/40 text-sm font-medium">Question {currentQuestionIndex + 1} (Daily: {questionsAnsweredToday}/30)</span>
                  <span className="text-prime-orange font-bold">Reward: ₦15,000</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full prime-gradient"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentQuestionIndex + 1) / QUESTIONS.length) * 100}%` }}
                  />
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-8 leading-tight">
                {currentQuestion.text}
              </h2>

              <div className="space-y-4 relative">
                {currentQuestion.options.map((option, idx) => (
                  <button
                    key={idx}
                    disabled={!!feedback}
                    onClick={() => handleAnswer(idx)}
                    className={`w-full glass-card p-6 text-left transition-all flex justify-between items-center group ${
                      feedback && idx === currentQuestion.correctAnswer ? 'border-green-500 bg-green-500/10' : 
                      feedback && idx !== currentQuestion.correctAnswer ? 'opacity-50' : 'hover:bg-white/10 hover:border-prime-purple/50'
                    }`}
                  >
                    <span className="font-medium">{option}</span>
                    <div className={`w-6 h-6 rounded-full border-2 transition-colors ${
                      feedback && idx === currentQuestion.correctAnswer ? 'border-green-500 bg-green-500' : 'border-white/10 group-hover:border-prime-purple'
                    }`} />
                  </button>
                ))}

                <AnimatePresence>
                  {feedback && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                    >
                      <div className={`px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl border ${
                        feedback === 'correct' ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-red-500/20 border-red-500/50 text-red-400'
                      }`}>
                        {feedback === 'correct' ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
                        <span className="text-2xl font-black uppercase tracking-widest">
                          {feedback === 'correct' ? 'Correct!' : 'Wrong!'}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center"
            >
              <div className="w-24 h-24 rounded-3xl prime-gradient flex items-center justify-center mb-6 shadow-2xl shadow-prime-purple/40">
                <Trophy size={48} />
              </div>
              <h2 className="text-3xl font-display font-bold mb-2">Game Completed!</h2>
              <p className="text-white/60 mb-8">You've earned a total of</p>
              <div className="text-5xl font-display font-black text-prime-orange mb-12">
                ₦{score.toLocaleString()}
              </div>
              
              <div className="w-full space-y-4">
                <button 
                  onClick={() => setView('dashboard')}
                  className="w-full prime-gradient py-4 rounded-2xl font-bold text-lg"
                >
                  Back to Dashboard
                </button>
                <button 
                  onClick={startNewGame}
                  className="w-full glass-card py-4 rounded-2xl font-bold text-lg"
                >
                  Play Again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {renderToast()}
      </div>
    );
  }

  if (view === 'withdraw' && user) {
    return (
      <div className="min-h-screen bg-prime-blue pb-24">
        <header className="p-6 flex items-center gap-4 sticky top-0 bg-prime-blue/80 backdrop-blur-md z-20">
          <button onClick={() => setView('dashboard')} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
            <ChevronRight className="rotate-180" />
          </button>
          <h1 className="text-xl font-display font-bold">Withdraw Funds</h1>
        </header>

        <main className="px-6 space-y-6">
          <div className="glass-card p-6">
            <p className="text-white/40 text-xs mb-1">Available Balance</p>
            <h2 className="text-2xl font-bold">₦{user.balance.toLocaleString()}</h2>
          </div>

          <form onSubmit={handleWithdraw} className="space-y-4">
            <div className="space-y-4">
              <select 
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-prime-purple transition-colors appearance-none"
                value={withdrawData.bank}
                onChange={e => setWithdrawData({...withdrawData, bank: e.target.value})}
              >
                <option value="" disabled className="bg-prime-blue">Select Bank</option>
                <option value="OPAY" className="bg-prime-blue">OPAY</option>
                <option value="PALMPAY" className="bg-prime-blue">PALMPAY</option>
                <option value="Moniepoint" className="bg-prime-blue">Moniepoint</option>
                <option value="Access Bank" className="bg-prime-blue">Access Bank</option>
                <option value="GTBank" className="bg-prime-blue">GTBank</option>
                <option value="Zenith Bank" className="bg-prime-blue">Zenith Bank</option>
                <option value="First Bank" className="bg-prime-blue">First Bank</option>
                <option value="UBA" className="bg-prime-blue">UBA</option>
                <option value="Other Banks" className="bg-prime-blue">Other Banks</option>
              </select>
              <input 
                type="text" 
                placeholder="Account Number"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-prime-purple transition-colors"
                value={withdrawData.account}
                onChange={e => setWithdrawData({...withdrawData, account: e.target.value})}
              />
              <input 
                type="text" 
                placeholder="Account Name"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-prime-purple transition-colors"
                value={withdrawData.name}
                onChange={e => setWithdrawData({...withdrawData, name: e.target.value})}
              />
              <input 
                type="number" 
                placeholder="Amount to Withdraw"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-prime-purple transition-colors"
                value={withdrawData.amount}
                onChange={e => setWithdrawData({...withdrawData, amount: e.target.value})}
              />
              <div className="space-y-2">
                <input 
                  type="text" 
                  placeholder="Enter Prime Code"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-prime-purple transition-colors"
                  value={withdrawData.code}
                  onChange={e => setWithdrawData({...withdrawData, code: e.target.value})}
                />
                <button 
                  type="button"
                  onClick={() => setView('buy_prime')}
                  className="text-xs text-prime-orange hover:underline block"
                >
                  Don't have a code? Buy Prime
                </button>
              </div>
            </div>

            <button type="submit" className="w-full prime-gradient py-4 rounded-2xl font-bold text-lg mt-4 cursor-pointer">
              Confirm Withdrawal
            </button>
          </form>
        </main>
        {renderToast()}
      </div>
    );
  }

  if ((view === 'airtime' || view === 'data') && user) {
    const type = view === 'airtime' ? 'Airtime' : 'Data';
    return (
      <div className="min-h-screen bg-prime-blue pb-24">
        <header className="p-6 flex items-center gap-4 sticky top-0 bg-prime-blue/80 backdrop-blur-md z-20">
          <button onClick={() => setView('dashboard')} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
            <ChevronRight className="rotate-180" />
          </button>
          <h1 className="text-xl font-display font-bold">Buy {type}</h1>
        </header>

        <main className="px-6 space-y-6">
          <form onSubmit={(e) => handleServicePurchase(e, type)} className="space-y-4">
            <input 
              type="tel" 
              placeholder="Phone Number"
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-prime-purple transition-colors"
              value={serviceData.phone}
              onChange={e => setServiceData({...serviceData, phone: e.target.value})}
            />
            <input 
              type="number" 
              placeholder="Amount"
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-prime-purple transition-colors"
              value={serviceData.amount}
              onChange={e => setServiceData({...serviceData, amount: e.target.value})}
            />
            <div className="space-y-2">
              <input 
                type="text" 
                placeholder="Enter Prime Code"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-prime-purple transition-colors"
                value={serviceData.code}
                onChange={e => setServiceData({...serviceData, code: e.target.value})}
              />
              <button 
                type="button"
                onClick={() => setView('buy_prime')}
                className="text-xs text-prime-orange hover:underline block"
              >
                Don't have a code? Buy Prime
              </button>
            </div>

            <button type="submit" className="w-full prime-gradient py-4 rounded-2xl font-bold text-lg mt-4 cursor-pointer">
              Purchase {type}
            </button>
          </form>
        </main>
        {renderToast()}
      </div>
    );
  }
  if (view === 'buy_prime' && user) {
    return (
      <div className="min-h-screen bg-prime-blue pb-24 relative">
        <header className="p-6 flex items-center gap-4 sticky top-0 bg-prime-blue/80 backdrop-blur-md z-20">
          <button 
            onClick={() => setView('dashboard')}
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"
          >
            <ChevronRight className="rotate-180" />
          </button>
          <h1 className="text-xl font-display font-bold">Purchase Prime</h1>
        </header>

        <main className="px-6 space-y-8">
          <section className="glass-card p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400 mx-auto mb-4">
              <Trophy size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-2">Prime Membership</h2>
            <p className="text-white/60 text-sm mb-4">Get exclusive benefits and higher rewards</p>
            <div className="text-3xl font-display font-black text-prime-orange">₦8,000</div>
          </section>

          <section className="glass-card p-6 space-y-4">
            <h3 className="font-bold text-white/80">Management Account</h3>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/40">Account Number</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-lg">1970488179</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText('1970488179');
                      triggerToast('Account number copied!', 'success');
                    }}
                    className="text-white/40 hover:text-white transition-colors"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/40">Bank Name</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">Access Bank</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText('Access Bank');
                      triggerToast('Bank name copied!', 'success');
                    }}
                    className="text-white/40 hover:text-white transition-colors"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/40">Account Name</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">OHI ABDULSALAM</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText('OHI ABDULSALAM');
                      triggerToast('Account name copied!', 'success');
                    }}
                    className="text-white/40 hover:text-white transition-colors"
                  >
                    <Copy size={16} />
                  </button>
                </div>
              </div>
            </div>
            <p className="text-[10px] text-white/40 italic">* Please ensure you pay the exact amount of ₦8,000</p>
          </section>

          <section className="glass-card p-6">
            <h3 className="font-bold mb-4">Upload Payment Proof</h3>
            
            {paymentStatus === 'failed' ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-center space-y-3"
              >
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 mx-auto">
                  <XCircle size={24} />
                </div>
                <h4 className="font-bold text-red-400">Verification Failed</h4>
                <p className="text-xs text-red-400/80">
                  We couldn't verify your payment. Please{' '}
                  <a 
                    href="https://t.me/Godspowerde"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-red-400 hover:text-white transition-colors font-semibold"
                  >
                    contact support
                  </a>{' '}
                  or try again with a clearer proof.
                </p>
                <button 
                  onClick={() => setPaymentStatus('idle')}
                  className="text-white bg-red-500 px-6 py-2 rounded-xl text-sm font-bold mt-2 hover:scale-105 active:scale-95 transition-all text-center mx-auto block"
                >
                  Try Again
                </button>
              </motion.div>
            ) : paymentStatus === 'success' ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl text-center space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto animate-bounce">
                  <CheckCircle2 size={36} />
                </div>
                <h4 className="font-bold text-emerald-400 text-xl">Payment Verified!</h4>
                <p className="text-sm text-emerald-400/80">Your upgrade to <span className="font-bold font-display text-white">Prime Membership</span> is successful.</p>
                
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-2 mt-2">
                  <span className="text-[10px] text-white/40 uppercase tracking-wider block">Your Premium Prime Code</span>
                  <div className="flex items-center justify-center gap-3">
                    <span className="font-mono font-bold text-2xl text-emerald-400 tracking-wider">primeABC</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText('primeABC');
                        triggerToast('Prime Code copied!', 'success');
                      }}
                      className="text-white/60 hover:text-white p-1.5 hover:bg-white/5 rounded transition-all"
                    >
                      <Copy size={18} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-white/50 italic">Use this Prime Code to withdraw your earnings and buy services instantly!</p>

                <button 
                  onClick={() => setView('dashboard')}
                  className="w-full prime-gradient py-3.5 rounded-xl font-bold mt-4 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  Go to Dashboard
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handlePaymentSubmit} className="space-y-6">
                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setPaymentProof(URL.createObjectURL(e.target.files[0]));
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center hover:border-prime-purple transition-colors">
                    {paymentProof ? (
                      <img src={paymentProof} alt="Proof" className="max-h-32 mx-auto rounded-lg" />
                    ) : (
                      <div className="space-y-2">
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto text-white/40">
                          <ArrowUpRight size={20} />
                        </div>
                        <p className="text-sm text-white/60">Click to upload screenshot</p>
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={paymentStatus === 'confirming'}
                  className="w-full prime-gradient py-4 rounded-2xl font-bold text-lg disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {paymentStatus === 'confirming' ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Verifying...
                    </>
                  ) : 'Confirm Payment'}
                </button>
              </form>
            )}
          </section>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 p-4 z-30">
          <div className="max-w-md mx-auto glass-card py-4 px-8 flex justify-between items-center shadow-2xl border-white/5">
            <button onClick={() => setView('dashboard')} className="text-white/40"><Wallet size={24} /></button>
            <button className="text-white/40"><History size={24} /></button>
            <button onClick={startNewGame} className="w-14 h-14 prime-gradient rounded-full flex items-center justify-center shadow-lg shadow-prime-purple/40 -mt-12 border-4 border-prime-blue">
              <Gamepad2 size={28} />
            </button>
            <button className="text-white/40"><TrendingUp size={24} /></button>
            <button onClick={() => setView('profile')} className="text-white/40"><UserIcon size={24} /></button>
          </div>
        </nav>
        {renderToast()}
      </div>
    );
  }

  return null;
}
