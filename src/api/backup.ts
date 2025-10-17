import { request } from '../lib/request';

const BASE = "/api";

export interface BackupInfo {
  id: string;
  timestamp: string;
  size: number;
}

export interface BackupData {
  id: string;
  timestamp: string;
  employees: any[];
  departments: any[];
  attendance: Record<string, any>;
  holidays: Record<string, string>;
  remarks: Record<string, string>;
}

export const backupApi = {
  // バックアップ作成
  createBackup: async (): Promise<{ ok: boolean; backupId: string; timestamp: string; message: string }> => {
    const response = await request(`${BASE}/admin/backup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ reason: 'manual' }),
    });
    return response;
  },

  // バックアップ一覧取得
  getBackups: async (): Promise<{ ok: boolean; backups: BackupInfo[] }> => {
    const response = await request(`${BASE}/admin/backups`, {
      method: 'GET',
    });
    return response;
  },

  // バックアップ詳細取得
  getBackupDetail: async (backupId: string): Promise<{ ok: boolean; backup: BackupData }> => {
    const response = await request(`${BASE}/admin/backups/${backupId}`, {
      method: 'GET',
    });
    return response;
  },

  // バックアッププレビュー（見るだけモード）
  getBackupPreview: async (backupId: string): Promise<{ ok: boolean; preview: boolean; backup: BackupData; message: string }> => {
    const response = await request(`${BASE}/admin/backups/${backupId}/preview`, {
      method: 'GET',
    });
    return response;
  },

  // バックアップから復元
  restoreBackup: async (backupId: string): Promise<{ ok: boolean; message: string; restoredAt: string }> => {
    const response = await request(`${BASE}/admin/backups/${backupId}/restore`, {
      method: 'POST',
    });
    return response;
  },

  // バックアップ削除
  deleteBackup: async (backupId: string): Promise<{ ok: boolean; message: string }> => {
    const response = await request(`${BASE}/admin/backups/${backupId}`, {
      method: 'DELETE',
    });
    return response;
  },

  // 古いバックアップをクリーンアップ
  cleanupBackups: async (maxKeep: number = 10): Promise<{ ok: boolean; message: string; deletedCount: number; remainingCount: number }> => {
    const response = await request(`${BASE}/admin/backups/cleanup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ maxKeep }),
    });
    return response;
  },
};
