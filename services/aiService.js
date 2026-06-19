const { OpenAI } = require('openai');

require('dotenv').config();

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MODEL_NAME = 'llama-3.3-70b-versatile';
const groq = GROQ_API_KEY
  ? new OpenAI({
      apiKey: GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    })
  : null;

const generateResponse = async (prompt, context, category, conversationHistory = []) => {
  if (!groq) {
    return 'Üzgünüm, sohbet servisi henüz yapılandırılmadı.';
  }

  const formattedHistory = conversationHistory
    .map((msg) => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
    .join('\n');

  const systemPrompt = `You are a helpful e-commerce shopping assistant. Answer in the same language as the user's message. Use only the product facts provided in PRODUCT CONTEXT. Do not invent availability, price, specifications, reviews, or products.

Question category: ${category}

When the user asks a broad availability question (for example, "Do you have computers?"), explicitly name the matching products in PRODUCT CONTEXT. Keep the reply concise: one short sentence followed by up to three relevant products.

For [PRODUCT_INFO] or [PRODUCT_RECOMMENDATION], append [SHOW_PRODUCT_INFO] and then [PRODUCT_IDS]{"ids":["id1"]}[/PRODUCT_IDS] after your answer. Include only product IDs from PRODUCT CONTEXT. For product reviews or ratings, do not append these tags.

If the user asks a follow-up question, keep discussing the same product unless they explicitly ask about a different one.

PRODUCT CONTEXT:
${context}

CONVERSATION HISTORY:
${formattedHistory}`;

  try {
    const completion = await groq.chat.completions.create({
      model: MODEL_NAME,
      temperature: 0.3,
      max_tokens: 500,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    });
    return completion.choices[0]?.message?.content?.trim() || 'Üzgünüm, yanıt oluşturamadım.';
  } catch (error) {
    console.error('Groq response error:', error.message);
    return 'Üzgünüm, şu anda yanıt oluşturamıyorum. Lütfen biraz sonra tekrar deneyin.';
  }
};

module.exports = {
  generateResponse,
};
