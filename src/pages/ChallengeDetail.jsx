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
import ResultShareCard from '@/components/challenges/ResultShareCard';
import ChallengeEditSheet from '@/components/challenges/ChallengeEditSheet';
import WinnerSelector from '@/components/challenges/WinnerSelector';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import SocialShareSheet from '@/components/shared/SocialShareSheet';
import SquadNudgeSheet from '@/components/challenges/SquadNudgeSheet';
import { usePhotoViewer } from '@/lib/photoViewer';

export default function ChallengeDetail() {
  const { id } = useParams();
  const { user } = useOutletContext();
  const navigate = useNavigate();
  const { open: openPhotoViewer } = usePhotoViewer();
  const [challenge, setChallenge] = useState(null);
  const [games, setGames] = useState([]);
  const [showComplete, setShowComplete] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [creatorUsername, setCreatorUsername] = useState('');
  const [opponentUsername, setOpponentUsername] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [shareImageFile, setShareImageFile] = useState(null);
  const shareCardRef = useRef(null);
  const [showSquadNudge, setShowSquadNudge] = useState(false);

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
  const isSeries = challenge.series_type !== 'single';
  const sportDisplay = getSportDisplay(challenge);
  const creatorWins = challenge.creator_games_won || 0;
  const opponentWins = challenge.opponent_games_won || 0;
  const totalGames = challenge.games_to_win ? challenge.games_to_win * 2 - 1 : null;

  const opponentIdList = challenge.opponent_ids?.length ? challenge.opponent_ids : [challenge.opponent_id];
  const opponentNameList = challenge.opponent_names?.length ? challenge.opponent_names : [challenge.opponent_name];
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
            {challenge.winner_id === challenge.created_by_id && <span className="mr-1">👑</span>}
            <Link to={`/profile/${creatorUsername || 'me'}`} className={`hover:underline ${challenge.winner_id === challenge.created_by_id ? 'text-accent' : ''}`}>{challenge.creator_name}</Link>
            <span className="mx-2 text-muted-foreground">vs</span>
            {challenge.winner_id === challenge.opponent_id && <span className="mr-1">👑</span>}
            <Link to={`/profile/${opponentUsername || 'me'}`} className={`hover:underline ${challenge.winner_id === challenge.opponent_id ? 'text-accent' : ''}`}>{challenge.opponent_name}</Link>
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
              <p className="font-heading font-bold text-lg">{creatorWins} — {opponentWins}</p>
              <p className="text-xs text-muted-foreground">
                {challenge.status === 'completed'
                  ? 'Series complete'
                  : totalGames ? `Game ${creatorWins + opponentWins + 1} of ${totalGames}` : `Game ${creatorWins + opponentWins + 1}`}
              </p>
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
              <p className="font-heading font-bold text-lg">{challenge.score_creator} - {challenge.score_opponent}</p>
              {challenge.is_draw ? (
                <p className="text-sm text-secondary font-semibold">🤝 Draw</p>
              ) : challenge.winner_name ? (
                <p className="text-sm text-accent font-semibold">👑 {challenge.winner_name} wins</p>
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
                    {g.winner_name && <span className="text-xs font-bold text-accent">👑 {g.winner_name}</span>}
                  </div>
                  <p className="font-heading font-bold mt-1">{g.score_creator} - {g.score_opponent}</p>
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

        {showMultiStatus && challenge.status !== 'completed' && (
          <div className="bg-card rounded-2xl shadow-sm p-4 mb-4">
            <p className="text-sm font-semibold mb-2">{acceptedCount}/{participantStatuses.length} Players Accepted</p>
            <div className="space-y-1.5">
              {participantStatuses.map((p) => (
                <div key={p.user_id} className="flex items-center gap-2 text-sm">
                  <span>{p.status === 'accepted' ? '✓' : p.status === 'declined' ? '✕' : '⏳'}</span>
                  <span className={p.status === 'declined' ? 'text-muted-foreground line-through' : ''}>{p.name}</span>
                  <span className="text-xs text-muted-foreground capitalize">— {p.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {challenge.status === 'pending' && isOpponent && myParticipantStatus === 'pending' && (
          <div className="flex gap-3">
            <Button onClick={() => respond('accepted')} className="flex-1 rounded-full h-12">Accept</Button>
            <Button onClick={() => respond('declined')} variant="secondary" className="flex-1 rounded-full h-12">Decline</Button>
          </div>
        )}
        {challenge.status === 'pending' && isOpponent && myParticipantStatus !== 'pending' && (
          <p className="text-center text-sm text-muted-foreground">
            Waiting for other players to respond...
          </p>
        )}
        {challenge.status === 'pending' && isCreator && (
          <p className="text-center text-sm text-muted-foreground">
            {showMultiStatus ? 'Waiting for players to respond...' : `Waiting for ${challenge.opponent_name} to respond...`}
          </p>
        )}
        {challenge.status === 'accepted' && isParticipant && (
          <WinnerSelector
            challenge={challenge}
            onSaved={(updated) => setChallenge(updated)}
          />
        )}

        {challenge.status === 'accepted' && isParticipant && (
          <Button onClick={() => setShowComplete(true)} className="w-full rounded-full h-12 bg-gradient-to-r from-[hsl(var(--accent))] to-[hsl(var(--secondary))]">
            {isSeries ? `Log Game ${creatorWins + opponentWins + 1}` : 'Complete Challenge'}
          </Button>
        )}

        {challenge.status === 'completed' && (
          <>
            <div className="flex justify-center mb-4">
              <ResultShareCard ref={shareCardRef} challenge={challenge} sportDisplay={sportDisplay} creatorWins={creatorWins} opponentWins={opponentWins} />
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
        title={`${sportDisplay.emoji} ${challenge.creator_name} vs ${opponentNameList.join(', ')}`}
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
          <ChallengeEditSheet
            open={showEdit}
            onOpenChange={setShowEdit}
            challenge={challenge}
            onSaved={(updated) => {
              setChallenge(updated);
              setShowEdit(false);
            }}
          />
        </>
      )}
    </div>
  );
}