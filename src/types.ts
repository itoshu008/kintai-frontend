export type DailyRow = {
  employee_id: number;
  name: string;
  dept: string | null;
  clock_in: string | null;
  clock_out: string | null;
  minutes_worked: number;
  minutes_late: number;
  minutes_early: number;
  minutes_overtime: number;
  minutes_night: number;
};

export type WeeklyRow = {
  employee_id: number;
  name: string;
  dept: string | null;
  minutes_worked: number;
  minutes_late: number;
  minutes_early: number;
  minutes_overtime_week: number;
};