import React, { useState } from 'react';

interface CommandResponse {
  success: boolean;
  message: string;
  command?: string;
  timestamp?: string;
  error?: string;
}

const CursorCommandPage: React.FC = () => {
  const [command, setCommand] = useState('');
  const [response, setResponse] = useState<CommandResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!command.trim()) {
      setResponse({
        success: false,
        message: 'コマンドを入力してください'
      });
      return;
    }

    setLoading(true);
    setResponse(null);

    try {
      const result = await fetch('/api/cursor-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          command: command.trim()
        }),
      });

      const data: CommandResponse = await result.json();
      
      setResponse(data);
      
      // コマンド履歴に追加
      if (data.success) {
        setCommandHistory(prev => [command.trim(), ...prev.slice(0, 9)]); // 最新10件まで保持
      }
      
    } catch (error) {
      setResponse({
        success: false,
        message: 'ネットワークエラーが発生しました',
        error: error instanceof Error ? error.message : String(error)
      });
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryClick = (historyCommand: string) => {
    setCommand(historyCommand);
  };

  const clearHistory = () => {
    setCommandHistory([]);
  };

  return (
    <div style={{
      padding: '20px',
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ 
        color: '#333', 
        borderBottom: '2px solid #007bff', 
        paddingBottom: '10px',
        marginBottom: '30px'
      }}>
        🎯 バックエンド指示システム
      </h1>

      <div style={{
        backgroundColor: '#f8f9fa',
        padding: '20px',
        borderRadius: '8px',
        marginBottom: '20px',
        border: '1px solid #dee2e6'
      }}>
        <h3 style={{ marginTop: 0, color: '#495057' }}>🎯 バックエンド指示システム</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px', marginTop: '15px' }}>
          <div>
            <h4 style={{ color: '#007bff', margin: '0 0 8px 0' }}>🔧 システム操作</h4>
            <ul style={{ color: '#6c757d', lineHeight: '1.6', fontSize: '14px', margin: 0 }}>
              <li><code>status</code> - システムステータス確認</li>
              <li><code>restart</code> - システム再起動</li>
              <li><code>backup</code> - バックアップ実行</li>
              <li><code>backup list</code> - バックアップ一覧</li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: '#28a745', margin: '0 0 8px 0' }}>📊 データ操作</h4>
            <ul style={{ color: '#6c757d', lineHeight: '1.6', fontSize: '14px', margin: 0 }}>
              <li><code>data stats</code> - データ統計表示</li>
              <li><code>data clean</code> - データクリーンアップ</li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: '#ffc107', margin: '0 0 8px 0' }}>🛠️ 開発操作</h4>
            <ul style={{ color: '#6c757d', lineHeight: '1.6', fontSize: '14px', margin: 0 }}>
              <li><code>git status</code> - Git状態確認</li>
              <li><code>npm install</code> - 依存関係インストール</li>
              <li><code>build frontend</code> - フロントエンドビルド</li>
              <li><code>build backend</code> - バックエンドビルド</li>
            </ul>
          </div>
          <div>
            <h4 style={{ color: '#dc3545', margin: '0 0 8px 0' }}>🚀 デプロイ操作</h4>
            <ul style={{ color: '#6c757d', lineHeight: '1.6', fontSize: '14px', margin: 0 }}>
              <li><code>deploy production</code> - 本番デプロイ</li>
              <li><code>deploy staging</code> - ステージングデプロイ</li>
            </ul>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ marginBottom: '30px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '5px', 
            fontWeight: 'bold',
            color: '#333'
          }}>
            コマンド:
          </label>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="例: status, data stats, backup, git status"
            style={{
              width: '100%',
              padding: '12px',
              border: '2px solid #ced4da',
              borderRadius: '4px',
              fontSize: '16px',
              boxSizing: 'border-box'
            }}
            disabled={loading}
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading || !command.trim()}
          style={{
            backgroundColor: loading ? '#6c757d' : '#007bff',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {loading ? '実行中...' : '実行'}
        </button>

        <button 
          type="button"
          onClick={() => setCommand('')}
          style={{
            backgroundColor: '#6c757d',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          クリア
        </button>
      </form>

      {/* クイックコマンドボタン */}
      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ color: '#333', marginBottom: '15px' }}>⚡ クイックコマンド</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          {[
            { cmd: 'status', label: 'システム状態', color: '#007bff' },
            { cmd: 'data stats', label: 'データ統計', color: '#28a745' },
            { cmd: 'backup', label: 'バックアップ', color: '#ffc107' },
            { cmd: 'restart', label: '再起動', color: '#dc3545' },
            { cmd: 'git status', label: 'Git状態', color: '#6f42c1' },
            { cmd: 'build frontend', label: 'フロントビルド', color: '#20c997' },
            { cmd: 'build backend', label: 'バックビルド', color: '#fd7e14' },
            { cmd: 'deploy production', label: '本番デプロイ', color: '#e83e8c' }
          ].map(({ cmd, label, color }) => (
            <button
              key={cmd}
              type="button"
              onClick={() => setCommand(cmd)}
              style={{
                backgroundColor: color,
                color: 'white',
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'opacity 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.opacity = '0.8'}
              onMouseOut={(e) => e.currentTarget.style.opacity = '1'}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* コマンド履歴 */}
      {commandHistory.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '10px'
          }}>
            <h3 style={{ margin: 0, color: '#333' }}>コマンド履歴</h3>
            <button 
              onClick={clearHistory}
              style={{
                backgroundColor: '#dc3545',
                color: 'white',
                padding: '6px 12px',
                border: 'none',
                borderRadius: '4px',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              履歴をクリア
            </button>
          </div>
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #dee2e6'
          }}>
            {commandHistory.map((historyCommand, index) => (
              <div 
                key={index}
                onClick={() => handleHistoryClick(historyCommand)}
                style={{
                  padding: '8px',
                  margin: '4px 0',
                  backgroundColor: 'white',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontFamily: 'monospace'
                }}
              >
                {historyCommand}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* レスポンス表示 */}
      {response && (
        <div style={{
          padding: '20px',
          borderRadius: '8px',
          border: `2px solid ${response.success ? '#28a745' : '#dc3545'}`,
          backgroundColor: response.success ? '#d4edda' : '#f8d7da',
          color: response.success ? '#155724' : '#721c24'
        }}>
          <h3 style={{ 
            marginTop: 0, 
            color: response.success ? '#155724' : '#721c24',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            {response.success ? '✅ 実行成功' : '❌ 実行失敗'}
            {response.timestamp && (
              <span style={{ 
                fontSize: '14px', 
                fontWeight: 'normal',
                color: response.success ? '#6c757d' : '#6c757d'
              }}>
                {new Date(response.timestamp).toLocaleString('ja-JP')}
              </span>
            )}
          </h3>
          
          {response.command && (
            <div style={{ marginBottom: '15px' }}>
              <strong>実行コマンド:</strong> 
              <code style={{ 
                display: 'block', 
                marginTop: '5px',
                padding: '8px',
                backgroundColor: 'rgba(0,0,0,0.1)',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '14px'
              }}>
                {response.command}
              </code>
            </div>
          )}
          
          <div style={{ marginBottom: '10px' }}>
            <strong>結果:</strong>
            <pre style={{ 
              marginTop: '5px',
              padding: '10px',
              backgroundColor: 'rgba(0,0,0,0.05)',
              borderRadius: '4px',
              fontFamily: 'monospace',
              fontSize: '14px',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              border: '1px solid rgba(0,0,0,0.1)'
            }}>
              {response.message}
            </pre>
          </div>
          
          {response.error && (
            <div>
              <strong>エラー詳細:</strong> 
              <pre style={{ 
                marginTop: '5px',
                padding: '10px',
                backgroundColor: 'rgba(220,53,69,0.1)',
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '14px',
                color: '#dc3545',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                border: '1px solid rgba(220,53,69,0.2)'
              }}>
                {response.error}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CursorCommandPage;
