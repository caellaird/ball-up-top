import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QrCode, ScanLine, Copy, Mail, Search, Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';
import { buildFriendInviteUrl, parseFriendQr, notifyProfileUpdated } from '@/lib/friendCodes';
import { sendNotification } from '@/lib/notify';
import UserSearchResult from './UserSearchResult';
import QRCodeDialog from './QRCodeDialog';
import QRScannerDialog from './QRScannerDialog';

export default function AddFriendsDialog({ open, onOpenChange, user }) {
  const navigate = useNavigate();
  const [showQR, setShowQR] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [looking, setLooking] = useState(false);

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

  // Live fuzzy search: as the user types a name or username, rank everyone by
  // how close the query is to their @username or full name and recommend them.
  useEffect(() => {
    const raw = input.trim();
    if (!raw) { setSuggestions([]); return; }
    let value = raw.startsWith('@') ? raw.slice(1) : raw;
    // Emails are handled by the submit (mailto) flow, not the live search.
    if (value.includes('@')) { setSuggestions([]); return; }
    const q = value.toLowerCase();
    const t = setTimeout(async () => {
      setLooking(true);
      try {
        const users = await base44.entities.User.list();
        const profiles = await base44.entities.Profile.list();
        const profByOwner = {};
        profiles.forEach((p) => { profByOwner[p.created_by_id] = p; });
        const matches = users
          .filter((u) => u.id !== user.id)
          .map((u) => {
            const p = profByOwner[u.id];
            const uname = (p?.username || '').toLowerCase();
            const name = (u.full_name || '').toLowerCase();
            let score = -1;
            if (uname === q) score = 100;
            else if (uname.startsWith(q)) score = 80;
            else if (uname.includes(q)) score = 60;
            else if (name === q) score = 70;
            else if (name.startsWith(q)) score = 50;
            else if (name.includes(q)) score = 30;
            return { u, p, score };
          })
          .filter((m) => m.score >= 0)
          .sort((a, b) => b.score - a.score)
          .slice(0, 8)
          .map((m) => ({ targetUser: m.u, profile: m.p, relation: null }));
        setSuggestions(matches);
      } catch {
        setSuggestions([]);
      }
      setLooking(false);
    }, 250);
    return () => clearTimeout(t);
  }, [input, user.id]);

  const addSuggestion = async (r) => {
    setBusy(true);
    try {
      await addFriend(r.targetUser, r.profile?.nickname || r.profile?.username);
      toast.success(`Added ${r.targetUser.full_name}`);
      setSuggestions((prev) => prev.map((x) => x.targetUser.id === r.targetUser.id ? { ...x, relation: 'accepted' } : x));
    } catch {
      toast.error('Something went wrong');
    } finally {
      setBusy(false);
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
          setSuggestions([]);
        } else {
          const subject = encodeURIComponent(`${user.full_name} invited you to Ball Up Top`);
          const body = encodeURIComponent(`Join me on Ball Up Top!\n\n${inviteUrl}`);
          window.location.href = `mailto:${value}?subject=${subject}&body=${body}`;
        }
      } else if (suggestions.length) {
        // Add the best fuzzy match.
        await addSuggestion(suggestions[0]);
        setInput('');
        setSuggestions([]);
      } else {
        toast.error('No user with that username');
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
        <SheetContent side="bottom" className="rounded-t-3xl max-w-[480px] mx-auto max-h-[90vh] overflow-y-auto">
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
              <p className="text-[11px] text-muted-foreground mb-1.5">Search by name or username</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                    {input.includes('@') ? <Mail className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                  </span>
                  <Input
                    placeholder="Name, @username, or email"
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

            {(looking || suggestions.length > 0) && (
              <div className="-mx-1">
                <p className="text-[11px] text-muted-foreground mb-1.5 px-1">
                  {looking ? 'Searching…' : 'Suggestions'}
                </p>
                {suggestions.map((r) => (
                  <UserSearchResult
                    key={r.targetUser.id}
                    result={r}
                    onAdd={() => addSuggestion(r)}
                  />
                ))}
              </div>
            )}
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