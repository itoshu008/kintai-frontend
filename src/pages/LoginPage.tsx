import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/attendance';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  // 開発環境でのみログ出力
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    console.log('🔵 LoginPage が読み込まれました');
  }
  const [employeeCode, setEmployeeCode] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [employeeList, setEmployeeList] = useState<any[]>([]);
  const navigate = useNavigate();
  const { login, isLoggedIn, user } = useAuth();

  // 既にログイン済みの場合はPersonalPageにリダイレクト
  useEffect(() => {
    if (isLoggedIn && user) {
      console.log('LoginPage: 既にログイン済み、PersonalPageにリダイレクト', user);
      navigate('/personal');
    }
  }, [isLoggedIn, user, navigate]);

  // 社員リストを定期的に更新
  const updateEmployeeList = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await api.master(today);
      if (res.list) {
        setEmployeeList(res.list);
        if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
          console.log('社員リスト更新:', res.list.length, '件');
        }
      }
    } catch (error) {
      console.error('社員リスト更新エラー:', error);
    }
  };

         // リアルタイム更新を有効化（useRealtimeフックを削除したため、手動で実装）
         useEffect(() => {
           // 初回読み込み
           updateEmployeeList();

           // 5秒間隔で更新（より即座に反映）
           const interval = setInterval(updateEmployeeList, 5000);

           // ウィンドウフォーカス時に更新
           const handleFocus = () => updateEmployeeList();
           window.addEventListener('focus', handleFocus);

           return () => {
             clearInterval(interval);
             window.removeEventListener('focus', handleFocus);
           };
         }, []);

  // 保存された情報を読み込み
  useEffect(() => {
    const savedCode = localStorage.getItem('employeeCode');
    const savedName = localStorage.getItem('employeeName');
    const savedRemember = localStorage.getItem('rememberMe') === 'true';
    
    if (savedCode && savedName && savedRemember) {
      setEmployeeCode(savedCode);
      setEmployeeName(savedName);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeCode.trim() || !employeeName.trim()) {
      setError('社員番号と名前を入力してください');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 開発環境でのみログ出力
      if (process.env.NODE_ENV === 'development') {
        console.log('LoginPage: ログイン処理開始');
      }
      
      // 今日のデータを取得して社員情報を確認
      const today = new Date().toISOString().slice(0, 10);
      if (process.env.NODE_ENV === 'development') {
        console.log('LoginPage: APIを呼び出し中...', `api.master(${today})`);
      }
      
      const res = await api.master(today);
      if (process.env.NODE_ENV === 'development') {
        console.log('LoginPage: API応答:', res);
        // デバッグ用：登録されている社員一覧を表示
        console.log('登録されている社員一覧:', res.list?.map(emp => ({ code: emp.code, name: emp.name })) || []);
        console.log('入力された情報:', { code: employeeCode.trim(), name: employeeName.trim() });
      }
      
      const employee = res.list?.find(emp => 
        emp.code === employeeCode.trim() && emp.name === employeeName.trim()
      );

      if (process.env.NODE_ENV === 'development') {
        console.log('LoginPage: 該当社員:', employee);
      }

      if (employee) {
        // 記憶機能の処理
        if (rememberMe) {
          localStorage.setItem('employeeCode', employeeCode.trim());
          localStorage.setItem('employeeName', employeeName.trim());
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('employeeCode');
          localStorage.removeItem('employeeName');
          localStorage.removeItem('rememberMe');
        }

        // AuthContextにログイン情報を保存（バックエンドセッション作成）
        const loginData = {
          code: employeeCode.trim(),
          name: employeeName.trim(),
          department: employee.dept || employee.department || '未設定'
        };
        
        console.log('LoginPage: バックエンドセッション作成開始', loginData);
        
        try {
          await login(loginData, rememberMe);
          console.log('LoginPage: バックエンドセッション作成完了、PersonalPageにリダイレクト');
          navigate('/personal');
        } catch (error) {
          console.error('LoginPage: セッション作成エラー:', error);
          setError('ログイン処理に失敗しました');
        }
      } else {
        setError('社員番号または名前が正しくありません');
        console.log('LoginPage: 社員が見つかりません');
      }
    } catch (err: any) {
      console.error('LoginPage: ログインエラー:', err);
      setError('ログインに失敗しました: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: window.innerWidth <= 768 ? '10px' : '20px',
      overflow: 'auto',
      WebkitOverflowScrolling: 'touch'
    }}>
      <div style={{
        background: 'white',
        borderRadius: window.innerWidth <= 768 ? '16px' : '20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        padding: window.innerWidth <= 768 ? '24px' : '40px',
        width: '100%',
        maxWidth: window.innerWidth <= 768 ? '100%' : '400px',
        animation: 'fadeInUp 0.6s ease-out'
      }}>
        {/* ヘッダー */}
        <div style={{
          textAlign: 'center',
          marginBottom: window.innerWidth <= 768 ? '24px' : '32px'
        }}>
          <div style={{
            fontSize: window.innerWidth <= 768 ? '12px' : '10px',
            marginBottom: '12px',
            background: '#d97706',
            color: 'white',
            padding: window.innerWidth <= 768 ? '4px 8px' : '2px 6px',
            borderRadius: '4px',
            fontWeight: '600',
            display: 'inline-block'
          }}>
            ログイン
          </div>
          <h1 style={{
            margin: 0,
            fontSize: window.innerWidth <= 768 ? '24px' : '28px',
            fontWeight: '700',
            color: '#374151',
            marginBottom: '8px',
            lineHeight: '1.2'
          }}>
            勤怠管理システム
          </h1>
          <p style={{
            margin: 0,
            fontSize: window.innerWidth <= 768 ? '14px' : '16px',
            color: '#6b7280',
            lineHeight: '1.4'
          }}>
            社員番号と名前でログインしてください
          </p>
        </div>

        {/* ログインフォーム */}
        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '24px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              📋 社員番号
            </label>
            <input
              type="text"
              value={employeeCode}
              onChange={(e) => setEmployeeCode(e.target.value)}
              placeholder="社員番号を入力"
              disabled={loading}
              style={{
                width: '100%',
                padding: window.innerWidth <= 768 ? '14px 16px' : '16px 20px',
                border: '2px solid #e5e7eb',
                borderRadius: window.innerWidth <= 768 ? '8px' : '12px',
                fontSize: '16px',
                background: loading ? '#f9fafb' : 'white',
                color: '#374151',
                fontWeight: '500',
                boxSizing: 'border-box',
                transition: 'all 0.3s ease',
                minHeight: '44px'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
              👤 氏名
            </label>
            <input
              type="text"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              placeholder="例: 山田太郎"
              disabled={loading}
              style={{
                width: '100%',
                padding: window.innerWidth <= 768 ? '14px 16px' : '16px 20px',
                border: '2px solid #e5e7eb',
                borderRadius: window.innerWidth <= 768 ? '8px' : '12px',
                fontSize: '16px',
                background: loading ? '#f9fafb' : 'white',
                color: '#374151',
                fontWeight: '500',
                boxSizing: 'border-box',
                transition: 'all 0.3s ease',
                minHeight: '44px'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* 記憶機能チェックボックス */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '24px'
          }}>
            <input
              type="checkbox"
              id="rememberMe"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={{
                width: '18px',
                height: '18px',
                cursor: 'pointer',
                accentColor: '#3b82f6'
              }}
            />
            <label
              htmlFor="rememberMe"
              style={{
                fontSize: '14px',
                color: '#374151',
                cursor: 'pointer',
                userSelect: 'none',
                fontWeight: '500'
              }}
            >
              💾 社員番号と名前を記憶する
            </label>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '24px',
              color: '#dc2626',
              fontSize: '14px',
              fontWeight: '500'
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* ログインボタン */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: window.innerWidth <= 768 ? '14px 20px' : '16px 24px',
              background: loading ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              color: 'white',
              border: 'none',
              borderRadius: window.innerWidth <= 768 ? '8px' : '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(59, 130, 246, 0.3)',
              opacity: loading ? 0.7 : 1,
              minHeight: '48px'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.4)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
              }
            }}
          >
            {loading ? (
              <>
                <span style={{ marginRight: '8px' }}>⏳</span>
                ログイン中...
              </>
            ) : (
              <>
                <span style={{ marginRight: '8px' }}>🚀</span>
                ログイン
              </>
            )}
          </button>
        </form>

        {/* フッター */}
        <div style={{
          textAlign: 'center',
          marginTop: '32px',
          paddingTop: '24px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <p style={{
            margin: 0,
            fontSize: '12px',
            color: '#9ca3af'
          }}>
            💼 勤怠管理システム v1.0
          </p>
          
          <div style={{ marginTop: '20px' }}>
            <button
              onClick={() => navigate('/admin-dashboard-2024')}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                margin: '0 5px'
              }}
            >
              管理者ダッシュボード
            </button>
            <button
              onClick={() => navigate('/cursor-command')}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                padding: '10px 20px',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
                margin: '0 5px'
              }}
            >
              🎯 バックエンド指示
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
