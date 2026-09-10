import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Ensures a Daily Ball Knower question exists for the given date (defaults to
// today). If one already exists it is returned as-is; otherwise an LLM generates
// a new basketball trivia question, which is persisted and returned. The LLM
// call is a restricted Core integration, so it runs server-side under the
// service role — the client never invokes InvokeLLM directly.
export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const b = body || {};
    const questionDate = b.question_date || new Date().toISOString().slice(0, 10);

    const admin = base44.asServiceRole;

    // Return the existing question for this date if one was already generated.
    const existing = await admin.entities.DailyQuestion.filter({ question_date: questionDate });
    if (existing && existing.length > 0) {
      return Response.json(existing[0]);
    }

    const generated = await admin.integrations.Core.InvokeLLM({
      prompt:
        'Generate one factually accurate basketball trivia question with exactly 4 multiple choice options and one correct answer. Include a short 1-2 sentence explanation.',
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

    const created = await admin.entities.DailyQuestion.create({
      question_date: questionDate,
      ...generated,
    });

    return Response.json(created);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}