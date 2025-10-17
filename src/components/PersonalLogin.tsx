import { useEffect, useState } from 'react';
import { api } from '../api/attendance';

interface PersonalLoginProps {
  onLoginSuccess: (employeeData: { code: string; name: string; department: string }) => void;
  onLoginError: (message: string) => void;
}

export default function PersonalLogin({ onLoginSuccess, onLoginError }: PersonalLoginProps) {
  const [employeeCode, setEmployeeCode] = useState('');
  const [employeeName, setEmployeeName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // 記憶モードの初期読み込み
  useEffect(() => {
    const savedRemember = localStorage.getItem('rememberMe') === 'true';
    const savedCode = localStorage.getItem('employeeCode') || '';
    const savedName = localStorage.getItem('employeeName') || '';
    if (savedRemember) {
      setRememberMe(true);
      if (savedCode) setEmployeeCode(savedCode);
      if (savedName) setEmployeeName(savedName);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeCode.trim() || !employeeName.trim()) {
      setError('社員番号と名前を入力してください');
      return;
    }

    // 社員番号と名前の組み合わせで認証を行う

    setLoading(true);
    setError('');

    try {
      if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
        console.log('PersonalLogin: ログイン処理開始', { employeeCode: employeeCode.trim(), employeeName: employeeName.trim() });
      }
      
      // 今日のデータを取得して社員情報を確認
      const today = new Date().toISOString().slice(0, 10);
      console.log('PersonalLogin: ログイン試行', { employeeCode: employeeCode.trim(), employeeName: employeeName.trim(), today });
      
      const res = await api.master(today);
      console.log('PersonalLogin: API応答:', res);
      console.log('PersonalLogin: 社員リスト:', res.list);
      
      const employee = res.list?.find((emp: any) => 
        emp.code === employeeCode.trim() && emp.name === employeeName.trim()
      );

      console.log('PersonalLogin: 該当社員:', employee);
      console.log('PersonalLogin: 検索条件:', { 
        searchCode: employeeCode.trim(), 
        searchName: employeeName.trim(),
        availableEmployees: res.list?.map(emp => ({ code: emp.code, name: emp.name }))
      });

      if (employee) {
        const employeeData = {
          code: employeeCode.trim(),
          name: employeeName.trim(),
          department: employee.dept || employee.department || '未設定'
        };
        
        // 記憶モード: 保存/削除
        if (rememberMe) {
          localStorage.setItem('employeeCode', employeeData.code);
          localStorage.setItem('employeeName', employeeData.name);
          localStorage.setItem('rememberMe', 'true');
        } else {
          localStorage.removeItem('employeeCode');
          localStorage.removeItem('employeeName');
          localStorage.setItem('rememberMe', 'false');
        }

        if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
          console.log('PersonalLogin: ログイン成功', employeeData);
        }
        onLoginSuccess(employeeData);
      } else {
        const errorMsg = '社員番号または名前が正しくありません';
        setError(errorMsg);
        onLoginError(errorMsg);
        if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
          console.log('PersonalLogin: 認証失敗');
        }
      }
    } catch (err: any) {
      const errorMsg = 'ログインに失敗しました: ' + (err.message || err);
      console.error('PersonalLogin: ログインエラー:', err);
      setError(errorMsg);
      onLoginError(errorMsg);
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
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        padding: '40px',
        width: '100%',
        maxWidth: '400px',
        animation: 'fadeInUp 0.6s ease-out'
      }}>
        <div style={{
          fontSize: '10px',
          marginBottom: '12px',
          background: '#667eea',
          color: 'white',
          padding: '2px 6px',
          borderRadius: '4px',
          fontWeight: '600',
          display: 'inline-block'
        }}>
          ログイン
        </div>

        {/* 記憶モード */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
          <input
            id="rememberMe"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            style={{ width: 16, height: 16, cursor: 'pointer' }}
          />
          <label htmlFor="rememberMe" style={{ cursor: 'pointer', fontSize: '14px', color: '#374151', userSelect: 'none' }}>
            次回から自動入力（記憶する）
          </label>
        </div>

        <h2 style={{
          margin: '0 0 8px 0',
          fontSize: '24px',
          color: '#374151',
          textAlign: 'center'
        }}>
          勤怠管理システム
        </h2>

        <div style={{
          background: '#f0f9ff',
          border: '2px solid #0ea5e9',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#0c4a6e',
            marginBottom: '4px'
          }}>
            👤 勤怠管理システム ログイン
          </div>
          <div style={{
            fontSize: '12px',
            color: '#075985'
          }}>
            社員番号と氏名を入力してください
          </div>
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
            社員番号 <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 500, marginLeft: 8 }}>（3桁）</span>
            </label>
            <input
              type="text"
              value={employeeCode}
              onChange={(e) => setEmployeeCode(e.target.value)}
              placeholder="社員番号を入力"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: '#374151',
              marginBottom: '8px'
            }}>
            氏名 <span style={{ fontSize: '10px', color: '#9ca3af', fontWeight: 500, marginLeft: 8 }}>（苗字と名前の間にスペースなし）</span>
            </label>
            <input
              type="text"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              placeholder="氏名を入力"
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '16px',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '20px',
              textAlign: 'center',
              backgroundColor: '#fef2f2',
              color: '#dc2626',
              border: '1px solid #fecaca',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              background: loading ? '#9ca3af' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {loading ? '認証中...' : 'ログイン'}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '16px',
          fontSize: '10px',
          lineHeight: 1.4,
          color: '#9ca3af'
        }}>
          社員番号と氏名を正確に入力してください。<br/>
          苗字と名前の間にスペースは入れないでください。
        </div>
      </div>
    </div>
  );
}
