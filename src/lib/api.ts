// frontend/src/lib/api.ts
// 型付きのAPIヘルパ（再取得用）

export interface MasterData {
  ok: boolean;
  employees: Employee[];
  departments: Department[];
  attendance: any[];
  remarks: any[];
}

export interface Employee {
  code: string;
  name: string;
  department_id: number;
  created_at?: string;
  updated_at?: string;
}

export interface Department {
  id: number;
  name: string;
}

export interface CreateEmployeeResponse {
  ok: boolean;
  employee: Employee;
  message: string;
}

export async function getMaster(date: string): Promise<MasterData> {
  const r = await fetch(`/api/admin/master?date=${encodeURIComponent(date)}`);
  if (!r.ok) throw new Error(`master ${r.status}`);
  return r.json() as Promise<MasterData>;
}

export async function createEmployee(body: {code: string; name: string; department_id: number}): Promise<CreateEmployeeResponse> {
  const r = await fetch('/api/admin/employees', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(body)
  });
  const j = await r.json();
  if (!r.ok || j.ok === false) throw new Error(j.message || '登録に失敗しました');
  return j as CreateEmployeeResponse;
}

export async function checkEmployeeExists(code: string): Promise<{ok: boolean; code: string; exists: boolean}> {
  const r = await fetch(`/api/admin/employees/${encodeURIComponent(code)}/exists`);
  if (!r.ok) throw new Error(`check exists ${r.status}`);
  return r.json();
}
