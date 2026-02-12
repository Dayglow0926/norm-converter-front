// child-info feature public API
// 아동 정보 입력 기능

// UI
export { ChildInfoForm } from './ui/ChildInfoForm';

// Model (Store)
export { useChildInfoStore } from './model/store';

// Model (Schema)
export { childInfoSchema, type ChildInfoFormData } from './model/schema';

// Lib (Utilities)
export { calculateAge, formatAgeResult } from './lib/calculate-age';
