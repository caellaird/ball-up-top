import React, { useEffect, useState, useRef } from 'react';
import { useParams, useOutletContext, useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import Header from '@/components/layout/Header';
import { MapPin, Clock, Pencil, CalendarPlus, Trash2, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { getSportDisplay } from '@/lib/constants';
import { buildGoogleCalendarUrl } from '@/lib/calendarLink';
import { sendNotification } from '@/lib/notify';
import CompleteChallengeSheet from '@/components/challenges/CompleteChallengeSheet';
import EditSeriesGameSheet from '@/components/challenges/EditSeriesGameSheet';
import GroupWinCounts from '@/components/challenges/GroupWinCounts';
import EndSeriesDialog from '@/components/challenges/EndSeriesDialog';
import ResultShareCard from '@/components/challenges/ResultShareCard';
import ChallengeEditSheet from '@/components/challenges/ChallengeEditSheet';
import WinnerSelector from '@/components/challenges/WinnerSelector';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import SocialShareSheet from '@/components/shared/SocialShareSheet';
import SquadNudgeSheet from '@/components/challenges/SquadNudgeSheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePhotoViewer } from '@/lib/photoViewer';
import { isPendingChallengeExpired } from '@/lib/challengeExpiry';
import { isGroupChallenge, getParticipants } from '@/lib/challengeGroup';

export default function ChallengeDetail() {
  const { id } = useParams();
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const { open: openPhotoViewer } = usePhotoViewer();
  const [challenge, setChallenge] = useState(null);
  const [games, setGames] = useState([]);
  const [showComplete, setShowComplete] = useState(false);
  const [showEndSeries, setShowEndSeries] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [creatorUsername, setCreatorUsername] = useState('');
  const [opponentUsername, setOpponentUsername] = useState('');
  const [participantProfiles, setParticipantProfiles] = useState([]);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareImageFile, setShareImageFile] = useState(null);
  const shareCardRef = useRef(null);
  const [showSquadNudge, setShowSquadNudge] = useState(false);
  const [editingGame, setEditingGame] = useState(null);

  useEffect(() => {
    load();
  }, [id]);

  // Show the "Bring your squad" nudge once per completed challenge (tracked in
  // localStorage so it doesn't reappear on every visit to the same challenge).
  useEffect(() => {
    if (!challenge || challenge.status !== 'completed') return;
    const isParticipant = challenge.created_by_id === user.id
      || challenge.opponent_id === user.id
      || challenge.opponent_ids?.includes(user.id);
    if (!isParticipant) return;
    const key = `squad_nudge_${challenge.id}`;
    if (!localStorage.getItem(key)) {
      localStorage.setItem(key, '1');
      setShowSquadNudge(true);
    }
  }, [challenge?.id, challenge?.status, user.id]);

  const load = async () => {
    const c = await base44.entities.Challenge.get(id);
    setChallenge(c);
    const [creatorProfiles, opponentProfiles] = await Promise.all([
      base44.entities.Profile.filter({ created_by_id: c.created_by_id }),
      base44.entities.Profile.filter({ created_by_id: c.opponent_id }),
    ]);
    if (creatorProfiles[0]) setCreatorUsername(creatorProfiles[0].username);
    if (opponentProfiles[0]) setOpponentUsername(opponentProfiles[0].username);

    // For group challenges, fetch every participant's profile so we can show a
    // roster with avatars. Skipped for 1v1 challenges to avoid extra calls.
    if (isGroupChallenge(c)) {
      const parts = getParticipants(c);
      const profileLists = await Promise.all(
        parts.map((p) => base44.entities.Profile.filter({ created_by_id: p.id }))
      );
      setParticipantProfiles(
        parts.map((p, i) => ({
          id: p.id,
          name: p.name,
          username: profileLists[i]?.[0]?.username || '',
          avatar_url: profileLists[i]?.[0]?.avatar_url || '',
        }))
      );
    } else {
      setParticipantProfiles([]);
    }

    if (c.series_type !== 'single') {
      const g = await base44.entities.SeriesGame.filter({ challenge_id: id }, 'game_number');
      setGames(g);
    }
  };

  const respond = async (status) => {
    const updatedStatuses = participantStatuses.map((p) =>
      p.user_id === user.id ? { ...p, status } : p
    );
    const allAccepted = updatedStatuses.every((p) => p.status === 'accepted');
    const nonePending = updatedStatuses.every((p) => p.status !== 'pending');
    const newStatus = allAccepted ? 'accepted' : nonePending ? 'declined' : 'pending';
    const updated = await base44.entities.Challenge.update(id, {
      participant_statuses: updatedStatuses,
      status: newStatus,
    });
    setChallenge(updated);
    await sendNotification({
      userId: challenge.created_by_id,
      type: 'challenge_response',
      actorName: user.full_name,
      title: `${user.full_name} ${status} your challenge`,
      link: `/challenges/${id}`,
    });
  };

  const deleteChallenge = async () => {
    setDeleting(true);
    try {
      // Service-role function cascades the delete across ALL participants' records.
      await base44.functions.invoke('deleteChallenge', { challengeId: id });
      navigate('/challenges');
    } catch (e) {
      setDeleting(false);
    }
  };

  // Captures the visible ResultShareCard to a PNG and opens the share sheet
  // with the image attached. Falls back to sharing without an image on error.
  const handleShareResult = async () => {
    if (!shareCardRef.current) { setShareOpen(true); return; }
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(shareCardRef.current, {
        useCORS: true,
        backgroundColor: null,
        scale: 3,
      });
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (blob) {
        setShareImageFile(new File([blob], 'ball-up-top-result.png', { type: 'image/png' }));
      }
    } catch { /* ignore capture errors — share without image */ }
    setShareOpen(true);
  };

  if (!challenge) return <div className="text-center text-muted-foreground py-10">Loading challenge...</div>;

  const isOpponent = challenge.opponent_id === user.id || challenge.opponent_ids?.includes(user.id);
  const isCreator = challenge.created_by_id === user.id;
  const isParticipant = isCreator || isOpponent;
  // A pending challenge past its 3-day grace window can no longer be accepted.
  const isExpired = isPendingChallengeExpired(challenge);
  const isSeries = challenge.series_type !== 'single';
  const sportDisplay = getSportDisplay(challenge);
  const creatorWins = challenge.creator_games_won || 0;
  const opponentWins = challenge.opponent_games_won || 0;
  const totalGames = challenge.games_to_win ? challenge.games_to_win * 2 - 1 : null;

  const opponentIdList = challenge.opponent_ids?.length ? challenge.opponent_ids : [challenge.opponent_id];
  const opponentNameList = challenge.opponent_names?.length ? challenge.opponent_names : [challenge.opponent_name];
  const isGroup = isGroupChallenge(challenge);
  const rankedFinalScores = (challenge.participant_scores || []).slice().sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const participantStatuses = challenge.participant_statuses?.length
    ? challenge.participant_statuses
    : opponentIdList.map((oid, i) => ({
        user_id: oid,
        name: opponentNameList[i],
        status: challenge.status === 'pending' ? 'pending' : challenge.status === 'declined' ? 'declined' : 'accepted',
      }));
  const acceptedCount = participantStatuses.filter((p) => p.status === 'accepted').length;
  const myParticipantStatus = participantStatuses.find((p) => p.user_id === user.id)?.status;
  const showMultiStatus = participantStatuses.length > 1;

  return (
    <div>
      <Header title="Challenge" backFallback="/challenges" />
      <div className="p-4">
        <div className="bg-card rounded-3xl shadow-sm p-5 mb-5 text-center relative">
          {isParticipant && challenge.status !== 'completed' && challenge.status !== 'declined' && (
            <div className="absolute top-4 right-4 flex items-center gap-3">
              <button onClick={() => setShowEdit(true)} className="p-1.5 text-muted-foreground">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => setShowDelete(true)} className="p-1.5 text-muted-foreground hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
          <span className="text-4xl">{sportDisplay.emoji}</span>
          {isSeries && challenge.series_name && (
            <p className="font-heading text-sm font-bold text-[hsl(var(--accent))] mt-2">{challenge.series_name}</p>
          )}
          <h1 className="font-heading text-xl font-bold mt-1 break-words leading-tight">
            {challenge.group_name ? (
              <span>{challenge.group_name}</span>
            ) : isGroup ? (
              <span>
                <Link to={`/profile/${creatorUsername || 'me'}`} className="hover:underline">{challenge.creator_name}</Link>
                <span className="mx-2 text-muted-foreground">vs</span>
                {opponentNameList.join(', ')}
              </span>
            ) : (
              <span>
                {challenge.winner_id === challenge.created_by_id && <span className="mr-1">👑</span>}
                <Link to={`/profile/${creatorUsername || 'me'}`} className={`hover:underline ${challenge.winner_id === challenge.created_by_id ? 'text-accent' : ''}`}>{challenge.creator_name}</Link>
                <span className="mx-2 text-muted-foreground">vs</span>
                {challenge.winner_id === challenge.opponent_id && <span className="mr-1">👑</span>}
                <Link to={`/profile/${opponentUsername || 'me'}`} className={`hover:underline ${challenge.winner_id === challenge.opponent_id ? 'text-accent' : ''}`}>{challenge.opponent_name}</Link>
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground capitalize mt-1">
            {sportDisplay.label} · {challenge.series_type}
          </p>

          <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-3">
            {challenge.location_name && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" />{challenge.location_name}</span>}
            {challenge.scheduled_time && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{format(new Date(challenge.scheduled_time), 'MMM d, h:mm a')}</span>}
          </div>
          {challenge.notes && <p className="text-sm mt-3 text-muted-foreground">{challenge.notes}</p>}

          {challenge.scheduled_time && challenge.status !== 'completed' && challenge.status !== 'declined' && challenge.status !== 'cancelled' && (
            <a
              href={buildGoogleCalendarUrl(challenge)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary mt-3"
            >
              <CalendarPlus className="w-4 h-4" /> Add to Google Calendar
            </a>
          )}

          {isSeries && (
            <div className="mt-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-3">
              {isGroup ? (
                <GroupWinCounts challenge={challenge} games={games} />
              ) : (
                <>
                  <p className="font-heading font-bold text-lg">{creatorWins} — {opponentWins}</p>
                  <p className="text-xs text-muted-foreground">
                    {challenge.status === 'completed'
                      ? 'Series complete'
                      : totalGames ? `Game ${creatorWins + opponentWins + 1} of ${totalGames}` : `Game ${creatorWins + opponentWins + 1}`}
                  </p>
                </>
              )}
              {challenge.status === 'completed' && challenge.is_draw && (
                <p className="text-sm text-secondary font-semibold mt-1">🤝 Series drawn</p>
              )}
              {challenge.status === 'completed' && !challenge.is_draw && challenge.winner_name && (
                <p className="text-sm text-accent font-semibold mt-1">👑 {challenge.winner_name} wins the series</p>
              )}
            </div>
          )}

          {!isSeries && challenge.status === 'completed' && (
            <div className="mt-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-3">
              {rankedFinalScores.length > 0 ? (
                <div className="space-y-1.5 text-left">
                  {rankedFinalScores.map((s, i) => (
                    <div key={s.user_id} className="flex items-center justify-between text-sm">
                      <span className="font-medium truncate">
                        {i === 0 && !challenge.is_draw && <span className="mr-1">👑</span>}
                        {s.name}
                      </span>
                      <span className="font-heading font-bold">{s.score}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="font-heading font-bold text-lg">{challenge.score_creator} - {challenge.score_opponent}</p>
              )}
              {challenge.is_draw ? (
                <p className="text-sm text-secondary font-semibold mt-1">🤝 Draw</p>
              ) : challenge.winner_name ? (
                <p className="text-sm text-accent font-semibold mt-1">👑 {challenge.winner_name} wins</p>
              ) : null}
              {challenge.caption && <p className="text-sm mt-2">{challenge.caption}</p>}
            </div>
          )}
        </div>

        {challenge.photos?.length > 0 && (
          <div className="grid grid-cols-2 gap-2 mb-5">
            {challenge.photos.map((p, i) => (
              <button key={i} onClick={() => openPhotoViewer(challenge.photos, i)} className="block active:scale-[0.98] transition">
                <img src={p} alt="" className="rounded-2xl object-cover w-full h-32" />
              </button>
            ))}
          </div>
        )}

        {isSeries && games.length > 0 && (
          <div className="mb-5">
            <h3 className="font-heading font-bold mb-3">Games</h3>
            <div className="space-y-2">
              {games.map((g) => (
                <div key={g.id} className="bg-card rounded-2xl shadow-sm p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Game {g.game_number}</span>
                    <div className="flex items-center gap-2">
                      {g.winner_name && <span className="text-xs font-bold text-accent">👑 {g.winner_name}</span>}
                      {g.created_by_id === user.id && (
                        <button onClick={() => setEditingGame(g)} className="p-1 text-muted-foreground hover:text-foreground">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                  {g.participant_scores?.length > 0 ? (
                    <div className="mt-1 space-y-1">
                      {[...g.participant_scores].sort((a, b) => (b.score ?? 0) - (a.score ?? 0)).map((s) => (
                        <div key={s.user_id} className="flex items-center justify-between text-sm">
                          <span className="font-medium truncate">{s.name}</span>
                          <span className="font-heading font-bold">{s.score}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="font-heading font-bold mt-1">{g.score_creator} - {g.score_opponent}</p>
                  )}
                  {g.caption && <p className="text-sm text-muted-foreground mt-1">{g.caption}</p>}
                  {g.photos?.length > 0 && (
                    <div className="grid grid-cols-3 gap-1.5 mt-2">
                      {g.photos.map((p, i) => (
                        <button key={i} onClick={() => openPhotoViewer(g.photos, i)} className="block active:scale-[0.98] transition">
                          <img src={p} alt="" className="rounded-lg object-cover w-full h-20" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {isGroup && (
          <div className="bg-card rounded-2xl shadow-sm p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold">The Squad <span className="text-muted-foreground font-normal">({participantStatuses.length})</span></p>
              {challenge.status !== 'completed' && (
                <p className="text-xs text-muted-foreground">{acceptedCount}/{participantStatuses.length} accepted</p>
              )}
            </div>
            <div className="space-y-2">
              {participantStatuses.map((p, i) => {
                const profile = participantProfiles.find((pp) => pp.id === p.user_id);
                const status = challenge.status === 'completed' ? null : p.status;
                return (
                  <div key={p.user_id} className="flex items-center gap-3 text-sm">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback>{p.name?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{p.name}</p>
                      {profile?.username && <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>}
                    </div>
                    {status && (
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${status === 'accepted' ? 'bg-accent/15 text-accent' : status === 'declined' ? 'bg-muted text-muted-foreground line-through' : 'bg-muted/60 text-muted-foreground'}`}>
                        {status === 'accepted' ? '✓ In' : status === 'declined' ? '✕ Out' : '⏳ Pending'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {challenge.status === 'pending' && isExpired && (
          <div className="bg-muted/60 rounded-2xl p-4 text-center">
            <p className="text-sm font-semibold text-muted-foreground">This challenge has expired</p>
            <p className="text-xs text-muted-foreground mt-1">
              It passed its 3-day response window and can no longer be accepted.
            </p>
          </div>
        )}
        {challenge.status === 'pending' && !isExpired && isOpponent && myParticipantStatus === 'pending' && (
          <div className="flex gap-3">
            <Button onClick={() => respond('accepted')} className="flex-1 rounded-full h-12">Accept</Button>
            <Button onClick={() => respond('declined')} variant="secondary" className="flex-1 rounded-full h-12">Decline</Button>
          </div>
        )}
        {challenge.status === 'pending' && !isExpired && isOpponent && myParticipantStatus !== 'pending' && (
          <p className="text-center text-sm text-muted-foreground">
            Waiting for other players to respond...
          </p>
        )}
        {challenge.status === 'pending' && !isExpired && isCreator && (
          <p className="text-center text-sm text-muted-foreground">
            {showMultiStatus ? 'Waiting for players to respond...' : `Waiting for ${challenge.opponent_name} to respond...`}
          </p>
        )}
        {challenge.status === 'accepted' && isParticipant && !isSeries && (
          <WinnerSelector
            challenge={challenge}
            onSaved={(updated) => setChallenge(updated)}
          />
        )}

        {challenge.status === 'accepted' && isParticipant && !isSeries && (
          <Button onClick={() => setShowComplete(true)} className="w-full rounded-full h-12 bg-gradient-to-r from-[hsl(var(--accent))] to-[hsl(var(--secondary))]">
            Complete Challenge
          </Button>
        )}

        {challenge.status === 'accepted' && isParticipant && isSeries && (
          <div className="flex gap-3">
            <Button onClick={() => setShowComplete(true)} className="flex-1 rounded-full h-12">
              Log Game {creatorWins + opponentWins + 1}
            </Button>
            <Button onClick={() => setShowEndSeries(true)} variant="outline" className="flex-1 rounded-full h-12">
              End Series
            </Button>
          </div>
        )}

        {challenge.status === 'completed' && (
          <>
            <div className="flex justify-center mb-4">
              <ResultShareCard ref={shareCardRef} challenge={challenge} sportDisplay={sportDisplay} creatorWins={creatorWins} opponentWins={opponentWins} games={games} />
            </div>
            <Button onClick={handleShareResult} variant="outline" className="w-full rounded-full h-12">
              <Share2 className="w-4 h-4" /> Share Result
            </Button>
          </>
        )}
      </div>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        onConfirm={deleteChallenge}
        title="Delete this challenge?"
        description="Are you sure you want to delete this? This action cannot be undone."
      />

      <SocialShareSheet
        open={shareOpen}
        onOpenChange={setShareOpen}
        imageFile={shareImageFile}
        title={`${sportDisplay.emoji} ${challenge.group_name || `${challenge.creator_name} vs ${opponentNameList.join(', ')}`}`}
        text={
          challenge.winner_name
            ? `${challenge.winner_name} won ${sportDisplay.label}! ${challenge.series_type !== 'single' ? `${creatorWins}–${opponentWins}` : ''} #BallUpTop`
            : `Result posted — ${sportDisplay.label} #BallUpTop`
        }
        url={`https://ball-up-pro.base44.app/challenges/${id}`}
      />

      <SquadNudgeSheet
        open={showSquadNudge}
        onOpenChange={setShowSquadNudge}
        user={user}
      />

      {challenge && (
        <>
          <CompleteChallengeSheet
            open={showComplete}
            onOpenChange={setShowComplete}
            challenge={challenge}
            user={user}
            onCompleted={() => {
              setShowComplete(false);
              load();
            }}
          />
          <EndSeriesDialog
            open={showEndSeries}
            onOpenChange={setShowEndSeries}
            challenge={challenge}
            user={user}
            onEnded={() => {
              setShowEndSeries(false);
              load();
            }}
          />
          <ChallengeEditSheet
            open={showEdit}
            onOpenChange={setShowEdit}
            challenge={challenge}
            onSaved={(updated) => {
              setChallenge(updated);
              setShowEdit(false);
            }}
          />
          <EditSeriesGameSheet
            open={!!editingGame}
            onOpenChange={(o) => { if (!o) setEditingGame(null); }}
            challenge={challenge}
            game={editingGame}
            user={user}
            onSaved={() => { setEditingGame(null); load(); }}
          />
        </>
      )}
    </div>
  );
}