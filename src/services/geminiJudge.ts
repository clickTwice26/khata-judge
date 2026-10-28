import { EvaluationRequest, EvaluationResult, ParameterVerdict, StrictnessLevel, AnswerImage } from '../types';

export interface GeminiModelInfo {
  id: string;
  displayName: string;
  description: string;
  supportedGenerationMethods: string[];
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  isRecommended?: boolean;
}

export const QUALITY_OPTIONS = [
  { id: 'gemini-2.5-flash', label: 'Fast', description: 'Quick, sharp checking (Recommended)', default: true },
  { id: 'gemini-2.5-pro', label: 'Best', description: 'Deep, comprehensive evaluation' },
];

export const AVAILABLE_MODELS = [
  { id: 'gemini-2.5-flash', name: 'Fast (Gemini 2.5 Flash)', default: true },
  { id: 'gemini-2.5-pro', name: 'Best (Gemini 2.5 Pro)' },
  { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash' },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
];

function getModelSortScore(id: string): number {
  if (id === 'gemini-2.5-flash') return 100;
  if (id === 'gemini-2.5-pro') return 95;
  if (id.includes('2.5-flash')) return 90;
  if (id.includes('2.5-pro')) return 85;
  if (id === 'gemini-2.0-flash') return 80;
  if (id.includes('2.0-flash')) return 78;
  if (id.includes('2.0-pro')) return 75;
  if (id === 'gemini-1.5-flash') return 70;
  if (id === 'gemini-1.5-pro') return 65;
  if (id.includes('1.5-flash')) return 60;
  if (id.includes('exp')) return 40;
  return 10;
}

/**
 * Dynamically queries the Google Gemini API to fetch all active models
 * available for the provided user API key that support generateContent.
 */
export async function fetchAvailableGeminiModels(apiKey: string): Promise<GeminiModelInfo[]> {
  if (!apiKey || !apiKey.trim()) {
    return [];
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey.trim())}`;

  let response: Response;
  try {
    response = await fetch(url);
  } catch (err: unknown) {
    console.error('Network error fetching model list:', err);
    throw new Error(mapToFriendlyError(err));
  }

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    console.error('Failed to query models from Gemini API:', response.status, errorJson);
    const errText = errorJson?.error?.message || response.statusText;
    throw new Error(mapToFriendlyError(new Error(`${response.status}: ${errText}`)));
  }

  const data = await response.json().catch(() => ({}));
  const rawList: any[] = Array.isArray(data?.models) ? data.models : [];

  // Filter only models that support generateContent for question checking
  const eligible = rawList.filter(
    (m) => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent')
  );

  const formatted: GeminiModelInfo[] = eligible.map((m) => {
    const rawId = m.name?.startsWith('models/') ? m.name.substring(7) : (m.name || '');
    const isRec = rawId.includes('2.5-flash') || rawId === 'gemini-2.5-flash';
    return {
      id: rawId,
      displayName: m.displayName || rawId,
      description: m.description || '',
      supportedGenerationMethods: m.supportedGenerationMethods || [],
      inputTokenLimit: m.inputTokenLimit,
      outputTokenLimit: m.outputTokenLimit,
      isRecommended: isRec,
    };
  });

  formatted.sort((a, b) => {
    const scoreA = getModelSortScore(a.id);
    const scoreB = getModelSortScore(b.id);
    return scoreB - scoreA;
  });

  return formatted;
}

/**
 * Performs high-precision handwriting and document OCR across one or more
 * uploaded answer sheet images using Gemini's state-of-the-art vision model.
 */
export async function performOcrOnImages(
  images: AnswerImage[],
  apiKey: string,
  preferredModel: string = 'gemini-2.5-flash',
  onProgress?: (current: number, total: number) => void
): Promise<string> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('Your Google AI key is not working. Please check it in Settings.');
  }

  if (!images || images.length === 0) {
    throw new Error('Please select at least one image of your answer sheet.');
  }

  // Use Gemini 2.5 Flash for multimodal vision and handwriting OCR
  const ocrModel = preferredModel.includes('pro') ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${ocrModel}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

  const pageTranscriptions: string[] = [];

  for (let idx = 0; idx < images.length; idx++) {
    if (onProgress) {
      onProgress(idx + 1, images.length);
    }
    const img = images[idx];
    const pagePrompt = `You are a specialized handwriting and document transcription OCR system for university and school exam answer sheets.
Accurately transcribe all handwritten and printed text from this page verbatim:
1. Decipher handwriting, cursive notes, equations, diagrams, and labels with high fidelity.
2. Maintain the student's exact wording, paragraph structure, headings, and numbered points.
3. Transcribe mathematical formulas, symbols, and steps clearly.
4. Do NOT summarize, correct spelling mistakes, or omit any content. Output ONLY the raw transcribed text.`;

    const requestBody = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: pagePrompt },
            {
              inlineData: {
                mimeType: img.mimeType,
                data: img.base64,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
      },
    };

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
    } catch (err) {
      console.error('OCR network failure on page:', idx + 1, err);
      throw new Error(mapToFriendlyError(err));
    }

    if (!response.ok) {
      const errorJson = await response.json().catch(() => ({}));
      console.error('OCR error response on page:', idx + 1, response.status, errorJson);
      const errText = errorJson?.error?.message || response.statusText;
      throw new Error(mapToFriendlyError(new Error(`${response.status}: ${errText}`)));
    }

    const data = await response.json().catch(() => ({}));
    const rawText = extractTextFromGeminiResponse(data);
    pageTranscriptions.push(rawText.trim());
  }

  if (pageTranscriptions.length === 1) {
    return pageTranscriptions[0];
  }

  return pageTranscriptions
    .map((text, i) => `--- Page ${i + 1} (${images[i].name}) ---\n${text}`)
    .join('\n\n');
}

/**
 * Safely extracts the model's generated text from a Gemini response payload,
 * correctly filtering out internal chain-of-thought parts (e.g. part.thought === true)
 * generated by reasoning models like Gemini 2.5 Flash and Gemini 2.5 Pro.
 */
export function extractTextFromGeminiResponse(data: any): string {
  const candidate = data?.candidates?.[0];
  if (!candidate) {
    return '';
  }

  const parts = candidate?.content?.parts;
  if (!Array.isArray(parts) || parts.length === 0) {
    return '';
  }

  // Filter out thinking / reasoning parts (where part.thought === true)
  const nonThoughtParts = parts.filter((p: any) => !p.thought);
  if (nonThoughtParts.length > 0) {
    return nonThoughtParts.map((p: any) => p.text || '').join('').trim();
  }

  // Fallback: if all parts were thought or none were marked, return the last part's text
  return parts[parts.length - 1]?.text?.trim() || '';
}

/**
 * Robustly parses JSON from raw model text, automatically stripping markdown code blocks
 * (```json ... ```) or extracting the JSON object boundary if surrounded by other prose.
 */
export function extractJsonFromText(rawText: string): any {
  if (!rawText || !rawText.trim()) return null;

  const trimmed = rawText.trim();

  // 1. Direct JSON parse
  try {
    return JSON.parse(trimmed);
  } catch {}

  // 2. Strip ```json ... ``` code fences
  let cleaned = trimmed;
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    try {
      return JSON.parse(cleaned);
    } catch {}
  }

  // 3. Substring between first '{' and last '}'
  const startIdx = cleaned.indexOf('{');
  const endIdx = cleaned.lastIndexOf('}');
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const objectSlice = cleaned.substring(startIdx, endIdx + 1);
    try {
      return JSON.parse(objectSlice);
    } catch {}
  }

  return null;
}

export function mapToFriendlyError(err: unknown): string {
  console.error('Gemini error encountered:', err);
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'You seem to be offline. Please check your connection.';
  }
  const message = (err instanceof Error ? err.message : String(err)).toLowerCase();

  if (
    message.includes('api_key') ||
    message.includes('api key') ||
    message.includes('key not valid') ||
    message.includes('unauthenticated') ||
    message.includes('401') ||
    message.includes('403') ||
    message.includes('permission_denied')
  ) {
    return 'Your Google AI key is not working. Please check it in Settings.';
  }

  if (
    message.includes('429') ||
    message.includes('resource_exhausted') ||
    message.includes('quota') ||
    message.includes('rate limit')
  ) {
    return "You have reached today's free limit. Please try again later.";
  }

  if (
    message.includes('500') ||
    message.includes('503') ||
    message.includes('overloaded') ||
    message.includes('unavailable') ||
    message.includes('internal')
  ) {
    return 'The AI service is temporarily busy. Please wait a moment and try again.';
  }

  if (
    message.includes('failed to fetch') ||
    message.includes('network') ||
    message.includes('offline')
  ) {
    return 'You seem to be offline. Please check your connection.';
  }

  if (message.includes('safety') || message.includes('blocked')) {
    return 'The question or answer could not be checked due to content filters.';
  }

  // If error message already has clean descriptive text, preserve it
  if (err instanceof Error && err.message && !err.message.includes('[object') && !err.message.includes('HTTP')) {
    return err.message;
  }

  return 'Could not evaluate the answer right now. Please try again.';
}

const getStrictnessInstruction = (level: StrictnessLevel): string => {
  switch (level) {
    case 'lenient':
      return `STRICTNESS: LENIENT. Award generous marks if the student captures the general intuition or core essence, even if minor nuances, specific formulas, or formal vocabulary are incomplete. Minimize point deductions for presentation quirks.`;
    case 'strict':
      return `STRICTNESS: STRICT ACADEMIC RIGOR. Grade like a demanding academic examiner. Deduct marks for omitted technical nuances, vague hand-waving, lacking formal definitions, missing edge conditions, or loose argumentation. Do not give full marks unless the response is thorough and precise.`;
    case 'standard':
    default:
      return `STRICTNESS: STANDARD / BALANCED. Evaluate objectively based on merit. Award full marks when core concepts are accurately articulated and supported. Deduct proportional marks only for actual factual errors, clear omissions, or significant conceptual gaps.`;
  }
};

export async function testGeminiApiKey(apiKey: string, model: string = 'gemini-2.5-flash'): Promise<{ success: boolean; message: string }> {
  if (!apiKey || apiKey.trim() === '') {
    return { success: false, message: 'Please enter a Google AI key.' };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: 'Respond with the word "VALID" only.' }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 150,
          temperature: 0.1,
        },
      }),
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      console.error('API key test error response:', errJson);
      return { success: false, message: 'Your Google AI key is not working. Please check it in Settings.' };
    }

    return { success: true, message: 'Key connected successfully!' };
  } catch (err: unknown) {
    console.error('API key test exception:', err);
    return { success: false, message: mapToFriendlyError(err) };
  }
}

export async function evaluateAnswerWithGemini(req: EvaluationRequest): Promise<EvaluationResult> {
  const { question, modelAnswer, studentAnswer, totalMarks, parameters, strictness, additionalInstructions, model, apiKey, images } = req;

  if (!apiKey || apiKey.trim() === '') {
    throw new Error('Your Google AI key is not working. Please check it in Settings.');
  }

  const hasImages = Array.isArray(images) && images.length > 0;
  if (!studentAnswer?.trim() && !hasImages) {
    throw new Error('Please type, paste or upload an answer before checking.');
  }

  if (!parameters || parameters.length === 0) {
    throw new Error('At least one marking point is required.');
  }

  // Construct parameter descriptions for the prompt
  const parametersDescription = parameters
    .map((p, idx) => `[Point ${idx + 1}] ID: "${p.id}", What is checked: "${p.name}", Marks Allocated: ${p.weight}. Criteria: ${p.description}`)
    .join('\n');

  const imageNote = hasImages
    ? `\n--- ATTACHED ANSWER SHEET IMAGES ---\nThe student has provided ${images.length} handwritten or printed answer sheet image(s) attached below. Carefully read all handwriting, mathematical equations, diagrams, and formatting in the images to evaluate their answer.`
    : '';

  const prompt = `You are "Khata Judge", a calm, supportive, and precise academic examiner evaluating a student's answer.
Your goal is to provide constructive, honest scoring, show where marks were earned or lost, and write a perfected full-mark version of the student's own answer that they can study.

--- QUESTION ---
${question}

${modelAnswer ? `--- TEACHER'S REFERENCE ANSWER / KEY POINTS ---\n${modelAnswer}\n` : ''}

--- STUDENT'S WRITTEN ANSWER ---
${studentAnswer || '(Refer to the attached answer sheet images below)'}
${imageNote}

--- EVALUATION SPECIFICATIONS ---
Total Marks: ${totalMarks}
${getStrictnessInstruction(strictness)}

${additionalInstructions ? `Special Instructions: ${additionalInstructions}\n` : ''}

--- HOW MARKS ARE GIVEN ---
Evaluate each of the following points individually:
${parametersDescription}

--- SCORING & OUTPUT GUIDELINES ---
1. For each point:
   - Assign "marksAwarded" (between 0.0 and maxMarks).
   - "strengths": 1 to 2 clear, simple sentences highlighting what the student did well.
   - "flaws": 1 to 2 clear, simple sentences highlighting what was missing or lost marks.
   - "recommendation": 1 plain, actionable sentence on how to get full marks on this point.
2. "verdictSummary": A short, plain-language verdict (e.g. "Good answer, but missing key examples"). Keep it under 2 sentences.
3. "gradeBand": One of ["Excellent", "Good", "Needs work"].
   - >= 80%: "Excellent"
   - 60% - 79%: "Good"
   - < 60%: "Needs work"
4. "fullMarkAnswer": This is the single most important study aid.
   - Write a complete, corrected, full-mark version of the student's OWN answer.
   - Keep the student's original structure, phrasing, and strong points where they were correct.
   - Fix grammatical errors, replace vague statements with precise terminology, and insert the missing points needed to secure 100% marks.
   - The result must be a clean, ready-to-study answer written in natural student prose.
5. "tips": 3 to 5 short bullet points giving practical advice for next time (e.g. "Always start with the core definition", "Include at least one real-world diagram or example").
6. Provide "executiveCritique": A short, clear paragraph summarizing the overall quality.`;

  const contentParts: any[] = [{ text: prompt }];
  if (hasImages) {
    images.forEach((img) => {
      contentParts.push({
        inlineData: {
          mimeType: img.mimeType,
          data: img.base64,
        },
      });
    });
  }

  const requestBody = {
    contents: [
      {
        role: 'user',
        parts: contentParts,
      },
    ],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          totalAwarded: { type: 'NUMBER', description: 'Total sum of awarded marks across all points' },
          totalMarks: { type: 'NUMBER', description: 'Total marks possible' },
          percentage: { type: 'NUMBER', description: 'Percentage score 0 to 100' },
          letterGrade: { type: 'STRING', description: 'Letter grade e.g. A+, A, B, C, D, F' },
          gradeBand: { type: 'STRING', description: 'One of: Excellent, Good, Needs work' },
          verdictSummary: { type: 'STRING', description: 'Short plain-language verdict under 2 sentences' },
          executiveCritique: { type: 'STRING', description: 'Short critique paragraph' },
          fullMarkAnswer: { type: 'STRING', description: 'Complete perfected full-mark version of the student answer' },
          tips: {
            type: 'ARRAY',
            items: { type: 'STRING' },
            description: '3 to 5 actionable tips for next time',
          },
          parameters: {
            type: 'ARRAY',
            items: {
              type: 'OBJECT',
              properties: {
                parameterId: { type: 'STRING' },
                parameterName: { type: 'STRING' },
                marksAwarded: { type: 'NUMBER' },
                maxMarks: { type: 'NUMBER' },
                tier: {
                  type: 'STRING',
                  description: 'One of: Superior, Proficient, Competent, Developing, Deficient',
                },
                strengths: {
                  type: 'ARRAY',
                  items: { type: 'STRING' },
                },
                flaws: {
                  type: 'ARRAY',
                  items: { type: 'STRING' },
                },
                recommendation: { type: 'STRING' },
              },
              required: [
                'parameterId',
                'parameterName',
                'marksAwarded',
                'maxMarks',
                'strengths',
                'flaws',
                'recommendation',
              ],
            },
          },
        },
        required: [
          'totalAwarded',
          'totalMarks',
          'percentage',
          'letterGrade',
          'gradeBand',
          'verdictSummary',
          'executiveCritique',
          'fullMarkAnswer',
          'tips',
          'parameters',
        ],
      },
    },
  };

  const selectedModel = model || 'gemini-2.5-flash';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${encodeURIComponent(apiKey.trim())}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });
  } catch (netErr: unknown) {
    console.error('Network request failed:', netErr);
    throw new Error(mapToFriendlyError(netErr));
  }

  if (!response.ok) {
    const errorJson = await response.json().catch(() => ({}));
    console.error('Gemini API returned error status:', response.status, errorJson);
    const errText = errorJson?.error?.message || response.statusText;
    throw new Error(mapToFriendlyError(new Error(`${response.status}: ${errText}`)));
  }

  const data = await response.json().catch((err) => {
    console.error('Failed to parse Gemini response payload as JSON:', err);
    throw new Error('Could not read the answer evaluation from Google AI. Please try again.');
  });

  const candidate = data?.candidates?.[0];
  if (candidate?.finishReason === 'SAFETY') {
    throw new Error('This answer could not be evaluated due to Google AI safety filters.');
  }

  const rawText = extractTextFromGeminiResponse(data);

  if (!rawText) {
    console.error('Empty candidate parts from Gemini:', data);
    throw new Error('The AI model returned an empty response. Please try again.');
  }

  const parsed = extractJsonFromText(rawText);
  if (!parsed) {
    console.error('Failed to parse Gemini JSON output:', rawText);
    throw new Error('Could not process the evaluation format. Please try again.');
  }

  // Ensure parameter consistency with input parameters
  const parameterMap = new Map<string, ParameterVerdict>();
  if (Array.isArray(parsed.parameters)) {
    parsed.parameters.forEach((pv: any) => {
      parameterMap.set(pv.parameterId, pv);
    });
  }

  const finalParameters: ParameterVerdict[] = parameters.map((p) => {
    const found = parameterMap.get(p.id) || parsed.parameters?.find((item: any) => item.parameterName?.toLowerCase() === p.name.toLowerCase());
    if (found) {
      const awarded = Math.min(Math.max(0, Number(found.marksAwarded) || 0), p.weight);
      return {
        parameterId: p.id,
        parameterName: p.name,
        marksAwarded: Number(awarded.toFixed(1)),
        maxMarks: p.weight,
        percentage: Number(((awarded / (p.weight || 1)) * 100).toFixed(0)),
        tier: found.tier || (awarded / p.weight >= 0.8 ? 'Superior' : awarded / p.weight >= 0.6 ? 'Proficient' : 'Developing'),
        strengths: Array.isArray(found.strengths) && found.strengths.length > 0 ? found.strengths : ['Captured the key idea well.'],
        flaws: Array.isArray(found.flaws) && found.flaws.length > 0 ? found.flaws : ['Could include more specific detail or examples.'],
        recommendation: found.recommendation || 'Include clear definitions and a concrete example.',
      };
    }

    return {
      parameterId: p.id,
      parameterName: p.name,
      marksAwarded: Number((p.weight * 0.7).toFixed(1)),
      maxMarks: p.weight,
      percentage: 70,
      tier: 'Competent',
      strengths: ['Addressed the main requirement.'],
      flaws: ['Could be explained in greater depth.'],
      recommendation: 'Expand with clearer explanations and details.',
    };
  });

  const computedTotalAwarded = finalParameters.reduce((acc, curr) => acc + curr.marksAwarded, 0);
  const actualTotalAwarded = Number(computedTotalAwarded.toFixed(1));
  const actualPercentage = Math.round((actualTotalAwarded / (totalMarks || 1)) * 100);

  let finalGrade = parsed.letterGrade || 'B';
  if (actualPercentage >= 90) finalGrade = 'A+';
  else if (actualPercentage >= 80) finalGrade = 'A';
  else if (actualPercentage >= 70) finalGrade = 'B';
  else if (actualPercentage >= 60) finalGrade = 'C';
  else if (actualPercentage >= 50) finalGrade = 'D';
  else finalGrade = 'F';

  let calculatedBand: 'Excellent' | 'Good' | 'Needs work' = 'Good';
  if (actualPercentage >= 80) calculatedBand = 'Excellent';
  else if (actualPercentage < 60) calculatedBand = 'Needs work';

  const rawBand = typeof parsed.gradeBand === 'string' ? parsed.gradeBand.trim().toLowerCase() : '';
  let finalBand: 'Excellent' | 'Good' | 'Needs work' = calculatedBand;
  if (rawBand.includes('excel')) finalBand = 'Excellent';
  else if (rawBand.includes('need') || rawBand.includes('work') || rawBand.includes('poor')) finalBand = 'Needs work';
  else if (rawBand.includes('good')) finalBand = 'Good';

  const defaultTips = [
    'Start your answer with a direct 1-to-2 sentence definition.',
    'Use clear headings or bullet points to structure your points.',
    'Include at least one practical example or application to secure top marks.',
  ];

  const result: EvaluationResult = {
    id: `eval_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    question,
    studentAnswer,
    modelAnswer,
    totalMarks,
    totalAwarded: actualTotalAwarded,
    percentage: actualPercentage,
    letterGrade: finalGrade,
    gradeBand: finalBand,
    verdictSummary: parsed.verdictSummary || 'Good response with clear understanding of the core concept.',
    executiveCritique: parsed.executiveCritique || 'Your answer shows good foundational knowledge. Addressing the missing points will help you earn full marks.',
    parameters: finalParameters,
    keyStrengths: finalParameters.flatMap((p) => p.strengths).slice(0, 3),
    criticalDeficits: finalParameters.flatMap((p) => p.flaws).slice(0, 3),
    improvedAnswerSnippet: parsed.fullMarkAnswer || parsed.improvedAnswerSnippet || '',
    fullMarkAnswer: parsed.fullMarkAnswer || parsed.improvedAnswerSnippet || studentAnswer,
    tips: Array.isArray(parsed.tips) && parsed.tips.length > 0 ? parsed.tips : defaultTips,
    modelUsed: selectedModel,
    strictness,
  };

  return result;
}
