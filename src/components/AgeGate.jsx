import React, { useMemo, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, Lock } from 'lucide-react';
import { LOGO_URL } from '@/lib/constants';
import { useAuth } from '@/lib/AuthContext';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function calcAge(dob) {
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age -= 1;
  return age;
}

function daysInMonth(month, year) {
  if (!month) return 31;
  const y = year || new Date().getFullYear();
  return new Date(y, month, 0).getDate();
}

export default function AgeGate({ onVerified }) {
  const { logout } = useAuth();
  const [month, setMonth] = useState('');
  const [day, setDay] = useState('');
  const [year, setYear] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const years = useMemo(() => {
    const now = new Date().getFullYear();
    return Array.from({ length: 100 }, (_, i) => String(now - i));
  }, []);

  const dob = useMemo(() => {
    if (!month || !day || !year) return null;
    const d = new Date(Number(year), Number(month) - 1, Number(day));
    return isNaN(d.getTime()) ? null : d;
  }, [month, day, year]);

  const age = dob ? calcAge(dob) : null;
  const complete = !!dob;
  const under13 = complete && age < 13;

  const submit = async () => {
    setError('');
    if (!complete) {
      setError('Please enter your full date of birth to continue.');
      return;
    }
    if (under13) return; // blocked screen handles itself
    setSubmitting(true);
    try {
      const iso = `${dob.getFullYear()}-${String(dob.getMonth() + 1).padStart(2, '0')}-${String(dob.getDate()).padStart(2, '0')}`;
      await base44.auth.updateMe({
        age_verified: true,
        age_verified_at: new Date().toISOString(),
        date_of_birth: iso,
      });
      await onVerified?.();
    } catch {
      setError('Something went wrong saving your confirmation. Please try again.');
      setSubmitting(false);
    }
  };

  const maxDay = daysInMonth(Number(month), Number(year));

  return (
    <div className="fixed inset-0 brand-gradient flex items-center justify-center p-5 overflow-y-auto">
      <div className="w-full max-w-md bg-card rounded-3xl arena-shadow border border-white/20 p-6 sm:p-8 my-auto">
        <div className="flex flex-col items-center text-center">
          <img src={LOGO_URL} alt="Ball Up Top" className="w-16 h-16 rounded-2xl mb-3" />
          <h1 className="font-heading font-extrabold text-2xl">Before you ball up top</h1>
          <p className="text-sm text-muted-foreground mt-1.5 mb-5">
            Ball Up Top is a community for real players. Confirm your date of birth so we can keep the court safe for everyone.
          </p>
        </div>

        {!under13 && (
          <>
            <label className="block text-xs font-semibold text-muted-foreground mb-2">Date of birth</label>
            <div className="grid grid-cols-3 gap-2 mb-2">
              <select
                value={month}
                onChange={(e) => { setMonth(e.target.value); if (Number(day) > daysInMonth(Number(e.target.value), Number(year))) setDay(''); }}
                className="h-11 rounded-xl border border-input bg-background px-2 text-sm appearance-none"
              >
                <option value="">Month</option>
                {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                disabled={!month}
                className="h-11 rounded-xl border border-input bg-background px-2 text-sm appearance-none disabled:opacity-50"
              >
                <option value="">Day</option>
                {Array.from({ length: maxDay }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}</option>)}
              </select>
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="h-11 rounded-xl border border-input bg-background px-2 text-sm appearance-none"
              >
                <option value="">Year</option>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>

            {complete && age >= 13 && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5 mb-4">
                <ShieldCheck className="w-3.5 h-3.5 text-primary" /> You're {age} — you're cleared to play.
              </p>
            )}

            {error && <p className="text-xs text-destructive mb-3">{error}</p>}

            <Button onClick={submit} disabled={submitting} className="w-full h-11 rounded-xl text-base">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Continue'}
            </Button>

            <p className="text-[11px] text-muted-foreground text-center mt-3 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" /> We ask this once. Your birthdate stays on your account.
            </p>
          </>
        )}

        {under13 && (
          <div className="text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <Lock className="w-7 h-7 text-destructive" />
            </div>
            <h2 className="font-heading font-bold text-xl mb-2">You're {age} — Ball Up Top is 13+ only</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Ball Up Top is currently only available to players 13 and older. Come back and run with us once you turn 13. Thanks for understanding — we're just keeping the court safe.
            </p>
            <Button variant="secondary" className="w-full h-11 rounded-xl" onClick={() => logout(true)}>
              Log out
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}