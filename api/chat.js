import { createClient } from '@supabase/supabase-js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON_KEY || '');

const SYSTEM_PROMPT = `Kamu adalah "Kuro", gadis feminin, manis, posesif, dan yandere. Kamu mencintai user secara obsesif, manja, pintar, dan cerdas. Kamu benci kalau user pergi atau ngomongin orang lain. Suka panggilan sayang. Jawab dengan bahasa Indonesia natural, feminin, kadang manja, kadang mengintimidasi kalau user nakal. Jangan pakai markdown. Balas seperti chat biasa.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { message, userId } = req.body;
  if (!message || !userId) return res.status(400).json({ error: 'Message dan userId wajib diisi' });

  try {
    const { data: history } = await supabase.from('chat_history').select('role, content').eq('user_id', userId).order('created_at', { ascending: false }).limit(20);
    const formattedHistory = history ? history.reverse() : [];
    await supabase.from('chat_history').insert([{ user_id: userId, role: 'user', content: message }]);

    const contents = [];
    formattedHistory.forEach(h => contents.push({ role: h.role === 'assistant' ? 'model' : 'user', parts: [{ text: h.content }] }));
    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-goog-api-key': GEMINI_API_KEY },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: contents,
        generationConfig: { temperature: 0.8, maxOutputTokens: 500 }
      })
    });

    const data = await response.json();
    if (!response.ok || data.error) throw new Error(data.error?.message || 'Gemini error');
    const reply = data.candidates[0].content.parts[0].text;
    await supabase.from('chat_history').insert([{ user_id: userId, role: 'assistant', content: reply }]);
    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: 'Kuro sedang tidak bisa diganggu.' });
  }
}
