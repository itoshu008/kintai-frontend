// src/api/attendance.ts
// バックエンドの実装（/api 以下のパス）に合わせたフロント用 API クライアント完全版

// ========================
// 型（このファイル内に完結）
// ========================
export type ApiResponse<T = any> = {
  ok?: boolean;
  error?: string;
} & T;

export type HealthResponse = {
  ok: boolean;
  status?: 'healthy' | 'unhealthy';
  timestamp?: string;
  ts?: string; // 旧実装互換（/api/health 用に残す）
  version?: string;
  environment?: string;
  uptime?: number;
};

export type Department = {
  id: number;
  name: string;
};

export type Employee = {
  id: number;
  code: string;
  name: string;
  department_id: number | null;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  dept?: string; // 表示用にサーバが返す場合あり
};

export type MasterRow = {
  id: number;
  code: string;
  name: string;
  dept: string;
  checkin?: string | null;
  checkout?: string | null;
  work_hours?: number;
  work_minutes?: number;
  total_minutes?: number;
  late?: number;
  remark?: string;
};

export type ClockResponse = {
  ok: boolean;
  message?: string;
  checkin?: string;
  checkout?: string;
  work_hours?: number;
  work_minutes?: number;
  total_minutes?: number;
  late?: number;
  idempotent?: boolean;
  time?: string;
};

export type AttendanceRecord = {
  code: string;
  date: string;          // YYYY-MM-DD
  checkin?: string;      // ISO
  checkout?: string;     // ISO
  remark?: string;
};

// ========================
// 共通設定・ユーティリティ
// ========================
const API_BASE_URL = '/api';

