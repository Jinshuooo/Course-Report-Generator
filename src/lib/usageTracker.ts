import { supabase } from './supabase';

export interface UsageRecord {
  id: string;
  timestamp: number;
  prompt_tokens: number;
  completion_tokens: number;
}

const STORAGE_KEY = 'cs_api_usage_records';

export const addUsageRecord = async (
  promptTokens: number, 
  completionTokens: number,
  userId: string | undefined,
  isGuest: boolean
) => {
  // If guest or no user, store in local storage
  if (isGuest || !userId) {
    const records = getLocalUsageRecords();
    records.push({
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    return;
  }

  // If logged in, store in Supabase
  try {
    await supabase.from('user_api_usage').insert({
      user_id: userId,
      prompt_tokens: promptTokens,
      completion_tokens: completionTokens
    });
  } catch (err) {
    console.error('Failed to save usage record to cloud:', err);
  }
};

const getLocalUsageRecords = (): UsageRecord[] => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  }
  return [];
};

// DeepSeek Pricing (Approximate CNY per 1M tokens)
// Model: deepseek-chat
const INPUT_PRICE_PER_M = 1.0;
const OUTPUT_PRICE_PER_M = 2.0;

export const fetchStats = async (userId: string | undefined, isGuest: boolean) => {
  let records: UsageRecord[] = [];

  if (isGuest || !userId) {
    records = getLocalUsageRecords();
  } else {
    try {
      const { data } = await supabase
        .from('user_api_usage')
        .select('id, created_at, prompt_tokens, completion_tokens')
        .eq('user_id', userId);
      
      if (data) {
        records = data.map((row: any) => ({
          id: row.id,
          timestamp: new Date(row.created_at).getTime(),
          prompt_tokens: row.prompt_tokens,
          completion_tokens: row.completion_tokens
        }));
      }
    } catch (err) {
      console.error('Failed to fetch usage records from cloud:', err);
    }
  }
  
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const calc = (filteredRecords: UsageRecord[]) => {
    const prompt = filteredRecords.reduce((sum, r) => sum + r.prompt_tokens, 0);
    const completion = filteredRecords.reduce((sum, r) => sum + r.completion_tokens, 0);
    const cost = (prompt / 1000000) * INPUT_PRICE_PER_M + (completion / 1000000) * OUTPUT_PRICE_PER_M;
    return {
      promptTokens: prompt,
      completionTokens: completion,
      totalTokens: prompt + completion,
      estimatedCost: cost
    };
  };

  const todayRecords = records.filter(r => r.timestamp >= startOfDay);
  const monthRecords = records.filter(r => r.timestamp >= startOfMonth);

  return {
    today: calc(todayRecords),
    month: calc(monthRecords),
    total: calc(records)
  };
};

export const fetchDeepSeekBalance = async (apiKey: string) => {
  const response = await fetch('https://api.deepseek.com/user/balance', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    }
  });

  if (!response.ok) {
    throw new Error('获取余额失败');
  }

  const data = await response.json();
  if (data && data.balance_infos && data.balance_infos.length > 0) {
    // Return total_balance of the first currency (usually CNY)
    return data.balance_infos[0].total_balance;
  }
  return '0.00';
};
