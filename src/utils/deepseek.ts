const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';

export interface StreamCallbacks {
  onChunk: (text: string) => void;
  onDone: () => void;
  onError: (err: Error) => void;
}

export async function streamReview(
  apiKey: string,
  systemPrompt: string,
  userMessage: string,
  callbacks: StreamCallbacks,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(DEEPSEEK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        stream: true,
        temperature: 0.7,
      }),
    });
  } catch {
    callbacks.onError(new Error('网络请求失败，请检查网络连接'));
    return;
  }

  if (!response.ok) {
    callbacks.onError(new Error(`API 请求失败 (${response.status})，请检查 API Key 是否正确`));
    return;
  }

  const reader = response.body?.getReader();
  if (!reader) {
    callbacks.onError(new Error('无法读取响应流'));
    return;
  }

  const decoder = new TextDecoder();
  let buffer = '';
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed === 'data: [DONE]') continue;
        if (!trimmed.startsWith('data: ')) continue;
        try {
          const json = JSON.parse(trimmed.slice(6));
          const content = json.choices?.[0]?.delta?.content;
          if (content) callbacks.onChunk(content);
        } catch {
          // skip malformed chunks
        }
      }
    }
    callbacks.onDone();
  } catch (err) {
    callbacks.onError(err instanceof Error ? err : new Error(String(err)));
  } finally {
    reader.releaseLock();
  }
}

export interface CalorieEstimate {
  food_name: string;
  estimated_weight: string;
  calories: number;
  reason: string;
}

export async function estimateCalories(
  apiKey: string,
  foodDescription: string,
): Promise<CalorieEstimate> {
  const response = await fetch(DEEPSEEK_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content:
            '你是一个食物卡路里换算助手。请分析用户输入的食物描述（可能来自语音识别，包含错别字请自行纠正），根据常识估算其大致的卡路里。请严格返回 JSON 格式：{"food_name":"纠正后的标准食物名","estimated_weight":"估算重量","calories":数字,"reason":"温柔的估算理由"}，calories 字段为纯整数，不含单位。',
        },
        { role: 'user', content: foodDescription },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    }),
  });
  if (!response.ok) throw new Error(`API 请求失败 (${response.status})`);
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content) as CalorieEstimate;
}

export interface ParsedFoodItem {
  name: string;
  calories: number;
}

export interface ParsedExerciseItem {
  name: string;
  calories: number;
}

export interface MixedMealResult {
  has_data: boolean;
  analysis_summary: string;
  data: {
    breakfast: ParsedFoodItem[];
    lunch: ParsedFoodItem[];
    dinner: ParsedFoodItem[];
    snack: ParsedFoodItem[];
    exercises: ParsedExerciseItem[];
  };
}

export async function parseMixedMeals(
  apiKey: string,
  userInput: string,
): Promise<MixedMealResult> {
  const response = await fetch(DEEPSEEK_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `你是一个温暖的饮食记录助手。用户会用自然语言描述今天吃了什么，可能混合了多个餐段的内容，也可能包含运动信息。请认真分析并将每种食物/饮品拆分为独立条目，估算各自卡路里；运动同样拆分为独立条目。语气要温暖鼓励。

严格返回如下 JSON 格式，不含任何额外文字：
{
  "has_data": true,
  "analysis_summary": "温暖的一句话总结",
  "data": {
    "breakfast": [{ "name": "食物名称", "calories": 数字 }],
    "lunch": [{ "name": "食物名称", "calories": 数字 }],
    "dinner": [{ "name": "食物名称", "calories": 数字 }],
    "snack": [{ "name": "食物名称", "calories": 数字 }],
    "exercises": [{ "name": "运动名称", "calories": 数字 }]
  }
}

规则：
- 每种食物/饮品单独一个对象，calories 为纯整数
- 无数据的餐段返回空数组 []
- exercises 包含用户提及的所有运动，无运动则返回 []
- 时间线索（早上/中午/晚上/下午）决定归属餐段，无明确时间线索默认归入对应合理餐段`,
        },
        { role: 'user', content: userInput },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    }),
  });
  if (!response.ok) throw new Error(`API 请求失败 (${response.status})`);
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content) as MixedMealResult;
}

export interface PredictiveAdvice {
  title: string;
  energy_target: string;
  diet_strategy: string;
  exercise_suggestion: string;
}

export interface PredictiveAdviceResult {
  has_data: boolean;
  today_review: string;
  next_action_trigger: 'tomorrow' | 'next_meal';
  predictive_advice: PredictiveAdvice;
}

export async function generatePredictiveAdvice(
  apiKey: string,
  todaySummary: string,
  historyContext: string,
): Promise<PredictiveAdviceResult> {
  const hour = new Date().getHours();
  const timeHint = hour < 20 ? '用户当前时间在晚饭前或晚饭时，建议给出下一餐（next_meal）建议' : '用户当前时间较晚，建议给出翌日（tomorrow）建议';

  const response = await fetch(DEEPSEEK_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `你是温暖的 AI 健康伙伴"卡卡"。${timeHint}。
请基于今日数据与近期历史，给出前瞻性、治愈系的饮食运动建议。语气温柔，不制造焦虑。

严格返回如下 JSON 格式：
{
  "has_data": true,
  "today_review": "今日温柔小复盘（100字内，治愈语气）",
  "next_action_trigger": "tomorrow" 或 "next_meal",
  "predictive_advice": {
    "title": "明日治愈锦囊 或 下一餐锦囊",
    "energy_target": "建议摄入热量范围描述",
    "diet_strategy": "具体的饮食建议（100字内）",
    "exercise_suggestion": "轻松可执行的运动建议（60字内）"
  }
}`,
        },
        {
          role: 'user',
          content: `今日数据：\n${todaySummary}\n\n近期历史：\n${historyContext}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
  });
  if (!response.ok) throw new Error(`API 请求失败 (${response.status})`);
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content) as PredictiveAdviceResult;
}
