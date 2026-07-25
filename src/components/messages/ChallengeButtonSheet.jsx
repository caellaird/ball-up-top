import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { base44 } from '@/api/base44Client';
import { sendNotification } from '@/lib/notify';

const FORMATS = ['1v1', '2v2', 'HORSE', 'Around the World', 'First to 11', 'Custom Rules'];

export default function ChallengeButtonSheet({ open, onOpenChange, thread, user, onSent }) {
  const [format, setFormat] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [customRules, setCustomRules] = useState('');
  const [sending, setSending] = useState(false);

  const others = (thread.participant_ids || [])
    .map((id, i) => ({ id, name: thread.participant_names?.[i] }))
    .filter((p) => p.id !== user.id);

  const reset = () => {
    setFormat(null);
    setOpponent(null);
    setCustomRules('');
  };

  useEffect(() => {
    if (open && others.length === 1) setOpponent(others[0]);
  }, [open]);

  const canSend = format && opponent && (format !== 'Custom Rules' || customRules.trim());

  const send = async () => {
    setSending(true);
    const challenge = await base44.entities.Challenge.create({
      sport: 'basketball',
      creator_name: user.full_name,
      opponent_id: opponent.id,
      opponent_name: opponent.name,
      notes: format === 'Custom Rules' ? customRules.trim() : `Format: ${format}`,
    });

    await sendNotification({
      userId: opponent.id,
      type: 'challenge_invite',
      actorName: user.full_name,
      title: `${user.full_name} challenged you to ${format}!`,
      link: `/challenges/${challenge.id}`,
    });

    const cardBody = `🏀 Challenge Sent: ${format}\n${user.full_name} vs ${opponent.name}\n#challenge:${challenge.id}`;
    await base44.entities.Message.create({
      thread_id: thread.id,
      sender_name: user.full_name,
      body: cardBody,
    });
    await base44.entities.Thread.update(thread.id, { last_message: `🏀 Challenge: ${format}`, last_message_at: new Date().toISOString() });

    setSending(false);
    reset();
    onSent(challenge);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-heading">Start a Challenge</SheetTitle>
        </SheetHeader>
        <div className="space-y-4 mt-4">
          <div>
            <p className="text-sm font-semibold mb-2">Game Format</p>
            <div className="flex flex-wrap gap-2">
              {FORMATS.map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`text-xs font-semibold px-3 py-2 rounded-full border-2 ${format === f ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {format === 'Custom Rules' && (
            <Textarea placeholder="Describe the rules..." value={customRules} onChange={(e) => setCustomRules(e.target.value)} />
          )}

          {others.length > 1 && (
            <div>
              <p className="text-sm font-semibold mb-2">Challenge Who?</p>
              <div className="space-y-2">
                {others.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setOpponent(p)}
                    className={`w-full text-left px-3 py-2.5 rounded-2xl border-2 font-medium text-sm ${opponent?.id === p.id ? 'border-primary bg-primary/10' : 'border-border'}`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button
            onClick={send}
            disabled={!canSend || sending}
            className="w-full rounded-full h-12 bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] font-bold"
          >
            {sending ? 'Sending...' : 'Send Challenge'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}