import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../api/attendance';
// import { MasterRow } from '../types/attendance';
import PersonalLogin from '../components/PersonalLogin';
import { 
  isWeekend, 
  isSunday, 
  isSaturday, 
  getJapaneseDayName, 
  getDateStyle,
  isHolidaySync,
  getHolidayNameSync,
  debugHolidays
} from '../utils/holidays';

const fmtHM = (s?: string|null) => {
  if (!s) return '—';
  const d = new Date(s);
  const hours = d.getHours();
  const minutes = d.getMinutes();
  const z = (n:number)=> String(n).padStart(2,'0');
  return `${hours}:${z(minutes)}`;
};

const calcWorkTime = (clockIn?: string | null, clockOut?: string | null) => {
  if (!clockIn || !clockOut) return '—';
  const start = new Date(clockIn);
  const end = new Date(clockOut);
  const diffMs = end.getTime() - start.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const z = (n: number) => String(n).padStart(2, '0');
  return `${diffHours}:${z(diffMinutes)}`;
};

const calcLateEarly = (late?: number, early?: number) => {
  const lateMin = late || 0;
  const earlyMin = early || 0;
  const total = lateMin + earlyMin;
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  const z = (n: number) => String(n).padStart(2, '0');
  return `${hours}:${z(minutes)}`;
};

const calcNightWorkTime = (clockIn?: string | null, clockOut?: string | null) => {
  if (!clockIn || !clockOut) return '0:00';
  
  const start = new Date(clockIn);
  const end = new Date(clockOut);
  
  let totalNightMinutes = 0;
  
  // 勤務時間を1分刻みでチェックし、深夜時間帯（22:00-5:00）の分数をカウント
  const current = new Date(start);
  while (current < end) {
    const hour = current.getHours();
    
    // 22:00-5:00の深夜時間帯かどうかチェック
    if (hour >= 22 || hour < 5) {
      totalNightMinutes += 1;
    }
    
    // 1分進める
    current.setMinutes(current.getMinutes() + 1);
  }
  
  const hours = Math.floor(totalNightMinutes / 60);
  const minutes = totalNightMinutes % 60;
  const z = (n: number) => String(n).padStart(2, '0');
  return `${hours}:${z(minutes)}`;
};

const calcOvertimeFromTimes = (clockIn?: string | null, clockOut?: string | null) => {
  if (!clockIn || !clockOut) return '0:00';
  const start = new Date(clockIn);
  const end = new Date(clockOut);
  const diffMs = end.getTime() - start.getTime();
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const overtimeMinutes = Math.max(0, totalMinutes - 480);
  const hours = Math.floor(overtimeMinutes / 60);
  const minutes = overtimeMinutes % 60;
  const z = (n: number) => String(n).padStart(2, '0');
  return `${hours}:${z(minutes)}`;
};

const calcLegalOvertime = (clockIn?: string | null, clockOut?: string | null) => {
  if (!clockIn || !clockOut) return '0:00';
  const start = new Date(clockIn);
  const end = new Date(clockOut);
  const diffMs = end.getTime() - start.getTime();
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const legalOvertimeMinutes = Math.min(Math.max(0, totalMinutes - 480), 150);
  const hours = Math.floor(legalOvertimeMinutes / 60);
  const minutes = legalOvertimeMinutes % 60;
  const z = (n: number) => String(n).padStart(2, '0');
  return `${hours}:${z(minutes)}`;
};

const calcIllegalOvertimeFromTimes = (clockIn?: string | null, clockOut?: string | null) => {
  if (!clockIn || !clockOut) return '0:00';
  const start = new Date(clockIn);
  const end = new Date(clockOut);
  const diffMs = end.getTime() - start.getTime();
  const totalMinutes = Math.floor(diffMs / (1000 * 60));
  const illegalOvertimeMinutes = Math.max(0, totalMinutes - 630);
  const hours = Math.floor(illegalOvertimeMinutes / 60);
  const minutes = illegalOvertimeMinutes % 60;
  const z = (n: number) => String(n).padStart(2, '0');
  return `${hours}:${z(minutes)}`;
};

