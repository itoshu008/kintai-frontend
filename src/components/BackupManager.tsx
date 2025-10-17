import React, { useState, useEffect } from 'react';
import { backupApi, BackupInfo, BackupData } from '../api/backup';

interface BackupManagerProps {
  onBackupRestore?: () => void;
}

export const BackupManager: React.FC<BackupManagerProps> = ({ onBackupRestore }) => {
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<BackupData | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [previewData, setPreviewData] = useState<BackupData | null>(null);

  // バックアップ一覧を取得
  const loadBackups = async () => {
    try {
      setLoading(true);
      const response = await backupApi.getBackups();
      if (response.ok) {
        setBackups(response.backups);
      } else {
        setMessage('バックアップ一覧の取得に失敗しました');
      }
    } catch (error) {
      setMessage('バックアップ一覧の取得中にエラーが発生しました');
      console.error('Load backups error:', error);
    } finally {
      setLoading(false);
    }
  };

  // バックアップ作成
  const createBackup = async () => {
    try {
      setLoading(true);
      setMessage('');
      const response = await backupApi.createBackup();
      if (response.ok) {
        setMessage(response.message);
        await loadBackups(); // 一覧を更新
      } else {
        setMessage('バックアップの作成に失敗しました');
      }
    } catch (error) {
      setMessage('バックアップ作成中にエラーが発生しました');
      console.error('Create backup error:', error);
    } finally {
      setLoading(false);
    }
  };

  // バックアップ詳細を取得
  const loadBackupDetail = async (backupId: string) => {
    try {
      setLoading(true);
      const response = await backupApi.getBackupDetail(backupId);
      if (response.ok) {
        setSelectedBackup(response.backup);
        setShowDetail(true);
      } else {
        setMessage('バックアップ詳細の取得に失敗しました');
      }
    } catch (error) {
      setMessage('バックアップ詳細取得中にエラーが発生しました');
      console.error('Load backup detail error:', error);
    } finally {
      setLoading(false);
    }
  };

  // バックアッププレビュー（見るだけモード）
  const previewBackup = async (backupId: string) => {
    try {
      setLoading(true);
      setMessage('');
      const response = await backupApi.getBackupPreview(backupId);
      if (response.ok) {
        setPreviewData(response.backup);
        setPreviewMode(true);
        setMessage(response.message);
      } else {
        setMessage('バックアッププレビューの取得に失敗しました');
      }
    } catch (error) {
      setMessage('バックアッププレビュー取得中にエラーが発生しました');
      console.error('Preview backup error:', error);
    } finally {
      setLoading(false);
    }
  };

  // プレビューモード終了
  const exitPreview = () => {
    setPreviewMode(false);
    setPreviewData(null);
    setMessage('');
  };

  // 古いバックアップをクリーンアップ
  const cleanupBackups = async () => {
    if (!confirm('古いバックアップを削除しますか？最新10個以外のバックアップが削除されます。')) {
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      const response = await backupApi.cleanupBackups(10);
      if (response.ok) {
        setMessage(`クリーンアップ完了: ${response.deletedCount}個の古いバックアップを削除、${response.remainingCount}個を保持`);
        await loadBackups(); // 一覧を更新
      } else {
        setMessage('クリーンアップに失敗しました');
      }
    } catch (error) {
      setMessage('クリーンアップ中にエラーが発生しました');
      console.error('Cleanup backups error:', error);
    } finally {
      setLoading(false);
    }
  };

  // バックアップから復元
  const restoreBackup = async (backupId: string) => {
    if (!confirm('このバックアップから復元しますか？現在のデータは上書きされます。')) {
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      const response = await backupApi.restoreBackup(backupId);
      if (response.ok) {
        setMessage(response.message);
        setShowDetail(false);
        setSelectedBackup(null);
        if (onBackupRestore) {
          onBackupRestore();
        }
      } else {
        setMessage('バックアップの復元に失敗しました');
      }
    } catch (error) {
      setMessage('バックアップ復元中にエラーが発生しました');
      console.error('Restore backup error:', error);
    } finally {
      setLoading(false);
    }
  };

  // バックアップ削除
  const deleteBackup = async (backupId: string) => {
    if (!confirm('このバックアップを削除しますか？この操作は元に戻せません。')) {
      return;
    }

    try {
      setLoading(true);
      setMessage('');
      const response = await backupApi.deleteBackup(backupId);
      if (response.ok) {
        setMessage(response.message);
        await loadBackups(); // 一覧を更新
      } else {
        setMessage('バックアップの削除に失敗しました');
      }
    } catch (error) {
      setMessage('バックアップ削除中にエラーが発生しました');
      console.error('Delete backup error:', error);
    } finally {
      setLoading(false);
    }
  };

  // コンポーネントマウント時にバックアップ一覧を読み込み
  useEffect(() => {
    loadBackups();
  }, []);

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('ja-JP');
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // プレビューモードの表示
  if (previewMode && previewData) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ 
          marginBottom: '20px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          background: '#fff3cd',
          padding: '15px',
          borderRadius: '8px',
          border: '1px solid #ffeaa7'
        }}>
          <div>
            <h2 style={{ margin: 0, color: '#856404' }}>🔍 プレビューモード</h2>
            <p style={{ margin: '5px 0 0 0', color: '#856404' }}>
              バックアップデータを表示中（データは復元されません）
            </p>
          </div>
          <button
            onClick={exitPreview}
            style={{
              padding: '8px 16px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            ✕ プレビュー終了
          </button>
        </div>

        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3>バックアップ情報</h3>
          <p><strong>ID:</strong> {previewData.id}</p>
          <p><strong>作成日時:</strong> {formatDate(previewData.timestamp)}</p>
          <p><strong>社員数:</strong> {previewData.employees.length}人</p>
          <p><strong>部署数:</strong> {previewData.departments.length}部署</p>
          <p><strong>勤怠記録数:</strong> {Object.keys(previewData.attendance).length}件</p>
          <p><strong>備考数:</strong> {Object.keys(previewData.remarks).length}件</p>
        </div>

        <div style={{ background: '#e8f5e8', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#155724' }}>📊 プレビューデータ</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            <div>
              <h5>社員一覧</h5>
              <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'white', padding: '10px', borderRadius: '4px' }}>
                {previewData.employees.map((emp: any, index: number) => (
                  <div key={index} style={{ padding: '5px 0', borderBottom: '1px solid #eee' }}>
                    {emp.name} ({emp.code})
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h5>部署一覧</h5>
              <div style={{ maxHeight: '200px', overflowY: 'auto', background: 'white', padding: '10px', borderRadius: '4px' }}>
                {previewData.departments.map((dept: any, index: number) => (
                  <div key={index} style={{ padding: '5px 0', borderBottom: '1px solid #eee' }}>
                    {dept.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', padding: '20px' }}>
          <button
            onClick={exitPreview}
            style={{
              padding: '12px 24px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            🔄 リアルタイム表示に戻る
          </button>
        </div>
      </div>
    );
  }

  if (showDetail && selectedBackup) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>バックアップ詳細</h2>
          <button
            onClick={() => {
              setShowDetail(false);
              setSelectedBackup(null);
            }}
            style={{
              padding: '8px 16px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            一覧に戻る
          </button>
        </div>

        <div style={{ background: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3>バックアップ情報</h3>
          <p><strong>ID:</strong> {selectedBackup.id}</p>
          <p><strong>作成日時:</strong> {formatDate(selectedBackup.timestamp)}</p>
          <p><strong>社員数:</strong> {selectedBackup.employees.length}人</p>
          <p><strong>部署数:</strong> {selectedBackup.departments.length}部署</p>
          <p><strong>勤怠記録数:</strong> {Object.keys(selectedBackup.attendance).length}件</p>
          <p><strong>備考数:</strong> {Object.keys(selectedBackup.remarks).length}件</p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => restoreBackup(selectedBackup.id)}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? '復元中...' : 'このバックアップから復元'}
          </button>
          <button
            onClick={() => deleteBackup(selectedBackup.id)}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? '削除中...' : 'このバックアップを削除'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <h2>バックアップ管理</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={cleanupBackups}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              opacity: loading ? 0.6 : 1
            }}
            title="古いバックアップを削除（最新10個を保持）"
          >
            🗑️ 古いバックアップを削除
          </button>
          <button
            onClick={createBackup}
            disabled={loading}
            style={{
              padding: '10px 20px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1
            }}
          >
            {loading ? '作成中...' : '新しいバックアップを作成'}
          </button>
        </div>
      </div>

      {message && (
        <div style={{
          padding: '10px',
          marginBottom: '20px',
          background: message.includes('成功') || message.includes('作成') ? '#d4edda' : '#f8d7da',
          color: message.includes('成功') || message.includes('作成') ? '#155724' : '#721c24',
          border: `1px solid ${message.includes('成功') || message.includes('作成') ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '4px'
        }}>
          {message}
        </div>
      )}

      {loading && !showDetail && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ fontSize: '18px', color: '#666' }}>読み込み中...</div>
        </div>
      )}

      {!loading && backups.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          <div style={{ fontSize: '18px', marginBottom: '10px' }}>📁</div>
          <div>バックアップがありません</div>
          <div style={{ fontSize: '14px', marginTop: '5px' }}>「新しいバックアップを作成」ボタンでバックアップを作成できます</div>
        </div>
      )}

      {!loading && backups.length > 0 && (
        <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>作成日時</th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #dee2e6' }}>ID</th>
                <th style={{ padding: '12px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>サイズ</th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '1px solid #dee2e6' }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((backup) => (
                <tr key={backup.id} style={{ borderBottom: '1px solid #f1f3f4' }}>
                  <td style={{ padding: '12px' }}>{formatDate(backup.timestamp)}</td>
                  <td style={{ padding: '12px', fontFamily: 'monospace', fontSize: '12px' }}>{backup.id}</td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>{formatSize(backup.size)}</td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => previewBackup(backup.id)}
                        style={{
                          padding: '6px 12px',
                          background: '#6f42c1',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                        title="プレビュー（見るだけ）"
                      >
                        🔍 プレビュー
                      </button>
                      <button
                        onClick={() => loadBackupDetail(backup.id)}
                        style={{
                          padding: '6px 12px',
                          background: '#17a2b8',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px'
                        }}
                        title="詳細情報を表示"
                      >
                        詳細
                      </button>
                      <button
                        onClick={() => restoreBackup(backup.id)}
                        disabled={loading}
                        style={{
                          padding: '6px 12px',
                          background: '#28a745',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          opacity: loading ? 0.6 : 1
                        }}
                      >
                        復元
                      </button>
                      <button
                        onClick={() => deleteBackup(backup.id)}
                        disabled={loading}
                        style={{
                          padding: '6px 12px',
                          background: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: loading ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          opacity: loading ? 0.6 : 1
                        }}
                      >
                        削除
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
