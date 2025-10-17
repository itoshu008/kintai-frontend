// src/lib/request.ts
import { extractErrorMessageFromHtml, handleApiError } from '../utils/errorHandler';

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL ?? '').replace(/\/$/, '');

const resolveRequestUrl = (input: string): string => {
  if (/^https?:\/\//i.test(input)) {
    return input;
  }

  if (API_BASE_URL) {
    const normalizedPath = input.startsWith('/') ? input : `/${input}`;
    return `${API_BASE_URL}${normalizedPath}`;
  }

  return input;
};

export async function request(input: string, init?: RequestInit) {
  try {
    const url = resolveRequestUrl(input);
    console.log(`[API REQUEST] ${init?.method || 'GET'} ${url}`);

    const res = await fetch(url, {
      credentials: "include", // セッション管理のために有効化
      headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
      ...init,
    });

    console.log(`[API RESPONSE] ${res.status} ${res.statusText || '(no status text)'} for ${url}`);

    const contentType = res.headers.get('content-type');
    console.log(`[API CONTENT TYPE] ${contentType} for ${url}`);

    const text = await res.text();

    // ステータスコードをチェック
    if (!res.ok) {
      let errorMessage = res.statusText || 'Unknown error';

      if (contentType?.includes('application/json')) {
        try {
          const errorJson = text ? JSON.parse(text) : {};
          errorMessage = errorJson.error || errorJson.message || errorMessage;
        } catch (parseError) {
          console.error('[API ERROR JSON PARSE FAILED]', {
            url,
            status: res.status,
            contentType,
            responseText: text.slice(0, 200),
            parseError,
          });
        }
      } else if (text) {
        errorMessage = extractErrorMessageFromHtml(text) || errorMessage;
      }

      console.error('[API HTTP ERROR]', {
        url,
        status: res.status,
        statusText: res.statusText,
        contentType,
        responseText: text.slice(0, 200),
        errorMessage,
      });

      throw new Error(`HTTP ${res.status}: ${errorMessage}`);
    }

    // Content-TypeをチェックしてJSONレスポンスを検証
    if (!contentType || !contentType.includes('application/json')) {
      console.error('[API CONTENT TYPE ERROR]', {
        url,
        status: res.status,
        contentType,
        responseText: text.slice(0, 200)
      });
      
      // HTMLレスポンスからエラーメッセージを抽出
      const extractedError = extractErrorMessageFromHtml(text);
      throw new Error(`Invalid API response: ${extractedError}`);
    }

    // 空のレスポンスの場合はnullを返す
    if (!text.trim()) {
      return null;
    }
    
    // レスポンスを先にパースしてからエラーチェック
    let jsonResponse;
    try {
      jsonResponse = JSON.parse(text);
    } catch (parseError) {
      console.error('[API PARSE ERROR]', {
        url,
        status: res.status,
        contentType,
        responseText: text.slice(0, 200),
        parseError
      });
      throw new Error(`Invalid JSON response from ${url}: ${text.slice(0, 100)}...`);
    }

    // okフィールドでエラーを判定（すべて200を返すため）
    if (jsonResponse && jsonResponse.ok === false) {
      console.error("[API ERROR]", {
        url,
        status: res.status,
        statusText: res.statusText,
        body: init?.body,
        responseText: text,
        error: jsonResponse.error
      });
      throw new Error(jsonResponse.error || `API Error: ${res.status} ${res.statusText || ''} for ${url}`);
    }
    
    return jsonResponse;
  } catch (error) {
    const errorResponse = handleApiError(error, `request to ${input}`);
    console.error('[REQUEST ERROR]', {
      url: resolveRequestUrl(input),
      method: init?.method || 'GET',
      error: errorResponse.error,
      message: errorResponse.message
    });
    throw error;
  }
}

// 汎用的なデータ取得関数（Content-Typeチェック付き）
export const fetchData = async (url: string, options?: RequestInit) => {
  try {
    const resolvedUrl = resolveRequestUrl(url);
    const response = await fetch(resolvedUrl, {
      credentials: "include",
      headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
      ...options,
    });

    const contentType = response.headers.get('content-type');

    // レスポンスがJSONでない場合はエラーを投げる
    if (!contentType || !contentType.includes('application/json')) {
      const errorText = await response.text();
      console.error('API returned HTML instead of JSON:', {
        url: resolvedUrl,
        status: response.status,
        contentType,
        responseText: errorText.slice(0, 200)
      });
      
      // HTMLレスポンスからエラーメッセージを抽出
      const extractedError = extractErrorMessageFromHtml(errorText);
      throw new Error(`Invalid API response: ${extractedError}`);
    }

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;

  } catch (error) {
    // エラーを処理する
    const errorResponse = handleApiError(error, `fetchData from ${url}`);
    console.error('Failed to fetch data:', {
      url: resolveRequestUrl(url),
      error: errorResponse.error,
      message: errorResponse.message
    });
    // 必要に応じてUIにエラーメッセージを表示
    return { error: errorResponse.error || 'Failed to load data' };
  }
};

// エラーハンドリング機能をエクスポート
export { 
  handleError, 
  fetchDataWithRetry, 
  fetchHtmlError, 
  extractErrorMessageFromHtml,
  handleApiError 
} from '../utils/errorHandler';
