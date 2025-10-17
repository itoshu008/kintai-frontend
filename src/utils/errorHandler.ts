// src/utils/errorHandler.ts

// エラーメッセージの表示
export const handleError = (error: string | Error) => {
  const errorMessage = error instanceof Error ? error.message : error;
  console.error('Error occurred:', errorMessage);
  
  // 実際のアプリケーションでは、より良いUIコンポーネントを使用
  alert(`エラーが発生しました: ${errorMessage}`);
};

// HTMLレスポンスからエラーメッセージを抽出
export const extractErrorMessageFromHtml = (html: string): string => {
  try {
    // titleタグからエラーメッセージを抽出
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    if (titleMatch) {
      return titleMatch[1];
    }

    // h1タグからエラーメッセージを抽出
    const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (h1Match) {
      return h1Match[1];
    }

    // エラーメッセージを含む可能性のあるdivを検索
    const errorDivMatch = html.match(/<div[^>]*class="[^"]*error[^"]*"[^>]*>(.*?)<\/div>/i);
    if (errorDivMatch) {
      return errorDivMatch[1].replace(/<[^>]*>/g, '').trim();
    }

    // 一般的なエラーメッセージパターンを検索
    const errorPatterns = [
      /Error:\s*([^<\n]+)/i,
      /Exception:\s*([^<\n]+)/i,
      /Failed:\s*([^<\n]+)/i,
      /Cannot\s+([^<\n]+)/i
    ];

    for (const pattern of errorPatterns) {
      const match = html.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return 'Unknown error occurred';
  } catch (e) {
    console.error('Error extracting message from HTML:', e);
    return 'Failed to parse error message';
  }
};

// リトライ機能付きのデータ取得
export const fetchDataWithRetry = async (
  url: string, 
  options?: RequestInit, 
  retries: number = 3,
  delay: number = 1000
): Promise<any> => {
  let attempt = 0;

  while (attempt < retries) {
    try {
      const response = await fetch(url, {
        credentials: "include",
        headers: { "Content-Type": "application/json", ...(options?.headers || {}) },
        ...options,
      });

      const contentType = response.headers.get('content-type');

      // レスポンスがJSONでない場合はエラーを投げる
      if (!contentType || !contentType.includes('application/json')) {
        const errorText = await response.text();
        console.error('API returned HTML instead of JSON:', {
          url,
          status: response.status,
          contentType,
          responseText: errorText.slice(0, 200)
        });
        
        const errorMessage = extractErrorMessageFromHtml(errorText);
        throw new Error(`Invalid API response: ${errorMessage}`);
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      attempt++;
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (attempt === retries) {
        console.error('Max retries reached:', errorMessage);
        throw error; // 最大リトライ回数を超えた場合はエラーを投げる
      }
      
      console.log(`Retrying... attempt ${attempt}/${retries} for ${url}`);
      await new Promise(resolve => setTimeout(resolve, delay * attempt)); // 指数バックオフ
    }
  }
};

// HTMLエラーレスポンスの詳細取得
export const fetchHtmlError = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url, {
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    
    const html = await response.text();
    
    // HTML内にエラーメッセージが含まれている場合、抽出して表示する
    const errorMessage = extractErrorMessageFromHtml(html);
    console.error('Error from API:', errorMessage);
    
    return errorMessage;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Failed to fetch HTML error:', errorMessage);
    return errorMessage;
  }
};

// エラーレスポンスの型定義
export interface ErrorResponse {
  error: string;
  message?: string;
  status?: number;
  details?: any;
}

// 統一されたエラーハンドリング
export const handleApiError = (error: any, context?: string): ErrorResponse => {
  console.error(`API Error${context ? ` in ${context}` : ''}:`, error);
  
  if (error instanceof Error) {
    return {
      error: error.message,
      message: error.message,
    };
  }
  
  if (typeof error === 'string') {
    return {
      error,
      message: error,
    };
  }
  
  return {
    error: 'Unknown error occurred',
    message: 'An unexpected error occurred',
  };
};
