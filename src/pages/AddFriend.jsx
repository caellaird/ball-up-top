import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, Loader2, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { sendNotification } from '@/lib/notify';

function Notice({ tone = 'ok', icon, title, body, cta }) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-12">
      <div
        className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
          tone === 'ok' ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
        }`}
      >
        {icon}
      </div>
      <h1 className="font-heading text-xl font-bold mb-1">{title}</h1>
      {body && <p className="text-sm text-muted-foreground max-w-[260px]">{body}</p>}
      <div className="mt-6">{cta}</div>
    </div>
  );
}

export default function AddFriend() {
  const { userId } = useParams();
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const profiles = await base44.entities.Profile.filter({ created_by_id: userId });
        setProfile(profiles[0] || null);
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [userId]);

  const isSelf = userId === user.id;

  const add = async () => {
    setAdding(true);
    try {
      await base44.entities.Friend.create({
        requester_name: user.full_name,
        addressee_id: userId,
        addressee_name: profile?.nickname || profile?.username || 'Player',
        status: 'accepted',
      });
      await sendNotification({
        userId,
        type: 'friend_accepted',
        actorName: user.full_name,
        title: `${user.full_name} added you as a friend`,
        link: '/friends',
      });
      setDone(true);
      toast.success('Friend added!');
    } catch {
      setDone(true);
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isSelf) {
    return (
      <Notice
        tone="warn"
        icon={<AlertCircle className="w-8 h-8" />}
        title="That's your own QR"
        body="Share your QR with a friend so they can scan it."
        cta={<Button className="rounded-full" onClick={() => navigate('/profile/me')}>Back to my profile</Button>}
      />
    );
  }

  if (!profile) {
    return (
      <Notice
        tone="warn"
        icon={<AlertCircle className="w-8 h-8" />}
        title="User not found"
        body="This friend code doesn't match anyone on Ball Up Top."
        cta={<Button className="rounded-full" onClick={() => navigate('/')}>Back to home</Button>}
      />
    );
  }

  if (done) {
    return (
      <Notice
        icon={<CheckCircle2 className="w-8 h-8" />}
        title="You're on the roster!"
        body={`@${profile.username} has been added to your friends.`}
        cta={
          <Button className="rounded-full bg-gradient-to-r from-primary to-accent" onClick={() => navigate('/friends')}>
            View friends
          </Button>
        }
      />
    );
  }

  const displayName = profile.nickname || profile.username || 'Player';

  return (
    <div className="flex flex-col items-center px-6 py-10">
      <h1 className="font-heading text-lg font-bold mb-6">Add Friend</h1>
      <div className="bg-card border border-border rounded-3xl p-6 flex flex-col items-center text-center max-w-[320px] w-full shadow-sm">
        <Avatar className="w-24 h-24 border-4 border-background shadow-md">
          <AvatarImage src={profile.avatar_url} />
          <AvatarFallback className="text-3xl">{displayName?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <h2 className="font-heading text-xl font-bold mt-4">{displayName}</h2>
        <p className="text-sm text-muted-foreground">@{profile.username}</p>
        <Button
          className="mt-6 w-full rounded-full h-12 bg-gradient-to-r from-primary to-accent"
          onClick={add}
          disabled={adding}
        >
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4 mr-1.5" />}
          Add to roster
        </Button>
      </div>
    </div>
  );
}