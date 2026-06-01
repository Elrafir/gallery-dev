/**
 * Location Processor Utility
 * 
 * Этот файл предназначен для предварительной обработки результатов выборки адресов.
 * Здесь будут методы для различных преобразований локаций:
 * - Подмены и исправления названий
 * - Комбинирование разных полей (city, state, country)
 * - Нормализация форматов
 * - Фильтрация невалидных данных
 * 
 * Методы будут добавляться по мере необходимости.
 */

export interface LocationResult {
  city: string | null;
  state: string | null;
  country: string | null;
}

export interface ProcessedLocationResult extends LocationResult {
  // Дополнительные поля могут быть добавлены позже
  original?: LocationResult;
  processed: boolean;
}

/**
 * Главная функция для предварительной обработки локации
 * @param location - исходные данные локации из asset_exif
 * @returns обработанные данные локации
 */
export function processLocation(location: LocationResult): ProcessedLocationResult {
  // Базовая обработка - заготовка для будущей логики
  const processed: ProcessedLocationResult = {
    city: location.city,
    state: location.state,
    country: location.country,
    original: { ...location },
    processed: false,
  };

  // TODO: Добавить логику обработки по мере необходимости:
  // - Подмены названий
  // - Комбинирование полей
  // - Нормализация
  // - Валидация

  return processed;
}

/**
 * Обработка массива локаций
 * @param locations - массив исходных локаций
 * @returns массив обработанных локаций
 */
export function processLocations(locations: LocationResult[]): ProcessedLocationResult[] {
  return locations.map(location => processLocation(location));
}

/**
 * Проверка валидности локации
 * @param location - данные локации для проверки
 * @returns true если локация валидна, false в противном случае
 */
export function isValidLocation(location: LocationResult): boolean {
  // Базовая проверка - хотя бы одно поле должно быть заполнено
  return !!(location.city || location.state || location.country);
}

/**
 * Нормализация локации (приведение к стандартному формату)
 * @param location - исходные данные локации
 * @returns нормализованные данные локации
 */
export function normalizeLocation(location: LocationResult): LocationResult {
  return {
    city: location.city?.trim() || null,
    state: location.state?.trim() || null,
    country: location.country?.trim() || null,
  };
}

/**
 * Формирование полного адреса из компонентов
 * @param location - данные локации
 * @returns строка с полным адресом
 */
export function formatFullAddress(location: LocationResult): string {
  const parts = [location.city, location.state, location.country].filter(Boolean);
  return parts.join(', ');
}
