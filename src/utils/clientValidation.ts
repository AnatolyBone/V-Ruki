/**
 * ВНИМАНИЕ: Это клиентская валидация для улучшения UX.
 * Настоящая безопасность реализована на уровне Supabase RLS и SQL Constraints.
 */

/**
 * Валидация текста (дублирует SQL Constraints для UX)
 */
export const validateListingText = (title: string, description: string) => {
  if (title.length < 10) return 'Заголовок должен быть не менее 10 символов';
  if (title.length > 100) return 'Заголовок слишком длинный';
  if (description.length < 30) return 'Описание должно быть не менее 30 символов';
  if (description.length > 3000) return 'Описание слишком длинное';
  return null;
};

/**
 * Проверка изображений (клиентская)
 */
export const validateImage = (file: File) => {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  
  const envLimit = import.meta.env.VITE_MAX_FILE_SIZE;
  const maxSize = envLimit ? parseInt(envLimit) : 5 * 1024 * 1024;

  if (!validTypes.includes(file.type)) return 'Разрешены только JPG, PNG и WEBP';
  if (file.size > maxSize) {
    const sizeInMb = Math.round(maxSize / (1024 * 1024));
    return `Размер фото не должен превышать ${sizeInMb}МБ`;
  }
  return null;
};

/**
 * Анти-дребезг (debounce) для кнопок, не является защитой API
 */
const actionTimestamps: Record<string, number> = {};

export const preventDoubleClick = (action: string, cooldownMs: number = 2000) => {
  const now = Date.now();
  if (actionTimestamps[action] && now - actionTimestamps[action] < cooldownMs) {
    return false;
  }
  actionTimestamps[action] = now;
  return true;
};
