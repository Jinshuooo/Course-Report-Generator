#!/usr/bin/env node
/**
 * Supabase 保活脚本（本地验证用）
 *
 * 用法：npm run keepalive
 * 会读取 .env.local 中的 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY，
 * 向 Supabase REST API 发起一次真实的数据库查询。
 */

const baseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const anonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!baseUrl || !anonKey) {
  console.error('缺少 SUPABASE_URL 或 SUPABASE_ANON_KEY，请检查 .env.local');
  process.exit(1);
}

const endpoint = `${baseUrl}/rest/v1/user_settings?select=id&limit=1`;

try {
  const res = await fetch(endpoint, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(30_000),
  });

  const body = await res.text();
  console.log(`HTTP ${res.status} ${res.statusText}`);
  console.log(body.slice(0, 500));

  if (!res.ok) {
    console.error('保活失败：请确认 Supabase 项目未被暂停，且密钥正确。');
    process.exit(1);
  }

  console.log('Supabase 项目活跃，保活成功。');
} catch (err) {
  console.error('请求失败（可能是本地网络无法直连 Supabase）：', err instanceof Error ? err.message : err);
  process.exit(1);
}