export default function PersonalPage() {
  // 開発環境でのみログ出力
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
    console.log('🟡 PersonalPage が読み込まれました');
  }

  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isLoggedIn } = useAuth();

  // 認証成功時の処理
  const handleLoginSuccess = (employeeData: { code: string; name: string; department: string }) => {
    console.log('PersonalPage: 認証成功', employeeData);
    setEmployeeCode(employeeData.code);
    setEmployeeName(employeeData.name);
    setIsAuthenticated(true);
    setAuthError('');
  };

  // 認証失敗時の処理
  const handleLoginError = (message: string) => {
    console.log('PersonalPage: 認証失敗', message);
    setAuthError(message);
    setIsAuthenticated(false);
  };

  const [employeeCode, setEmployeeCode] = useState('');

  // ログイン情報の初期化
  useEffect(() => {
    console.log('PersonalPage: ログイン情報の初期化開始');
    
    // 正常なログイン機能に戻す
    if (user) {
      console.log('PersonalPage: AuthContextからユーザー情報を設定', user);
      setEmployeeCode(user.code);
      setEmployeeName(user.name);
      setIsAuthenticated(true);
      return;
    }
    
    // location.stateからの情報取得（フォールバック）
    if (location.state?.user) {
      console.log('PersonalPage: location.stateからユーザー情報を設定', location.state.user);
      setEmployeeCode(location.state.user.code);
      setEmployeeName(location.state.user.name);
      setIsAuthenticated(true);
      return;
    }
    
    // ローカル記憶からの自動ログイン（記憶モードON時）
    const savedCode = localStorage.getItem('employeeCode');
    const savedName = localStorage.getItem('employeeName');
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    
    if (savedCode && savedName && rememberMe) {
      console.log('PersonalPage: 記憶されたログイン情報を使用', { savedCode, savedName });
      setEmployeeCode(savedCode);
      setEmployeeName(savedName);
      setIsAuthenticated(true);
      return;
    }
    
    console.log('PersonalPage: 認証が必要');
    setIsAuthenticated(false);
  }, [user, location.state]);

  // 状態管理
  const [employeeName, setEmployeeName] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authError, setAuthError] = useState('');
  const [todayData, setTodayData] = useState<MasterRow | null>(null);
  const [monthlyData, setMonthlyData] = useState<{ [key: string]: MasterRow }>({});
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [userInfo, setUserInfo] = useState<{ name: string; department: string; dept?: string } | null>(null);
  const [actualClockIn, setActualClockIn] = useState<string | null>(null);
  const [actualClockOut, setActualClockOut] = useState<string | null>(null);

  // 備考管理
  const [remarks, setRemarks] = useState<{ [key: string]: string }>({});

  // 今日の日付
  const currentDate = new Date().toISOString().slice(0, 10);

  // 祝日デバッグ（開発時のみ）
  React.useEffect(() => {
    const now = new Date();
    debugHolidays(now.getFullYear(), now.getMonth() + 1);
  }, []);

  // 今日の勤怠データ取得（統合版）
  const loadTodayData = async (isInitialLoad = false) => {
    if (!employeeCode) return;

    if (isInitialLoad) {
      setLoading(true);
    }

    try {
      const res = await api.master(currentDate);
      const list = res.list ?? [];
      const employeeData = list.find((emp) => emp.code === employeeCode.trim()) || null;
      setTodayData(employeeData);

      if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
        console.log('📊 データ読み込み:', { 
          employeeData, 
          clock_in: employeeData?.clock_in,
          clock_out: employeeData?.clock_out,
          status: employeeData?.status,
          isInitialLoad
        });
      }

      // ユーザー情報
      if (employeeData) {
        setUserInfo({
          name: employeeData.name,
          department: employeeData.dept || employeeData.department_name || employeeData.department || '未所属',
          dept: employeeData.dept,
        });
        if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
          console.log('👤 ユーザー情報設定:', {
            name: employeeData.name,
            dept: employeeData.dept,
            department_name: employeeData.department_name,
            department: employeeData.department,
            final: employeeData.dept || employeeData.department_name || employeeData.department || '未所属'
          });
        }
      } else {
        setUserInfo(null);
      }

      // 月別データも同時更新
      if (employeeData) {
        setMonthlyData(prev => ({
          ...prev,
          [currentDate]: employeeData
        }));
      }

      if (isInitialLoad) {
        setMsg('');
      }
    } catch (e: any) {
      if (isInitialLoad) {
        setMsg(String(e?.message ?? e));
      }
      console.error('データ読み込みエラー:', e);
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      }
    }
  };

  // 初期データ読み込み
  useEffect(() => {
    if (!employeeCode) return;
    loadTodayData(true);
  }, [employeeCode, currentDate]);

  // 月別データ取得（一時的に無効化）
  useEffect(() => {
    if (!employeeCode) {
      setMonthlyData({});
      return;
    }

    const loadMonthlyData = async () => {
      try {
        console.log('📅 月別データ読み込み開始:', selectedMonth);
        const year = new Date(selectedMonth + '-01').getFullYear();
        const month = new Date(selectedMonth + '-01').getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const monthData: { [key: string]: MasterRow } = {};
        
        // 月の全日分のデータを取得
        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          
          try {
            const res = await api.master(dateStr);
            const list = res.list ?? [];
            const employeeData = list.find((emp: MasterRow) => emp.code === employeeCode.trim());
            
            if (employeeData && (employeeData.clock_in || employeeData.clock_out)) {
              monthData[dateStr] = employeeData;
            }
          } catch (error) {
            console.warn(`日付 ${dateStr} のデータ取得に失敗:`, error);
          }
        }
        
        console.log('📅 月別データ読み込み完了:', Object.keys(monthData).length, '日分');
        setMonthlyData(monthData);
        
      } catch (error) {
        console.error('月別データ読み込みエラー:', error);
        setMonthlyData({});
      }
    };

    loadMonthlyData();
    loadMonthlyRemarks(selectedMonth);
  }, [employeeCode, selectedMonth]);

  // 🔄 リアルタイム更新関数
  const realtimeUpdate = async () => {
    if (!employeeCode) return;

    try {
      console.log('🔄 PersonalPage: リアルタイム更新中...');
      
      // 今日のデータを更新
      const todayRes = await api.master(currentDate);
      const list = todayRes.list ?? [];
      const todayEmployee = list.find((emp: MasterRow) => emp.code === employeeCode.trim());
      if (todayEmployee) {
        setTodayData(todayEmployee);
        
        // 月別データも同時更新
        setMonthlyData(prev => ({
          ...prev,
          [currentDate]: todayEmployee
        }));
      }
    } catch (e) {
      console.error('リアルタイム更新エラー:', e);
    }
  };

  // リアルタイム更新を有効化（useRealtimeフックを削除したため、手動で実装）

  // 🔄 リアルタイム更新：5秒ごとにデータを再読み込み（最適化版）
  useEffect(() => {
    if (!employeeCode) return;

    const interval = setInterval(async () => {
      console.log('🔄 定期更新: データを再読み込み中...');

      // 統合されたデータ読み込み関数を使用
      await loadTodayData(false);

      // 備考も更新（現在の月のみ）
      const currentMonth = new Date().toISOString().slice(0, 7);
      if (selectedMonth === currentMonth) {
        try {
          loadMonthlyRemarks(selectedMonth);
        } catch (e) {
          console.error('備考更新エラー:', e);
        }
      }
    }, 5000); // 5秒ごと

    return () => clearInterval(interval);
  }, [employeeCode, selectedMonth, currentDate]);

  // 📱 ウィンドウフォーカス時の自動更新（最適化版）
  useEffect(() => {
    if (!employeeCode) return;

    const handleFocus = async () => {
      try {
        console.log('🔄 ウィンドウフォーカス: データを更新中...');
        
        // 統合されたデータ読み込み関数を使用
        await loadTodayData(false);
        
        // 備考も更新
        loadMonthlyRemarks(selectedMonth);
        setMsg('データを最新に更新しました');
      } catch (e) {
        console.error('フォーカス時データ更新エラー:', e);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [employeeCode, currentDate, selectedMonth]);

  // 出勤制限チェック関数
  const canClockIn = () => {
    if (!employeeCode.trim()) {
      return { canClock: false, reason: '❌ 社員番号を入力してください' };
    }
    
    // 既に出勤済みの場合は処理を停止
    if (todayData?.clock_in) {
      return { canClock: false, reason: '⚠️ 本日は既に出勤済みです。1日1回のみ出勤できます。' };
    }
    
    // 退勤済みの場合、翌日の0:00以降でないと出勤できない
    if (todayData?.clock_out) {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      if (now < tomorrow) {
        const timeUntilTomorrow = tomorrow.getTime() - now.getTime();
        const hours = Math.floor(timeUntilTomorrow / (1000 * 60 * 60));
        const minutes = Math.floor((timeUntilTomorrow % (1000 * 60 * 60)) / (1000 * 60));
        
        return { 
          canClock: false, 
          reason: `⚠️ 退勤後は翌日の0:00以降に出勤できます。あと${hours}時間${minutes}分待ってください。` 
        };
      }
    }
    
    return { canClock: true, reason: '' };
  };

  // 退勤制限チェック関数
  const canClockOut = () => {
    if (!employeeCode.trim()) {
      return { canClock: false, reason: '❌ 社員番号を入力してください' };
    }
    
    // 出勤していない場合は退勤できない
    if (!todayData?.clock_in) {
      return { canClock: false, reason: '⚠️ 出勤していないため退勤できません。' };
    }
    
    // 既に退勤済みの場合は処理を停止
    if (todayData?.clock_out) {
      return { canClock: false, reason: '⚠️ 本日は既に退勤済みです。1日1回のみ退勤できます。' };
    }
    
    return { canClock: true, reason: '' };
  };

  // 出勤
  const handleClockIn = async () => {
    console.log('🕐 出勤ボタン押下:', { employeeCode, todayData });
    
    // 出勤制限チェック
    const clockInCheck = canClockIn();
    if (!clockInCheck.canClock) {
      setMsg(clockInCheck.reason);
      console.log('出勤制限のため処理停止:', clockInCheck.reason);
      return;
    }
    
    // 出勤処理中はローディング状態に
    setLoading(true);
    setMsg('⏳ 出勤処理中...');
    
    try {
      const result = await api.clockIn(employeeCode.trim());
      console.log('📥 出勤API結果:', result);
      
      if (result.ok) {
        setMsg(`✅ 出勤しました！ ${result.time || ''}`);
        
        // 統合されたデータ読み込み関数を使用
        await loadTodayData(false);
        
        console.log('✅ 出勤後データ更新完了');
        
        // 即座に月別データも更新（リアルタイム反映）
        setTimeout(async () => {
          try {
            const currentMonth = new Date().toISOString().slice(0, 7);
            await loadMonthlyRemarks(currentMonth);
          } catch (e) {
            console.error('出勤後の月別データ更新エラー:', e);
          }
        }, 100);
      } else {
        setMsg(`❌ 出勤エラー: ${result.message}`);
      }
    } catch (e: any) {
      const errMsg = String(e?.message ?? e);
      console.error('❌ 出勤エラー:', errMsg);
      
      // 出勤済み(409)の場合は最新データを取得
      if (errMsg.includes('409') || errMsg.includes('既に出勤済み')) {
        setMsg('⚠️ 既に出勤済みです。');
        
        try {
          await loadTodayData(false);
        } catch (_) {}
      } else {
        setMsg(`❌ ${errMsg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // 退勤
  const handleClockOut = async () => {
    console.log('🕕 退勤ボタン押下:', { employeeCode, todayData });
    
    // 退勤制限チェック
    const clockOutCheck = canClockOut();
    if (!clockOutCheck.canClock) {
      setMsg(clockOutCheck.reason);
      console.log('退勤制限のため処理停止:', clockOutCheck.reason);
      return;
    }
    
    // 退勤処理中はローディング状態に
    setLoading(true);
    setMsg('⏳ 退勤処理中...');
    
    try {
      const result = await api.clockOut(employeeCode.trim());
      console.log('📥 退勤API結果:', result);
      
      if (result.ok) {
        setMsg(`✅ 退勤しました！ ${result.time || ''}`);
        
        // 統合されたデータ読み込み関数を使用
        await loadTodayData(false);
        
        console.log('✅ 退勤後データ更新完了');
        
        // 即座に月別データも更新（リアルタイム反映）
        setTimeout(async () => {
          try {
            const currentMonth = new Date().toISOString().slice(0, 7);
            await loadMonthlyRemarks(currentMonth);
          } catch (e) {
            console.error('退勤後の月別データ更新エラー:', e);
          }
        }, 100);
      } else {
        setMsg(`❌ 退勤エラー: ${result.message}`);
      }
    } catch (e: any) {
      const errMsg = String(e?.message ?? e);
      console.error('❌ 退勤エラー:', errMsg);
      
      // 退勤済み(409)の場合は最新データを取得
      if (errMsg.includes('409') || errMsg.includes('既に退勤済み')) {
        setMsg('⚠️ 既に退勤済みです。');
        
        try {
          await loadTodayData(false);
        } catch (_) {}
      } else {
        setMsg(`❌ ${errMsg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // 備考保存（サーバーに保存）
  const onSaveRemark = async (targetDate: string, remark: string) => {
    try {
      await api.saveRemark(employeeCode, targetDate, remark);
      
      // ローカルステートも即座に更新
      const key = `${targetDate}-${employeeCode}`;
      setRemarks(prev => ({ ...prev, [key]: remark }));
      
      setMsg(`✅ ${targetDate}の備考を保存しました`);
      
      // 即座に最新データを再読み込み（リアルタイム反映）
      setTimeout(async () => {
        try {
          await loadMonthlyRemarks(selectedMonth);
        } catch (e) {
          console.error('備考保存後の再読み込みエラー:', e);
        }
      }, 100);
    } catch (e: any) {
      setMsg(`❌ 備考保存エラー: ${e?.message ?? e}`);
    }
  };

  // 月別備考を読み込み
  const loadMonthlyRemarks = async (month: string) => {
    if (!employeeCode) return;
    
    try {
      const response = await api.getRemarks(employeeCode, month);
      if (response.remarks) {
        // サーバーから取得した備考をローカルステートに設定
        const remarksWithKeys: { [key: string]: string } = {};
        Object.entries(response.remarks).forEach(([date, remark]) => {
          const key = `${date}-${employeeCode}`;
          remarksWithKeys[key] = remark as string;
        });
        setRemarks(prev => ({ ...prev, ...remarksWithKeys }));
      }
    } catch (e: any) {
      console.error('備考読み込みエラー:', e);
    }
  };

  // 認証状態判定中はローディング表示
  if (isAuthenticated === null) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}>
          <div style={{
            fontSize: '18px',
            color: '#666',
            marginBottom: '16px'
          }}>
            認証状態を確認中...
          </div>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f3f3',
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
        </div>
      </div>
    );
  }

  // 未認証の場合はログイン画面を表示
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <PersonalLogin
          onLoginSuccess={handleLoginSuccess}
          onLoginError={handleLoginError}
        />
        {authError && (
          <div style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: '#fee2e2',
            color: '#dc2626',
            padding: '12px 24px',
            borderRadius: '8px',
            border: '1px solid #fecaca',
            fontWeight: 600,
            zIndex: 1000
          }}>
            {authError}
          </div>
        )}
      </div>
    );
  }

  // メイン画面
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: window.innerWidth <= 768 ? '10px' : '20px',
        overflow: 'auto',
        WebkitOverflowScrolling: 'touch', // iOS Safari用のスムーズスクロール
      }}
    >
      <div
        style={{
          maxWidth: window.innerWidth <= 768 ? '100%' : '1400px',
          margin: '0 auto',
          background: 'white',
          borderRadius: window.innerWidth <= 768 ? '10px' : '20px',
          overflow: 'visible',
          boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
        }}
      >
        {/* ヘッダー */}
        <div
          style={{
            background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            color: 'white',
            padding: window.innerWidth <= 768 ? '16px' : '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: window.innerWidth <= 768 ? '12px' : '16px',
          }}
        >
          {/* タイトルとユーザー情報 */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                background: 'green',
                color: 'white',
                padding: window.innerWidth <= 768 ? '12px 16px' : '12px 20px',
                borderRadius: window.innerWidth <= 768 ? '12px' : '10px',
                display: 'flex',
                flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
                alignItems: 'center',
                gap: window.innerWidth <= 768 ? '8px' : '12px',
                fontSize: window.innerWidth <= 768 ? '18px' : '20px',
                fontWeight: 700,
                margin: '0 auto',
                justifyContent: 'center',
                maxWidth: window.innerWidth <= 768 ? '100%' : 'auto',
              }}
            >
              <span style={{ fontSize: window.innerWidth <= 768 ? '20px' : '20px' }}>📱 パーソナルページ</span>
              {(user || userInfo) && (
                <>
                  {window.innerWidth <= 768 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '16px' }}>
                        <span>👤</span>
                        <span>{userInfo?.name || user?.name || employeeName}</span>
                        <span style={{ opacity: 0.8, fontSize: '14px' }}>({user?.code || employeeCode})</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '16px' }}>
                        <span>🏢</span>
                        <span>{userInfo?.dept || userInfo?.department || user?.department || todayData?.dept || todayData?.department_name || '開発部'}</span>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span style={{ opacity: 0.7 }}>|</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '16px' }}>👤</span>
                        <span style={{ fontSize: '16px' }}>{userInfo?.name || user?.name || employeeName}</span>
                        <span style={{ opacity: 0.8, fontSize: '14px' }}>({user?.code || employeeCode})</span>
                      </div>
                      <span style={{ opacity: 0.7 }}>|</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '16px' }}>🏢</span>
                        <span style={{ fontSize: '16px' }}>{userInfo?.dept || userInfo?.department || user?.department || todayData?.dept || todayData?.department_name || '開発部'}</span>
                      </div>
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          {/* 出勤・退勤ボタン */}
          {employeeCode && (
            <div
              style={{
                background: 'rgba(255,255,255,0.15)',
                padding: '16px',
                borderRadius: '12px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              <label
                style={{
                  display: 'block',
                  fontSize: '16px',
                  fontWeight: 700,
                  color: 'white',
                  marginBottom: '12px',
                  textAlign: 'center',
                }}
              >
                ⏰ 勤怠操作
              </label>
              <div
                style={{
                  display: 'flex',
                  flexDirection: window.innerWidth <= 768 ? 'column' : 'row',
                  gap: window.innerWidth <= 768 ? '12px' : '12px',
                  justifyContent: 'center',
                }}
              >
                {(() => {
                  const clockInCheck = canClockIn();
                  const isDisabled = loading || !clockInCheck.canClock;
                  const isClockInRestricted = todayData?.clock_out && !clockInCheck.canClock;
                  
                  return (
                    <button
                      onClick={() => {
                        console.log('🕐 出勤ボタン状態確認:', {
                          loading,
                          'todayData?.clock_in': todayData?.clock_in,
                          'todayData?.clock_out': todayData?.clock_out,
                          disabled: isDisabled,
                          clockInCheck,
                          todayData
                        });
                        handleClockIn();
                      }}
                      disabled={isDisabled}
                      style={{
                        padding: window.innerWidth <= 768 ? '16px 20px' : '14px 20px',
                        border: '3px solid #059669',
                        borderRadius: window.innerWidth <= 768 ? '12px' : '12px',
                        background: isDisabled ? '#f3f4f6' : '#059669',
                        color: isDisabled ? '#9ca3af' : 'white',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        fontSize: window.innerWidth <= 768 ? '18px' : '16px',
                        fontWeight: 700,
                        transition: 'all 0.3s ease',
                        opacity: loading ? 0.6 : 1,
                        flex: 1,
                        minHeight: window.innerWidth <= 768 ? '60px' : '50px',
                        boxShadow: window.innerWidth <= 768 ? '0 4px 8px rgba(5,150,105,0.3)' : 'none',
                      }}
                      title={
                        todayData?.clock_in ? '本日は既に出勤済みです（1日1回限り）' :
                        isClockInRestricted ? '退勤後は翌日の0:00以降に出勤できます' :
                        '出勤を記録します'
                      }
                    >
                      {loading ? '⏳' : 
                       todayData?.clock_in ? '✅ 出勤済み' : 
                       isClockInRestricted ? '⏰ 翌日0:00まで' : '🕐 出勤'}
                    </button>
                  );
                })()}

                {(() => {
                  const clockOutCheck = canClockOut();
                  const isDisabled = loading || !clockOutCheck.canClock;
                  const isClockOutRestricted = !todayData?.clock_in && !clockOutCheck.canClock;
                  
                  return (
                    <button
                      onClick={() => {
                        console.log('🕕 退勤ボタン状態確認:', {
                          loading,
                          'todayData?.clock_in': todayData?.clock_in,
                          'todayData?.clock_out': todayData?.clock_out,
                          disabled: isDisabled,
                          clockOutCheck,
                          todayData
                        });
                        handleClockOut();
                      }}
                      disabled={isDisabled}
                      style={{
                        padding: window.innerWidth <= 768 ? '16px 20px' : '14px 20px',
                        border: '3px solid #dc2626',
                        borderRadius: window.innerWidth <= 768 ? '12px' : '12px',
                        background: isDisabled ? '#f3f4f6' : '#dc2626',
                        color: isDisabled ? '#9ca3af' : 'white',
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        fontSize: window.innerWidth <= 768 ? '18px' : '16px',
                        fontWeight: 700,
                        transition: 'all 0.3s ease',
                        opacity: loading ? 0.6 : 1,
                        flex: 1,
                        minHeight: window.innerWidth <= 768 ? '60px' : '50px',
                        boxShadow: window.innerWidth <= 768 ? '0 4px 8px rgba(220,38,38,0.3)' : 'none',
                      }}
                      title={
                        todayData?.clock_out ? '本日は既に退勤済みです（1日1回限り）' :
                        isClockOutRestricted ? '出勤してから退勤してください' :
                        '退勤を記録します'
                      }
                    >
                      {loading ? '⏳' : 
                       todayData?.clock_out ? '✅ 退勤済み' : 
                       isClockOutRestricted ? '🚫 要出勤' : '🕕 退勤'}
                    </button>
                  );
                })()}
              </div>
            </div>
          )}

          {/* ログアウトボタン */}
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => {
                // ログアウト処理
                setIsAuthenticated(false);
                setEmployeeCode('');
                setEmployeeName('');
                setTodayData(null);
                setMonthlyData({});
                setRemarks({});
                localStorage.removeItem('employeeCode');
                localStorage.removeItem('employeeName');
                localStorage.setItem('rememberMe', 'false');
              }}
              style={{
                padding: '12px 24px',
                background: 'rgba(220, 38, 38, 0.8)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(220, 38, 38, 1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(220, 38, 38, 0.8)';
              }}
            >
              🚪 ログアウト
            </button>
          </div>
        </div>

        {/* メッセージ表示 */}
        {msg && (
          <div
            style={{
              padding: '16px 24px',
              background: msg.includes('エラー') ? '#fee2e2' : '#d1fae5',
              borderBottom: '1px solid #e5e7eb',
              fontSize: '16px',
              fontWeight: 600,
              color: msg.includes('エラー') ? '#dc2626' : '#059669',
            }}
          >
            {msg}
          </div>
        )}

        {/* 今日の勤怠情報カード */}
        {todayData && (
          <div style={{ padding: '24px' }}>
            <h2
              style={{
                margin: '0 0 20px 0',
                fontSize: '20px',
                fontWeight: 700,
                color: '#374151',
                textAlign: 'center',
                padding: '12px',
                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                borderRadius: '12px',
                border: '1px solid #bae6fd',
              }}
            >
              📊 今日の勤怠情報 ({currentDate})
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: window.innerWidth <= 768 ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: window.innerWidth <= 768 ? '12px' : '16px',
                marginBottom: '24px',
              }}
            >
              {/* 出勤時間 */}
              <div
                style={{
                  background: 'white',
                  border: '2px solid #059669',
                  borderRadius: '12px',
                  padding: window.innerWidth <= 768 ? '16px' : '20px',
                  textAlign: 'center',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                }}
              >
                <div
                  style={{
                    fontSize: window.innerWidth <= 768 ? '16px' : '14px',
                    color: '#059669',
                    marginBottom: '8px',
                    fontWeight: 600,
                  }}
                >
                  🕐 出勤時間
                </div>
                <div
                  style={{
                    fontSize: window.innerWidth <= 768 ? '24px' : '18px',
                    fontWeight: 700,
                    color: '#374151',
                  }}
                >
                  {todayData.clock_in ? fmtHM(todayData.clock_in) : (actualClockIn ? fmtHM(actualClockIn) : '—')}
                </div>
              </div>

              {/* 退勤時間 */}
              <div
                style={{
                  background: 'white',
                  border: '2px solid #dc2626',
                  borderRadius: '12px',
                  padding: window.innerWidth <= 768 ? '16px' : '20px',
                  textAlign: 'center',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                }}
              >
                <div
                  style={{
                    fontSize: window.innerWidth <= 768 ? '16px' : '14px',
                    color: '#dc2626',
                    marginBottom: '8px',
                    fontWeight: 600,
                  }}
                >
                  🕕 退勤時間
                </div>
                <div
                  style={{
                    fontSize: window.innerWidth <= 768 ? '24px' : '18px',
                    fontWeight: 700,
                    color: '#374151',
                  }}
                >
                  {todayData.clock_out ? fmtHM(todayData.clock_out) : (actualClockOut ? fmtHM(actualClockOut) : '—')}
                </div>
              </div>

              {/* 勤務時間 */}
              <div
                style={{
                  background: 'white',
                  border: '2px solid #7c3aed',
                  borderRadius: '12px',
                  padding: window.innerWidth <= 768 ? '16px' : '20px',
                  textAlign: 'center',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                }}
              >
                <div
                  style={{
                    fontSize: window.innerWidth <= 768 ? '16px' : '14px',
                    color: '#7c3aed',
                    marginBottom: '8px',
                    fontWeight: 600,
                  }}
                >
                  ⏱️ 勤務時間
                </div>
                <div
                  style={{
                    fontSize: window.innerWidth <= 768 ? '24px' : '18px',
                    fontWeight: 700,
                    color: '#374151',
                  }}
                >
                  {calcWorkTime(
                    todayData.clock_in || actualClockIn, 
                    todayData.clock_out || actualClockOut
                  )}
                </div>
              </div>

              {/* 状態 */}
              <div
                style={{
                  background: 'white',
                  border: '2px solid #f59e0b',
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                }}
              >
                <div
                  style={{
                    fontSize: '14px',
                    color: '#f59e0b',
                    marginBottom: '8px',
                    fontWeight: 600,
                  }}
                >
                  📋 状態
                </div>
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: todayData.status === '出勤中' ? '#059669' : 
                           todayData.status === '退勤済み' ? '#dc2626' : '#6b7280',
                  }}
                >
                  {todayData.status}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 月別カレンダー */}
        <div style={{ padding: '0 24px 24px' }}>
          <div
            style={{
              background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
              borderRadius: '16px',
              padding: '24px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#374151',
                }}
              >
                📅 月別勤怠カレンダー ({selectedMonth})
              </h3>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                style={{
                  padding: '8px 12px',
                  border: '2px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: 600,
                  color: '#374151',
                  background: 'white',
                  cursor: 'pointer',
                }}
              />
            </div>

            {/* カレンダーテーブル */}
            <div style={{ overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '14px',
                  background: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                }}
              >
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', color: 'white' }}>
                    <th style={{ padding: '16px 12px', textAlign: 'left', fontWeight: 700, minWidth: '120px' }}>
                      日付
                    </th>
                    <th style={{ padding: '16px 12px', textAlign: 'center', fontWeight: 700, minWidth: '100px' }}>
                      出勤時間
                    </th>
                    <th style={{ padding: '16px 12px', textAlign: 'center', fontWeight: 700, minWidth: '100px' }}>
                      退勤時間
                    </th>
                    <th style={{ padding: '16px 12px', textAlign: 'center', fontWeight: 700, minWidth: '100px' }}>
                      勤務時間
                    </th>
                    <th style={{ padding: '16px 12px', textAlign: 'center', fontWeight: 700, minWidth: '100px' }}>
                      残業時間
                    </th>
                    <th style={{ padding: '16px 12px', textAlign: 'center', fontWeight: 700, minWidth: '100px' }}>
                      深夜時間
                    </th>
                    <th style={{ padding: '16px 12px', textAlign: 'center', fontWeight: 700, minWidth: '100px' }}>
                      法定内残業
                    </th>
                    <th style={{ padding: '16px 12px', textAlign: 'center', fontWeight: 700, minWidth: '100px' }}>
                      法定外残業
                    </th>
                    <th style={{ padding: '16px 8px', textAlign: 'center', fontWeight: 700, minWidth: '120px', maxWidth: '150px' }}>
                      備考
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const year = new Date(selectedMonth + '-01').getFullYear();
                    const month = new Date(selectedMonth + '-01').getMonth();

                    const daysInMonth = new Date(year, month + 1, 0).getDate();
                    const rows: JSX.Element[] = [];

                    for (let day = 1; day <= daysInMonth; day++) {
                      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const userData = monthlyData[dateStr];
                      const date = new Date(year, month, day);
                      const dayOfWeek = date.getDay();
                      const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
                      
                      const isWeekendDay = dayOfWeek === 0 || dayOfWeek === 6;
                      const isSundayDay = dayOfWeek === 0;
                      const holidayName = isHolidaySync(dateStr) ? getHolidayNameSync(dateStr) : null;

                      const backgroundStyle = holidayName || isSundayDay 
                        ? { background: '#fef2f2' } // 祝日・日曜は薄い赤背景
                        : dayOfWeek === 6 
                        ? { background: '#eff6ff' } // 土曜は薄い青背景
                        : {};

                      rows.push(
                        <tr key={day} style={{borderBottom: '1px solid #f3f4f6', background: day % 2 === 0 ? '#ffffff' : '#fafbfc'}}>
                          <td style={{padding: 8, fontSize: 13, borderRight: '1px solid #f3f4f6', fontWeight: 600, ...backgroundStyle}}>
                            <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-start'}}>
                              <div>{day}日({dayNames[dayOfWeek]})</div>
                              {holidayName && (
                                <div style={{
                                  fontSize: '10px', 
                                  color: '#dc2626',
                                  fontWeight: 'bold',
                                  marginTop: '2px'
                                }}>
                                  {holidayName}
                                </div>
                              )}
                              {isWeekendDay && !holidayName && (
                                <div style={{ 
                                  fontSize: '10px', 
                                  color: isSundayDay ? '#dc2626' : '#2563eb',
                                  fontWeight: 'bold',
                                  marginTop: '2px'
                                }}>
                                  {isSundayDay ? '日曜日' : '土曜日'}
                                </div>
                              )}
                            </div>
                          </td>
                          <td
                            style={{
                              padding: '12px',
                              fontSize: '14px',
                              color: '#374151',
                              textAlign: 'center',
                              borderRight: '1px solid #f3f4f6',
                            }}
                          >
                            {userData ? fmtHM(userData.clock_in) : '—'}
                          </td>
                          <td
                            style={{
                              padding: '12px',
                              fontSize: '14px',
                              color: '#374151',
                              textAlign: 'center',
                              borderRight: '1px solid #f3f4f6',
                            }}
                          >
                            {userData ? fmtHM(userData.clock_out) : '—'}
                          </td>
                          <td
                            style={{
                              padding: '12px',
                              fontSize: '14px',
                              color: '#374151',
                              textAlign: 'center',
                              borderRight: '1px solid #f3f4f6',
                            }}
                          >
                            {userData ? calcWorkTime(userData.clock_in, userData.clock_out) : '—'}
                          </td>
                          <td
                            style={{
                              padding: '12px',
                              fontSize: '14px',
                              color: '#374151',
                              textAlign: 'center',
                              borderRight: '1px solid #f3f4f6',
                            }}
                          >
                            {userData ? calcOvertimeFromTimes(userData.clock_in, userData.clock_out) : '—'}
                          </td>
                          <td
                            style={{
                              padding: '12px',
                              fontSize: '14px',
                              color: '#374151',
                              textAlign: 'center',
                              borderRight: '1px solid #f3f4f6',
                            }}
                          >
                            {userData ? calcNightWorkTime(userData.clock_in, userData.clock_out) : '—'}
                          </td>
                          <td
                            style={{
                              padding: '12px',
                              fontSize: '14px',
                              color: '#374151',
                              textAlign: 'center',
                              borderRight: '1px solid #f3f4f6',
                            }}
                          >
                            {userData ? calcLegalOvertime(userData.clock_in, userData.clock_out) : '—'}
                          </td>
                          <td
                            style={{
                              padding: '12px',
                              fontSize: '14px',
                              color: '#374151',
                              textAlign: 'center',
                              borderRight: '1px solid #f3f4f6',
                            }}
                          >
                            {userData ? calcIllegalOvertimeFromTimes(userData.clock_in, userData.clock_out) : '—'}
                          </td>
                          <td
                            style={{
                              padding: '8px 6px',
                              fontSize: '14px',
                              color: '#374151',
                              textAlign: 'center',
                              width: '150px',
                              maxWidth: '150px',
                            }}
                          >
                            <input
                              type="text"
                              value={remarks[`${dateStr}-${employeeCode}`] || ''}
                              onChange={(e) => {
                                const key = `${dateStr}-${employeeCode}`;
                                setRemarks(prev => ({ ...prev, [key]: e.target.value }));
                              }}
                              onBlur={(e) => {
                                if (e.target.value !== (remarks[`${dateStr}-${employeeCode}`] || '')) {
                                  onSaveRemark(dateStr, e.target.value);
                                }
                              }}
                              style={{
                                width: '100%',
                                maxWidth: '140px',
                                padding: '4px 6px',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                fontSize: '11px',
                                background: 'white',
                              }}
                              placeholder="備考"
                            />
                          </td>
                        </tr>
                      );
                    }

                    return rows;
                  })()}
                </tbody>
              </table>
            </div>

            {/* 月間集計 */}
            <div style={{ marginTop: '24px' }}>
              <h4
                style={{
                  margin: '0 0 16px 0',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#374151',
                  padding: '12px',
                  background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                  borderRadius: '8px',
                  textAlign: 'center',
                }}
              >
                📊 月間集計
              </h4>

              {(() => {
                const year = new Date(selectedMonth + '-01').getFullYear();
                const month = new Date(selectedMonth + '-01').getMonth();
                const daysInMonth = new Date(year, month + 1, 0).getDate();

                let totalWorkMinutes = 0;
                let totalOvertimeMinutes = 0;
                let totalNightMinutes = 0;
                let totalLegalOvertimeMinutes = 0;
                let totalLateMinutes = 0;
                let totalEarlyMinutes = 0;
                let workDays = 0;

                for (let day = 1; day <= daysInMonth; day++) {
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const userData = monthlyData[dateStr];

                  if (userData?.clock_in && userData?.clock_out) {
                    workDays++;

                    const start = new Date(userData.clock_in);
                    const end = new Date(userData.clock_out);
                    const workMs = end.getTime() - start.getTime();
                    const workMinutes = Math.floor(workMs / (1000 * 60));
                    totalWorkMinutes += workMinutes;

                    const overtimeMinutes = Math.max(0, workMinutes - 480 - 150);
                    totalOvertimeMinutes += overtimeMinutes;

                    if (workMinutes > 480 && workMinutes <= 630) {
                      const legalOvertimeMinutes = Math.min(workMinutes - 480, 150);
                      totalLegalOvertimeMinutes += legalOvertimeMinutes;
                    }

                    const night = calcNightWorkTime(userData.clock_in, userData.clock_out);
                    const [nh, nm] = night.split(':').map((v) => parseInt(v, 10));
                    totalNightMinutes += (nh || 0) * 60 + (nm || 0);

                    if (userData.late) totalLateMinutes += userData.late;
                    if (userData.early) totalEarlyMinutes += userData.early;
                  }
                }

                const formatTime = (minutes: number) => {
                  const h = Math.floor(minutes / 60);
                  const m = minutes % 60;
                  return `${h}:${String(m).padStart(2, '0')}`;
                };

                return (
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: window.innerWidth <= 768 ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: window.innerWidth <= 768 ? '12px' : '16px',
                    }}
                  >
                    <div
                      style={{
                        background: 'white',
                        padding: window.innerWidth <= 768 ? '12px' : '16px',
                        borderRadius: '12px',
                        textAlign: 'center',
                        border: '2px solid #059669',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      }}
                    >
                      <div style={{ fontSize: window.innerWidth <= 768 ? '12px' : '14px', color: '#059669', fontWeight: 600, marginBottom: '8px' }}>
                        出勤日数
                      </div>
                      <div style={{ fontSize: window.innerWidth <= 768 ? '18px' : '20px', fontWeight: 700, color: '#374151' }}>
                        {workDays}日
                      </div>
                    </div>

                    <div
                      style={{
                        background: 'white',
                        padding: window.innerWidth <= 768 ? '12px' : '16px',
                        borderRadius: '12px',
                        textAlign: 'center',
                        border: '2px solid #7c3aed',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      }}
                    >
                      <div style={{ fontSize: window.innerWidth <= 768 ? '12px' : '14px', color: '#7c3aed', fontWeight: 600, marginBottom: '8px' }}>
                        総勤務時間
                      </div>
                      <div style={{ fontSize: window.innerWidth <= 768 ? '18px' : '20px', fontWeight: 700, color: '#374151' }}>
                        {formatTime(totalWorkMinutes)}
                      </div>
                    </div>

                    <div
                      style={{
                        background: 'white',
                        padding: '16px',
                        borderRadius: '12px',
                        textAlign: 'center',
                        border: '2px solid #f59e0b',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      }}
                    >
                      <div style={{ fontSize: '14px', color: '#f59e0b', fontWeight: 600, marginBottom: '8px' }}>
                        残業時間
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#374151' }}>
                        {formatTime(totalOvertimeMinutes)}
                      </div>
                    </div>

                    <div
                      style={{
                        background: 'white',
                        padding: '16px',
                        borderRadius: '12px',
                        textAlign: 'center',
                        border: '2px solid #6366f1',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      }}
                    >
                      <div style={{ fontSize: '14px', color: '#6366f1', fontWeight: 600, marginBottom: '8px' }}>
                        深夜時間
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#374151' }}>
                        {formatTime(totalNightMinutes)}
                      </div>
                    </div>

                    <div
                      style={{
                        background: 'white',
                        padding: '16px',
                        borderRadius: '12px',
                        textAlign: 'center',
                        border: '2px solid #10b981',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      }}
                    >
                      <div style={{ fontSize: '14px', color: '#10b981', fontWeight: 600, marginBottom: '8px' }}>
                        法定内残業
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#374151' }}>
                        {formatTime(totalLegalOvertimeMinutes)}
                      </div>
                    </div>

                    <div
                      style={{
                        background: 'white',
                        padding: '16px',
                        borderRadius: '12px',
                        textAlign: 'center',
                        border: '2px solid #ef4444',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      }}
                    >
                      <div style={{ fontSize: '14px', color: '#ef4444', fontWeight: 600, marginBottom: '8px' }}>
                        法定外残業
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#374151' }}>
                        {formatTime(totalOvertimeMinutes)}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}