// frontend/src/utils/flags.ts
declare global {
  interface Window { isPreview?: boolean }
}

// ESMでも安全に評価される実行時フラグ
export const IS_PREVIEW: boolean =
  (typeof window !== 'undefined' && window.isPreview === true) ||
  (typeof import.meta !== 'undefined' &&
   (import.meta as any).env?.VITE_IS_PREVIEW === 'true');