// fetch ラッパ（JSON 専用）
async function http<T = any>(
  path: string,
  init?: RequestInit & { expectOk?: boolean }
): Promise<T> {
  const res = await fetch(path, {
    cache: 'no-store',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  // バックエンドは「業務エラーでも HTTP200 + { ok:false }」を返すことがある
  // ので、HTTPステータスだけでは判定しない
  const text = await res.text();
  let json: any = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    // HTMLエラー等（nginxの502など）が返った場合
    throw new Error(`Invalid JSON: ${text.slice(0, 200)}`);
  }

  // 期待に応じて失敗を例外化
  if (init?.expectOk && (json?.ok === false || !res.ok)) {
    throw new Error(json?.error || `Request failed: ${res.status}`);
  }

  return json as T;
}

// ========================
// ヘルスチェック
// ========================
export async function healthCheck(): Promise<HealthResponse> {
  try {
    // バックエンド実装と揃える
    const data = await http<HealthResponse>(`${API_BASE_URL}/admin/health`);
    return data;
  } catch (e: any) {
    console.error('Error checking health:', e);
    return { ok: false, ts: '' };
  }
}

// ========================
// 部署
// ========================
export async function fetchDepartments(): Promise<ApiResponse<{ departments: Department[] }>> {
  try {
    const data = await http<ApiResponse<{ departments: Department[] }>>(
      `${API_BASE_URL}/admin/departments`
    );
    return data;
  } catch (e: any) {
    console.error('Error fetching departments:', e);
    return { ok: false, error: e.message };
  }
}

export async function createDepartment(name: string): Promise<ApiResponse<{ department: Department }>> {
  try {
    const data = await http<ApiResponse<{ department: Department }>>(
      `${API_BASE_URL}/admin/departments`,
      { method: 'POST', body: JSON.stringify({ name }), expectOk: true }
    );
    return data;
  } catch (e: any) {
    console.error('Error creating department:', e);
    return { ok: false, error: e.message };
  }
}

export async function updateDepartment(id: number, name: string): Promise<ApiResponse<{ department: Department }>> {
  try {
    const data = await http<ApiResponse<{ department: Department }>>(
      `${API_BASE_URL}/admin/departments/${id}`,
      { method: 'PUT', body: JSON.stringify({ name }), expectOk: true }
    );
    return data;
  } catch (e: any) {
    console.error('Error updating department:', e);
    return { ok: false, error: e.message };
  }
}

export async function deleteDepartment(id: number): Promise<ApiResponse> {
  try {
    const data = await http<ApiResponse>(
      `${API_BASE_URL}/admin/departments/${id}`,
      { method: 'DELETE', expectOk: true }
    );
    return data;
  } catch (e: any) {
    console.error('Error deleting department:', e);
    return { ok: false, error: e.message };
  }
}

// ========================
// 社員
// ========================
/**
 * 社員一覧
 * サーバは { ok:true, employees:[...] }（新）や { list:[...] }（旧）の両方あり得るので吸収
 */
export async function fetchEmployees(): Promise<ApiResponse<{ employees: Employee[] }>> {
  try {
    const raw = await http<any>(`${API_BASE_URL}/admin/employees`);
    const employees: Employee[] = raw?.employees || raw?.list || [];
    return { ok: true, employees };
  } catch (e: any) {
    console.error('Error fetching employees:', e);
    return { ok: false, error: e.message };
  }
}

/**
 * 個別社員取得（GET の単体APIはサーバ未実装）
 * → 一覧から抽出して返す
 */
export async function fetchEmployeeByCode(code: string): Promise<ApiResponse<{ employee: Employee | null }>> {
  try {
    const listRes = await fetchEmployees();
    if (listRes.ok === false) return listRes as any;
    const emp = (listRes.employees || []).find((e) => e.code === code) || null;
    return { ok: true, employee: emp };
  } catch (e: any) {
    console.error('Error fetching employee by code:', e);
    return { ok: false, error: e.message };
  }
}

export async function createEmployee(code: string, name: string, department_id?: number | null): Promise<ApiResponse<{ employee: Employee }>> {
  try {
    const data = await http<ApiResponse<{ employee: Employee }>>(
      `${API_BASE_URL}/admin/employees`,
      { method: 'POST', body: JSON.stringify({ code, name, department_id }), expectOk: true }
    );
    return data;
  } catch (e: any) {
    console.error('Error creating employee:', e);
    return { ok: false, error: e.message };
  }
}

// 社員更新
export const updateEmployee = async (
  originalCode: string,
  data: { name: string; department_id: number; code?: string }
): Promise<ApiResponse<Employee>> => {
  try {
    const res = await fetch(
      `${API_BASE_URL}/admin/employees/${encodeURIComponent(originalCode)}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }
    );

    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      throw new Error(`Invalid JSON response for ${res.url}`);
    }

    if (!res.ok || (json && json.ok === false)) {
      const reason = json?.error || text || res.statusText;
      throw new Error(`${res.status} for ${res.url} :: ${reason}`);
    }

    return json;
  } catch (error) {
    console.error('Error updating employee:', error);
    return { ok: false, error: (error as Error).message } as any;
  }
};

// 社員削除
export const deleteEmployee = async (
  code: string
): Promise<ApiResponse> => {
  try {
    const res = await fetch(
      `${API_BASE_URL}/admin/employees/${encodeURIComponent(code)}`,
      {
        method: 'DELETE',
      }
    );

    const text = await res.text();
    let json: any = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      throw new Error(`Invalid JSON response for ${res.url}`);
    }

    if (!res.ok || (json && json.ok === false)) {
      const reason = json?.error || text || res.statusText;
      throw new Error(`${res.status} for ${res.url} :: ${reason}`);
    }

    return json;
  } catch (error) {
    console.error('Error deleting employee:', error);
    return { ok: false, error: (error as Error).message } as any;
  }
};

// ========================
// マスター・勤怠
// ========================
/** マスター（指定日） */
export async function fetchMasterData(date?: string): Promise<ApiResponse<{ data: MasterRow[]; departments?: Department[] }>> {
  try {
    const params = new URLSearchParams();
    if (date) params.set('date', date);

    const data = await http<ApiResponse<{ data: MasterRow[]; departments?: Department[] }>>(
      `${API_BASE_URL}/admin/master?${params.toString()}`
    );
    // サーバは { ok:true, data, departments } を返す
    if (Array.isArray((data as any).data)) {
      return data;
    }
    // 念のため互換
    return { ok: true, data: ((data as any).list as MasterRow[]) || [] };
  } catch (e: any) {
    console.error('Error fetching master data:', e);
    return { ok: false, error: e.message };
  }
}

/** 出勤 */
export async function clockIn(code: string, note?: string): Promise<ClockResponse> {
  try {
    const data = await http<ClockResponse>(`${API_BASE_URL}/attendance/checkin`, {
      method: 'POST',
      body: JSON.stringify({ code, note }),
      expectOk: false, // サーバは業務エラーでも200を返す
    });
    return data;
  } catch (e: any) {
    console.error('Error clocking in:', e);
    return { ok: false, message: e.message };
  }
}

/** 退勤 */
export async function clockOut(code: string): Promise<ClockResponse> {
  try {
    const data = await http<ClockResponse>(`${API_BASE_URL}/attendance/checkout`, {
      method: 'POST',
      body: JSON.stringify({ code }),
      expectOk: false,
    });
    return data;
  } catch (e: any) {
    console.error('Error clocking out:', e);
    return { ok: false, message: e.message };
  }
}

/**
 * 勤怠記録保存API /api/attendance/record はサーバ未実装
 * → 明示的に未サポートを返す（呼び出し元の古いコードの安全ガード）
 */
export async function saveAttendanceRecord(_attendance: AttendanceRecord): Promise<ApiResponse> {
  return { ok: false, error: 'Not implemented: /api/attendance/record' };
}

// ========================
// 備考
// ========================
export async function saveRemark(employeeCode: string, date: string, remark: string): Promise<ApiResponse> {
  try {
    const data = await http<ApiResponse>(`${API_BASE_URL}/admin/remarks`, {
      method: 'POST',
      body: JSON.stringify({ employeeCode, date, remark }),
      expectOk: true,
    });
    return data;
  } catch (e: any) {
    console.error('Error saving remark:', e);
    return { ok: false, error: e.message };
  }
}

export async function getRemark(employeeCode: string, date: string): Promise<ApiResponse<{ remark: string }>> {
  try {
    const data = await http<ApiResponse<{ remark: string }>>(
      `${API_BASE_URL}/admin/remarks/${encodeURIComponent(employeeCode)}/${encodeURIComponent(date)}`
    );
    return data;
  } catch (e: any) {
    console.error('Error getting remark:', e);
    return { ok: false, error: e.message } as any;
  }
}

/** 月別備考（サーバ実装に準拠：/api/admin/remarks/:employeeCode?month=YYYY-MM） */
export async function getRemarks(employeeCode: string, month: string): Promise<ApiResponse<{ remarks: { date: string; remark: string }[]; startDate?: string }>> {
  try {
    const data = await http<ApiResponse<{ remarks: { date: string; remark: string }[] }>>(
      `${API_BASE_URL}/admin/remarks/${encodeURIComponent(employeeCode)}?month=${encodeURIComponent(month)}`
    );
    return data;
  } catch (e: any) {
    console.error('Error getting remarks:', e);
    return { ok: false, error: e.message } as any;
  }
}

// ========================
// 祝日
// ========================
export async function fetchHolidays(): Promise<ApiResponse<{ holidays: Record<string, string> }>> {
  try {
    const data = await http<ApiResponse<{ holidays: Record<string, string> }>>(
      `${API_BASE_URL}/admin/holidays`
    );
    return data;
  } catch (e: any) {
    console.error('Error fetching holidays:', e);
    return { ok: false, error: e.message };
  }
}

export async function checkHoliday(date: string): Promise<ApiResponse<{ date: string; isHoliday: boolean; holidayName: string | null }>> {
  try {
    const data = await http<ApiResponse<{ date: string; isHoliday: boolean; holidayName: string | null }>>(
      `${API_BASE_URL}/admin/holidays/${encodeURIComponent(date)}`
    );
    return data;
  } catch (e: any) {
    console.error('Error checking holiday:', e);
    return { ok: false, error: e.message } as any;
  }
}

// ========================
// 週次レポート（サーバ実装準拠）
// ========================
export async function fetchWeekly(start?: string): Promise<ApiResponse<{ weekData: any[]; startDate: string }>> {
  try {
    const q = start ? `?start=${encodeURIComponent(start)}` : '';
    const data = await http<ApiResponse<{ weekData: any[]; startDate: string }>>(
      `${API_BASE_URL}/admin/weekly${q}`
    );
    return data;
  } catch (e: any) {
    console.error('Error fetching weekly:', e);
    return { ok: false, error: e.message } as any;
  }
}

// ========================
// セッション
// ========================
export async function saveSession(userData: { code: string; name: string; department: string; rememberMe?: boolean }): Promise<ApiResponse<{ sessionId: string; user: any }>> {
  try {
    const data = await http<ApiResponse<{ sessionId: string; user: any }>>(
      `${API_BASE_URL}/admin/sessions`,
      { method: 'POST', body: JSON.stringify(userData), expectOk: true }
    );
    return data;
  } catch (e: any) {
    console.error('Error saving session:', e);
    return { ok: false, error: e.message } as any;
  }
}

export async function getSession(sessionId: string): Promise<ApiResponse<{ user: any }>> {
  try {
    const data = await http<ApiResponse<{ user: any }>>(
      `${API_BASE_URL}/admin/sessions/${encodeURIComponent(sessionId)}`
    );
    return data;
  } catch (e: any) {
    console.error('Error getting session:', e);
    return { ok: false, error: e.message } as any;
  }
}

export async function deleteSession(sessionId: string): Promise<ApiResponse> {
  try {
    const data = await http<ApiResponse>(
      `${API_BASE_URL}/admin/sessions/${encodeURIComponent(sessionId)}`,
      { method: 'DELETE', expectOk: true }
    );
    return data;
  } catch (e: any) {
    console.error('Error deleting session:', e);
    return { ok: false, error: e.message };
  }
}

// ========================
// 互換エイリアス（既存コード配慮）
// ========================
export const master = fetchMasterData;
export const listDepartments = fetchDepartments;

// まとめ export（AuthContext 等から一括で使えるように）
export const api = {
  // health
  healthCheck,
  // departments
  fetchDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  listDepartments,
  // employees
  fetchEmployees,
  fetchEmployeeByCode,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  // master/attendance
  fetchMasterData,
  master,
  clockIn,
  clockOut,
  saveAttendanceRecord, // 明示的に未実装返す
  // remarks
  saveRemark,
  getRemark,
  getRemarks,
  // holidays / weekly
  fetchHolidays,
  checkHoliday,
  fetchWeekly,
  // sessions
  saveSession,
  getSession,
  deleteSession,
};
