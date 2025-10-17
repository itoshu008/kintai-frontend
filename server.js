/**
 * フロントエンド用静的ファイルサーバー
 * React SPAアプリケーションの配信とヘルスチェック機能を提供
 */
import express from 'express';
import path from 'path';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';

const app = express();

// 環境変数から設定を取得
const PORT = Number(process.env.PORT) || 3001;
// サーバーを外部からも利用できるよう、デフォルトは 0.0.0.0 にする
const HOST = process.env.HOST || '0.0.0.0';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_PATH = path.join(__dirname, 'dist');

if (!existsSync(DIST_PATH)) {
  console.warn(`⚠️  Frontend dist directory not found at: ${DIST_PATH}`);
  console.warn('    Did you run "npm run build"?');
}

// 静的ファイル配信設定
app.use(
  express.static(DIST_PATH, {
    index: ['index.html'],
    dotfiles: 'ignore',
    etag: false,
    lastModified: false,
    maxAge: 0, // 開発環境ではキャッシュを無効化
  }),
);

// ヘルスチェックエンドポイント
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'frontend',
    timestamp: new Date().toISOString(),
    port: PORT,
    host: HOST,
    distPath: DIST_PATH,
    hasDist: existsSync(DIST_PATH),
    integrations: {
      github: false, // GitHub など外部サービスへデータ送信は行っていない
    },
  });
});

// SPAルーティング対応（すべてのルートをindex.htmlにフォールバック）
app.get('*', (_req, res, next) => {
  const indexFile = path.join(DIST_PATH, 'index.html');
  if (!existsSync(indexFile)) {
    return res.status(503).type('text/plain').send('Frontend build (index.html) is missing.');
  }

  res.sendFile(indexFile, (err) => {
    if (err) {
      next(err);
    }
  });
});

// サーバー起動
const server = app.listen(PORT, HOST, () => {
  console.log(`🌐 Frontend server running on http://${HOST}:${PORT}`);
  console.log(`📁 Serving static files from: ${DIST_PATH}`);
});

// グレースフルシャットダウン
const shutdown = (signal) => {
  console.log(`🛑 Received ${signal}. Shutting down frontend server...`);
  server.close(() => {
    console.log('✅ Frontend server closed');
    process.exit(0);
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// エラーハンドリング
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

export default app;

