import type { Category, SourceType } from '../types'

export const SOURCE_TYPES: { key: SourceType; label: string; icon: string }[] = [
  { key: 'job', label: 'Работа', icon: 'Briefcase' },
  { key: 'side', label: 'Подработка', icon: 'Bike' },
  { key: 'project', label: 'Проект', icon: 'Rocket' },
  { key: 'business', label: 'Бизнес', icon: 'Building2' },
  { key: 'invest', label: 'Инвестиции', icon: 'TrendingUp' },
  { key: 'other', label: 'Другое', icon: 'Sparkles' },
]

export function sourceTypeLabel(t: SourceType): string {
  return SOURCE_TYPES.find((x) => x.key === t)?.label ?? 'Другое'
}

// Самые распространённые категории расходов — пользователь может добавлять свои.
export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'c-food', name: 'Продукты', icon: 'ShoppingCart', color: '#22C55E' },
  { id: 'c-rest', name: 'Рестораны', icon: 'Utensils', color: '#F97316' },
  { id: 'c-cafe', name: 'Кафе', icon: 'Coffee', color: '#A16207' },
  { id: 'c-home', name: 'Дом', icon: 'House', color: '#3B82F6' },
  { id: 'c-util', name: 'Коммуналка', icon: 'Zap', color: '#EAB308' },
  { id: 'c-car', name: 'Авто', icon: 'Car', color: '#EF4444' },
  { id: 'c-fuel', name: 'Бензин', icon: 'Fuel', color: '#DC2626' },
  { id: 'c-transport', name: 'Транспорт', icon: 'Bus', color: '#0EA5E9' },
  { id: 'c-phone', name: 'Связь', icon: 'Smartphone', color: '#6366F1' },
  { id: 'c-health', name: 'Здоровье', icon: 'HeartPulse', color: '#EC4899' },
  { id: 'c-clothes', name: 'Одежда', icon: 'Shirt', color: '#A855F7' },
  { id: 'c-fun', name: 'Развлечения', icon: 'Gamepad2', color: '#14B8A6' },
  { id: 'c-subs', name: 'Подписки', icon: 'Tv', color: '#8B5CF6' },
  { id: 'c-travel', name: 'Путешествия', icon: 'Plane', color: '#06B6D4' },
  { id: 'c-sport', name: 'Спорт', icon: 'Dumbbell', color: '#84CC16' },
  { id: 'c-beauty', name: 'Красота', icon: 'Scissors', color: '#F472B6' },
  { id: 'c-gifts', name: 'Подарки', icon: 'Gift', color: '#E11D48' },
  { id: 'c-edu', name: 'Обучение', icon: 'GraduationCap', color: '#2563EB' },
  { id: 'c-kids', name: 'Дети', icon: 'Baby', color: '#FB923C' },
  { id: 'c-pets', name: 'Питомцы', icon: 'PawPrint', color: '#78716C' },
  { id: 'c-credit', name: 'Кредиты', icon: 'CreditCard', color: '#64748B' },
  { id: 'c-other', name: 'Другое', icon: 'Receipt', color: '#94A3B8' },
]
