import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QrCode, ScanLine, Copy, Mail, Search, Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { buildFriendInviteUrl, parseFriendQr, notifyProfileUpdated } from '@/lib/friendCodes';
import { sendNotification } from '@/lib/notify';
import QRCodeDialog from './QRCodeDialog';
import QRScannerDialog from './QRScannerDialog';

export default function AddFriendsDialog({ open, onOpenChange, user }) {
  const navigate = useNavigate();
  const [showQR, setShowQR] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  const inviteUrl = buildFriendInviteUrl(user.id);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success('Invite link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const handleScanDecode = (raw) => {
    setShowScanner(false);
    const userId = parseFriendQr(raw);
    if (!userId) {
      toast.error("That QR isn't a friend code");
      return;
    }
    onOpenChange?.(false);
    navigate(`/add-friend/${userId}`);
  };

  const addFriend = async (targetUser, displayName) => {
    try {
      await base44.entities.Friend.create({
        requester_name: user.full_name,
        addressee_id: targetUser.id,
        addressee_name: displayName || targetUser.full_name,
        status: 'accepted',
      });
      await sendNotification({
        userId: targetUser.id,
        type: 'friend_accepted',
        actorName: user.full_name,
        title: `${user.full_name} added you as a friend`,
        link: '/friends',
      });
      notifyProfileUpdated();
    } catch {
      // duplicate friendship → treat as success (idempotent)
    }
  };

  const submit = async (e) => {
    e?.preventDefault();
    let value = input.trim();
    if (!value) return;
    if (value.startsWith('@')) value = value.slice(1);
    setBusy(true);
    try {
      if (value.includes('@')) {
        const users = await base44.entities.User.list();
        const target = users.find((u) => u.email?.toLowerCase() === value.toLowerCase());
        if (target) {
          if (target.id === user.id) {
            toast("That's you 🙂");
            return;
          }
          await addFriend(target, target.full_name);
          toast.success(`Added ${target.full_name}`);
          setInput('');
        } else {
          const subject = encodeURIComponent(`${user.full_name} invited you to Ball Up Top`);
          const body = encodeURIComponent(`Join me on Ball Up Top!\n\n${inviteUrl}`);
          window.location.href = `mailto:${value}?subject=${subject}&body=${body}`;
        }
      } else {
        const profiles = await base44.entities.Profile.list();
        const targetProfile = profiles.find((p) => p.username?.toLowerCase() === value.toLowerCase());
        if (!targetProfile) {
          toast.error('No user with that username');
          return;
        }
        if (targetProfile.created_by_id === user.id) {
          toast("That's you 🙂");
          return;
        }
        const users = await base44.entities.User.list();
        const targetUser = users.find((u) => u.id === targetProfile.created_by_id);
        if (!targetUser) {
          toast.error('User not found');
          return;
        }
        await addFriend(targetUser, targetProfile.nickname || targetProfile.username);
        toast.success(`Added @${targetProfile.username}`);
        setInput('');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="rounded-t-3xl max-w-[480px] mx-auto">
          <SheetHeader>
            <SheetTitle className="font-heading text-center">Add Friends</SheetTitle>
          </SheetHeader>
          <div className="space-y-5 mt-4 pb-2">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowScanner(true)}
                className="flex flex-col items-center gap-2 bg-card border border-border rounded-2xl p-4 hover:bg-accent/5 transition"
              >
                <ScanLine className="w-7 h-7 text-primary" />
                <span className="text-sm font-semibold">Scan QR</span>
              </button>
              <button
                onClick={() => setShowQR(true)}
                className="flex flex-col items-center gap-2 bg-card border border-border rounded-2xl p-4 hover:bg-accent/5 transition"
              >
                <QrCode className="w-7 h-7 text-primary" />
                <span className="text-sm font-semibold">My QR</span>
              </button>
            </div>

            <div>
              <p className="text-[11px] text-muted-foreground mb-1.5">Invite link</p>
              <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-2.5">
                <span className="flex-1 text-xs text-muted-foreground truncate">{inviteUrl}</span>
                <Button size="sm" variant="secondary" className="rounded-lg shrink-0" onClick={copyLink}>
                  <Copy className="w-3.5 h-3.5 mr-1" /> Copy
                </Button>
              </div>
            </div>

            <form onSubmit={submit}>
              <p className="text-[11px] text-muted-foreground mb-1.5">Add by username or email</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                    {input.includes('@') ? <Mail className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                  </span>
                  <Input
                    placeholder="@username or email"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="pl-9 rounded-full"
                  />
                </div>
                <Button type="submit" disabled={busy} className="rounded-full bg-gradient-to-r from-primary to-accent">
                  {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4 mr-1" />}
                  Add
                </Button>
              </div>
            </form>
          </div>
        </SheetContent>
      </Sheet>

      <QRCodeDialog
        open={showQR}
        onOpenChange={setShowQR}
        value={inviteUrl}
        title="My QR Code"
        subtitle="Have a friend scan this to add you instantly."
      />
      <QRScannerDialog
        open={showScanner}
        onOpenChange={setShowScanner}
        onDecode={handleScanDecode}
      />
    </>
  );
}