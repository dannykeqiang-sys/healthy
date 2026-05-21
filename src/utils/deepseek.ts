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

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function streamChatWithContext(
  apiKey: string,
  systemPrompt: string,
  messages: ChatMessage[],
  callbacks: StreamCallbacks,
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(DEEPSEEK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
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
    water_logs: WaterLogItem[];
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
    "exercises": [{ "name": "运动名称", "calories": 数字 }],
    "water_logs": [{ "raw_text": "液体简称", "amount": 含水量毫升整数 }]
  }
}

规则：
- 每种食物/饮品单独一个对象，calories 为纯整数
- 无数据的餐段返回空数组 []
- exercises 包含用户提及的所有运动，无运动则返回 []
- 时间线索（早上/中午/晚上/下午）决定归属餐段，无明确时间线索默认归入对应合理餐段
- water_logs：识别所有液体/含水饮品（水、茶、咖啡、牛奶、豆浆、果汁、奶茶、拿铁、汤、粥等），估算实际含水量ml；raw_text为该项简洁描述（≤10字），amount为纯整数ml；无液体则返回 []
- 含水率参考：纯水100%、茶98%、美式95%、豆浆95%、果汁88%、牛奶87%、拿铁83%、奶茶80%、汤90%、粥85%；无分量时按常见份量推断（一杯250ml、一碗300ml）`,
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

export interface SmartAdviceResult {
  has_data: boolean;
  next_action_trigger: 'next_meal' | 'tomorrow';
  today_review: string;
  predictive_advice: {
    title: string;
    energy_target: string;
    diet_strategy: string;
    exercise_suggestion: string;
  };
  health_tips: string;
}

export async function generateSmartAdvice(
  apiKey: string,
  todaySummary: string,
  historyContext: string,
  mode: 'next_meal' | 'tomorrow',
): Promise<SmartAdviceResult> {
  const timeStr = new Date().toLocaleString('zh-CN', { hour12: false });
  const isNextMeal = mode === 'next_meal';

  const systemPrompt = `你是温暖的 AI 健康伙伴"卡卡"。当前时间：${timeStr}。语气温柔治愈，绝不制造身材焦虑，不要说教。

严格返回如下 JSON 格式，所有字段都必须有值，不含任何额外文字：
{
  "has_data": true,
  "next_action_trigger": "${mode}",
  "today_review": "${isNextMeal ? '今日温柔小复盘（80字内，治愈语气，高情绪价值）' : '今日温柔复盘（100字内，治愈语气，关注趋势与情绪）'}",
  "predictive_advice": {
    "title": "${isNextMeal ? '下一餐轻负担锦囊' : '明日治愈锦囊'}",
    "energy_target": "${isNextMeal ? '本餐建议摄入热量范围（含具体数字）' : '明日建议摄入热量范围（含具体数字）'}",
    "diet_strategy": "${isNextMeal ? '具体的下一餐饮食建议（80字内，轻盈不负重）' : '具体的明日饮食建议（100字内，温柔可执行）'}",
    "exercise_suggestion": "${isNextMeal ? '饭后轻松小运动（50字内，零负担）' : '明日轻松可执行的运动建议（60字内）'}"
  },
  "health_tips": "${isNextMeal ? '今日暖心小贴士（60字内，温暖实用，与饮水或久坐相关）' : '明日健康小贴士（60字内，温暖实用）'}"
}`;

  const response = await fetch(DEEPSEEK_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `今日数据：\n${todaySummary}\n\n近期历史：\n${historyContext}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
  });
  if (!response.ok) throw new Error(`API 请求失败 (${response.status})`);
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content) as SmartAdviceResult;
}

export interface WaterLogItem {
  raw_text: string;
  amount: number;
}

export interface WaterContentResult {
  has_data: boolean;
  analysis_summary: string;
  data: {
    water_logs: WaterLogItem[];
  };
}

export async function parseWaterContent(
  apiKey: string,
  userInput: string,
): Promise<WaterContentResult> {
  const response = await fetch(DEEPSEEK_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: `你是一个含水量计算助手。用户会输入任意食物或饮料描述，可能包含多项。请根据含水率常识，计算每项的实际含水量（ml），拆分为独立条目。

含水率参考：纯水100%，茶/美式95~98%，豆浆95%，黄瓜96%，西瓜92%，草莓91%，冬瓜汤90~95%，鸡汤88~92%，牛奶87%，拿铁/奶茶80~88%，果汁85~90%，粥/稀饭85%，苹果86%，梨85%，香蕉75%。

规则：每项单独一个对象；raw_text为该项简洁描述（≤10字）；amount为实际含水量纯整数ml，最小50；无分量时按常见份量推断（一杯250ml，一碗300ml，一个水果200g）；analysis_summary为1句温暖小结（≤40字）。

严格返回JSON，不含额外文字：{"has_data":true,"analysis_summary":"...","data":{"water_logs":[{"raw_text":"...","amount":数字}]}}`,
        },
        { role: 'user', content: userInput },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    }),
  });
  if (!response.ok) throw new Error(`API 请求失败 (${response.status})`);
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content) as WaterContentResult;
}

export interface PredictiveAdvice {
  title: string;
  energy_target: string;
  diet_strategy: string;
  exercise_suggestion: string;
  health_tips?: string;
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
  mode: 'next_meal' | 'tomorrow',
): Promise<PredictiveAdviceResult> {
  const now = new Date();
  const timeStr = now.toLocaleString('zh-CN', { hour12: false });

  const systemPrompt = mode === 'next_meal'
    ? `你是温暖的 AI 健康伙伴"卡卡"。当前时间：${timeStr}。用户三餐尚未全部完成，请给出下一餐轻负担锦囊和健康小贴士。语气温柔，不制造焦虑。

严格返回如下 JSON 格式：
{
  "has_data": true,
  "today_review": "今日温柔小复盘（80字内，治愈语气）",
  "next_action_trigger": "next_meal",
  "predictive_advice": {
    "title": "下一餐轻负担锦囊",
    "energy_target": "本餐建议摄入热量范围描述",
    "diet_strategy": "具体的下一餐饮食建议（80字内，轻盈不负重）",
    "exercise_suggestion": "饭后轻松小运动（50字内）",
    "health_tips": "今日健康小贴士（60字内，温暖实用）"
  }
}`
    : `你是温暖的 AI 健康伙伴"卡卡"。当前时间：${timeStr}。用户三餐已完成或时间较晚，请给出明日治愈锦囊。语气温柔，不制造焦虑。

严格返回如下 JSON 格式：
{
  "has_data": true,
  "today_review": "今日温柔小复盘（100字内，治愈语气）",
  "next_action_trigger": "tomorrow",
  "predictive_advice": {
    "title": "明日治愈锦囊",
    "energy_target": "明日建议摄入热量范围描述",
    "diet_strategy": "具体的明日饮食建议（100字内）",
    "exercise_suggestion": "轻松可执行的运动建议（60字内）"
  }
}`;

  const response = await fetch(DEEPSEEK_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `今日数据：\n${todaySummary}\n\n近期历史：\n${historyContext}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    }),
  });
  if (!response.ok) throw new Error(`API 请求失败 (${response.status})`);
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content) as PredictiveAdviceResult;
}
