import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Flame, CheckCircle2, XCircle } from 'lucide-react';
import { getOrCreateStats } from '@/lib/ensureProfile';
import { format } from 'date-fns';

export default function Daily() {
  const { user } = useOutletContext();
  const [question, setQuestion] = useState(null);
  const [answer, setAnswer] = useState(null);
  const [selected, setSelected] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    let q = (await base44.entities.DailyQuestion.filter({ question_date: today }))[0];
    if (!q) {
      const generated = await base44.integrations.Core.InvokeLLM({
        prompt: 'Generate one factually accurate basketball trivia question with exactly 4 multiple choice options and one correct answer. Include a short 1-2 sentence explanation.',
        response_json_schema: {
          type: 'object',
          properties: {
            question: { type: 'string' },
            options: { type: 'array', items: { type: 'string' } },
            correct_index: { type: 'number' },
            explanation: { type: 'string' },
          },
        },
      });
      q = await base44.entities.DailyQuestion.create({ question_date: today, ...generated });
    }
    setQuestion(q);
    const myAnswer = (await base44.entities.DailyQuestionAnswer.filter({ question_id: q.id, created_by_id: user.id }))[0];
    if (myAnswer) {
      setAnswer(myAnswer);
      setSelected(myAnswer.selected_index);
    }
    setStats(await getOrCreateStats(user));
    setLoading(false);
  };

  const submitAnswer = async (index) => {
    if (answer) return;
    setSelected(index);
    const isCorrect = index === question.correct_index;
    const points = isCorrect ? 20 : 0;
    const newAnswer = await base44.entities.DailyQuestionAnswer.create({
      question_id: question.id,
      selected_index: index,
      is_correct: isCorrect,
      points_earned: points,
    });
    const newStreak = isCorrect ? (stats.ball_knower_streak || 0) + 1 : 0;
    const updatedStats = await base44.entities.UserStats.update(stats.id, {
      ball_knower_points: (stats.ball_knower_points || 0) + points,
      ball_knower_streak: newStreak,
      ball_knower_longest_streak: Math.max(newStreak, stats.ball_knower_longest_streak || 0),
      last_answer_date: format(new Date(), 'yyyy-MM-dd'),
    });
    setStats(updatedStats);
    setAnswer(newAnswer);
  };

  if (loading) return <div className="text-center text-muted-foreground py-10">Loading today's question...</div>;

  return (
    <div>
      <div className="flex items-center gap-2 mb-6 text-primary font-semibold">
        <Flame className="w-5 h-5" />
        {stats?.ball_knower_streak || 0} day streak
      </div>
      <div className="bg-card border border-border rounded-xl p-6">
        <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Daily Ball Knower</p>
        <h2 className="font-heading text-xl mb-5">{question.question}</h2>
        <div className="space-y-3">
          {question.options.map((opt, i) => {
            const isCorrectOpt = i === question.correct_index;
            const isSelected = selected === i;
            let cls = 'border-border';
            if (answer) {
              if (isCorrectOpt) cls = 'border-emerald-500 bg-emerald-500/10';
              else if (isSelected) cls = 'border-destructive bg-destructive/10';
            } else if (isSelected) {
              cls = 'border-primary';
            }
            return (
              <button
                key={i}
                disabled={!!answer}
                onClick={() => submitAnswer(i)}
                className={`w-full text-left px-4 py-3 rounded-lg border ${cls} flex items-center justify-between`}
              >
                <span>{opt}</span>
                {answer && isCorrectOpt && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                {answer && isSelected && !isCorrectOpt && <XCircle className="w-4 h-4 text-destructive" />}
              </button>
            );
          })}
        </div>
        {answer && (
          <div className="mt-5 pt-5 border-t border-border">
            <p className={`font-semibold mb-1 ${answer.is_correct ? 'text-emerald-500' : 'text-destructive'}`}>
              {answer.is_correct ? `Correct! +${answer.points_earned} points` : 'Not quite.'}
            </p>
            <p className="text-sm text-muted-foreground">{question.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
}