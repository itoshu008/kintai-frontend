// src/types/attendance.ts

export interface Employee {
  id: number;
  code: string;
  name: string;
  department_id?: number | null;
  department?: string;
  dept?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Department {
  id: number;
  name: string;
  sort_order?: number;
  member_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceRecord {
  id: number;
  employee_id: number;
  clock_in: string | null;
  clock_out: string | null;
  late?: number;
  early?: number;
  overtime?: number;
  night?: number;
  note?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MasterRow extends Employee {
  status: '未出勤' | '出勤中' | '退勤済み';
  clock_in?: string | null;
  clock_out?: string | null;
  late?: number;
  early?: number;
  overtime?: number;
  night?: number;
  department_name?: string;
  date?: string; // 月別表示用の日付
}

export interface ApiResponse<T = any> {
  ok?: boolean;
  list?: T[];
  data?: T;
  message?: string;
  error?: string;
  date?: string;
  timestamp?: string;
  remark?: string;
  remarks?: { [key: string]: string };
  employeeCode?: string;
  holidays?: { [key: string]: string };
  isHoliday?: boolean;
  holidayName?: string;
  isWeekend?: boolean;
  isWorkingDay?: boolean;
  dayType?: string;
  count?: number;
}

export interface ClockResponse {
  ok: boolean;
  message: string;
  time?: string;
}

export interface HealthResponse {
  ok: boolean;
  ts: string;
}

export type ApiFunction<T = any, P = any> = (params?: P) => Promise<T>;

export interface ErrorResponse {
  error: {
    code: number;
    message: string;
    timestamp: string;
  };
}
