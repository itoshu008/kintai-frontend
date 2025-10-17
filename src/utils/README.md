# エラーハンドリング機能

このディレクトリには、APIエラーとHTMLレスポンスを適切に処理するためのユーティリティ関数が含まれています。

## 主な機能

### 1. 基本的なエラーハンドリング

```typescript
import { handleError } from '../utils/errorHandler';

// エラーメッセージを表示
handleError('Something went wrong');
handleError(new Error('Detailed error message'));
```

### 2. リトライ機能付きデータ取得

```typescript
import { fetchDataWithRetry } from '../utils/errorHandler';

// 3回までリトライ（デフォルト）
const data = await fetchDataWithRetry('/api/admin');

// カスタム設定
const data = await fetchDataWithRetry('/api/admin', {}, 5, 2000); // 5回、2秒間隔
```

### 3. HTMLエラーレスポンスの処理

```typescript
import { fetchHtmlError, extractErrorMessageFromHtml } from '../utils/errorHandler';

// HTMLレスポンスからエラーメッセージを抽出
const errorMessage = await fetchHtmlError('/api/admin');
console.log('Error:', errorMessage);

// HTML文字列から直接抽出
const html = '<html><title>404 Not Found</title></html>';
const message = extractErrorMessageFromHtml(html);
```

### 4. 統一されたエラーハンドリング

```typescript
import { handleApiError } from '../utils/errorHandler';

try {
  // API呼び出し
} catch (error) {
  const errorResponse = handleApiError(error, 'API call context');
  console.log(errorResponse.error);
  console.log(errorResponse.message);
}
```

## 使用例

### コンポーネントでの使用

```typescript
import React, { useEffect, useState } from 'react';
import { fetchDataWithRetry, handleError } from '../utils/errorHandler';

const MyComponent = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchDataWithRetry('/api/admin');
        setData(result);
      } catch (error) {
        handleError(error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>No data available</div>;

  return <div>{/* データを表示 */}</div>;
};
```

### エラーバウンダリーでの使用

```typescript
import ErrorBoundary from '../components/ErrorBoundary';

const App = () => {
  return (
    <ErrorBoundary>
      <MyComponent />
    </ErrorBoundary>
  );
};
```

## エラーメッセージの抽出パターン

`extractErrorMessageFromHtml`関数は以下のパターンからエラーメッセージを抽出します：

1. `<title>`タグの内容
2. `<h1>`タグの内容
3. `class="error"`を含むdivの内容
4. 一般的なエラーパターン（Error:, Exception:, Failed:, Cannot など）

## 設定可能なオプション

- **リトライ回数**: デフォルト3回
- **リトライ間隔**: デフォルト1秒（指数バックオフ）
- **エラーメッセージ**: カスタマイズ可能
- **ログレベル**: 詳細なデバッグ情報

## 注意事項

- HTMLレスポンスの解析は基本的なパターンマッチングを使用
- 複雑なHTML構造の場合は、エラーメッセージの抽出が不完全な場合があります
- 本番環境では、より適切なエラー表示UIコンポーネントの使用を推奨
