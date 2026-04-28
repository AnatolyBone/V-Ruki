import { supabase } from '../lib/supabase';

export const logSecurityEvent = async (context: string, message: string, userId?: string) => {
  const logData = {
    user_id: userId,
    context,
    message,
    user_agent: navigator.userAgent,
    // IP на фронте получить нельзя без внешних сервисов
  };

  console.warn(`[Security Event] ${context}: ${message}`);

  // Попытка записи в БД (сработает, если таблица создана)
  try {
    await supabase.from('security_logs').insert([logData]);
  } catch (e) {
    // Тихо игнорируем, если таблицы нет
  }
};
