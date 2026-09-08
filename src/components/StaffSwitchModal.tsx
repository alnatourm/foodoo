import React, { useState } from 'react';
import {
  User,
  Shield,
  KeyRound,
  X,
  Check,
  AlertCircle,
  ChefHat,
  Smartphone,
  ShoppingCart,
  FileSpreadsheet,
  Crown,
  Sparkles,
} from 'lucide-react';
import { StaffUser, UserRole } from '../types/restaurant';
import { useLanguage } from '../i18n/LanguageContext';

interface StaffSwitchModalProps {
  staffList: StaffUser[];
  currentUser: StaffUser | null;
  onSelectUser: (user: StaffUser) => void;
  onClose: () => void;
}

export const StaffSwitchModal: React.FC<StaffSwitchModalProps> = ({
  staffList,
  currentUser,
  onSelectUser,
  onClose,
}) => {
  const { t } = useLanguage();
  const [pinInput, setPinInput] = useState<string>('');
  const [selectedUserCandidate, setSelectedUserCandidate] = useState<StaffUser | null>(currentUser);
  const [error, setError] = useState<string | null>(null);

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'SUPER_ADMIN':
      case 'OWNER':
        return {
          label: 'Admin / Owner',
          color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
          icon: <Crown className="w-3.5 h-3.5 text-purple-400" />,
        };
      case 'MANAGER':
        return {
          label: 'Manager',
          color: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
          icon: <Shield className="w-3.5 h-3.5 text-indigo-400" />,
        };
      case 'CASHIER':
        return {
          label: 'POS Cashier',
          color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          icon: <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />,
        };
      case 'WAITER':
        return {
          label: 'Waiter / Server',
          color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          icon: <Smartphone className="w-3.5 h-3.5 text-blue-400" />,
        };
      case 'KITCHEN':
        return {
          label: 'Kitchen Station',
          color: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
          icon: <ChefHat className="w-3.5 h-3.5 text-orange-400" />,
        };
      case 'ACCOUNTANT':
        return {
          label: 'Accountant',
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          icon: <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />,
        };
      default:
        return {
          label: role,
          color: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
          icon: <User className="w-3.5 h-3.5 text-slate-400" />,
        };
    }
  };

  const handleKeypadPress = (val: string) => {
    if (val === 'CLEAR') {
      setPinInput('');
      setError(null);
    } else if (val === 'BACK') {
      setPinInput((prev) => prev.slice(0, -1));
    } else {
      if (pinInput.length < 6) {
        const newPin = pinInput + val;
        setPinInput(newPin);
        // If 4 digits entered, check if matches any staff PIN automatically
        if (newPin.length === 4) {
          const matched = staffList.find((s) => s.pinCode === newPin && s.isActive);
          if (matched) {
            onSelectUser(matched);
            onClose();
          }
        }
      }
    }
  };

  const handleManualLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pinInput.trim()) {
      setError('Please enter your 4-digit PIN');
      return;
    }

    const matched = staffList.find((s) => s.pinCode === pinInput.trim() && s.isActive);
    if (matched) {
      onSelectUser(matched);
      onClose();
    } else {
      setError('Incorrect PIN. Please select a user profile or enter their assigned PIN.');
    }
  };

  const handleQuickSwitch = (user: StaffUser) => {
    onSelectUser(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">
                {t('staff.switchTitle', 'Staff Switch & Terminal Login')}
              </h2>
              <p className="text-xs text-slate-400">
                {t('staff.switchSubtitle', 'Identify cashier, waiter, or manager for orders & permissions')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Left Staff List, Right PIN Keypad */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto">
          {/* Left: Quick Staff Directory */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t('staff.selectStaff', 'Select Staff Profile')}
              </span>
              <span className="text-[11px] text-amber-400 font-semibold">
                {staffList.length} Active Staff
              </span>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {staffList.map((user) => {
                const badge = getRoleBadge(user.role);
                const isSelected = currentUser?.id === user.id;

                return (
                  <div
                    key={user.id}
                    onClick={() => handleQuickSwitch(user)}
                    className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between group ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                        : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-700 text-slate-200 font-bold flex items-center justify-center text-sm">
                        {user.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white group-hover:text-amber-400 transition">
                            {user.name}
                          </span>
                          {isSelected && (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded border ${badge.color}`}
                          >
                            {badge.icon}
                            {badge.label}
                          </span>
                          {user.assignedStation && (
                            <span className="text-[10px] text-slate-400">
                              Station: {user.assignedStation}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-mono text-slate-400 group-hover:text-amber-300 font-semibold">
                        PIN: {user.pinCode}
                      </span>
                      <div className="text-[10px] text-slate-500">Tap to Switch</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick Demonstration Chips */}
            <div className="pt-2 border-t border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-2 font-medium">
                {t('staff.quickRoles', 'One-Click Role Simulation (for testing):')}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { role: 'OWNER', label: 'Admin (All)' },
                  { role: 'WAITER', label: 'Waiter (Tablet)' },
                  { role: 'CASHIER', label: 'Cashier (POS)' },
                  { role: 'KITCHEN', label: 'Kitchen (KDS)' },
                  { role: 'ACCOUNTANT', label: 'Accountant (P&L)' },
                ].map((item) => {
                  const sampleUser = staffList.find((s) => s.role === item.role);
                  if (!sampleUser) return null;
                  return (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => handleQuickSwitch(sampleUser)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-amber-500/20 hover:text-amber-300 hover:border-amber-500/40 text-[11px] font-semibold text-slate-300 border border-slate-700 transition"
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right: Touch PIN Keypad */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-950/70 border border-slate-800 rounded-2xl">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              {t('staff.enterPin', 'Enter 4-Digit Staff PIN')}
            </span>

            {/* PIN Display Dots / Input */}
            <div className="w-full max-w-[200px] mb-4">
              <div className="h-12 bg-slate-900 border border-slate-700 rounded-xl flex items-center justify-center gap-3 text-2xl font-mono text-amber-400 tracking-widest px-4">
                {pinInput ? (
                  <span>{'•'.repeat(pinInput.length)}</span>
                ) : (
                  <span className="text-slate-600 text-sm font-sans tracking-normal">
                    Enter PIN
                  </span>
                )}
              </div>
            </div>

            {error && (
              <div className="w-full mb-3 p-2 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs text-center">
                {error}
              </div>
            )}

            {/* 10-Key Keypad */}
            <div className="grid grid-cols-3 gap-2 w-full max-w-[220px]">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
                <button
                  type="button"
                  key={k}
                  onClick={() => {
                    if (k === 'C') handleKeypadPress('CLEAR');
                    else if (k === '⌫') handleKeypadPress('BACK');
                    else handleKeypadPress(k);
                  }}
                  className="h-12 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-amber-500/20 active:text-amber-300 text-lg font-bold text-slate-100 border border-slate-700/60 transition select-none flex items-center justify-center shadow-sm"
                >
                  {k}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleManualLogin}
              disabled={!pinInput.trim()}
              className="mt-4 w-full max-w-[220px] py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-bold text-xs transition shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{t('staff.loginBtn', 'Log In')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
