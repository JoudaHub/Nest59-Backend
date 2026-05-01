const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;

const getClient = () => {
  if (!genAI) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }

    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }

  return genAI;
};

/**
 * Analyse a code snippet and return a markdown-formatted developer review.
 * @param {string} code        - The code snippet from the post
 * @param {string} description - Optional problem description
 * @param {string} language    - Declared language
 * @returns {Promise<string>}  - Markdown AI review
 */
const analyseCode = async (code, description = '', language = '') => {
  const model = getClient().getGenerativeModel({
    model: 'gemini-2.5-flash',
  });

  const langHint =
    language && language !== 'plaintext'
      ? `Language: ${language}\n`
      : '';

  const descHint = description
    ? `Problem description: ${description}\n`
    : '';

  const prompt = `You are a senior software engineer reviewing a code snippet posted by a developer asking for help.

${langHint}${descHint}
Code:
\`\`\`
${code}
\`\`\`

Provide a concise, helpful code review. Structure your response as:

**What I see:** One sentence summarising what the code does or is trying to do.

**Issue(s) found:** Bullet list of bugs, anti-patterns, or problems. Be specific.

**Suggested fix:** Show the corrected code snippet only if a fix is needed.

**Tips:** 1–2 brief best-practice tips relevant to this code.

Keep the total response under 300 words. Be direct and practical — no fluff.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Gemini API Error:', error);
    return 'AI review could not be generated at this time.';
  }
};

module.exports = { analyseCode };

