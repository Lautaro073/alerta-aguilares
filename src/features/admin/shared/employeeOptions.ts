export const EMPLOYEE_ROLE_VALUES = ['operator', 'official', 'admin'] as const;
export type EmployeeRole = (typeof EMPLOYEE_ROLE_VALUES)[number];

export const EMPLOYEE_AREA_VALUES = ['monitoring', 'traffic', 'urban_guard', 'public_works'] as const;
export type EmployeeArea = (typeof EMPLOYEE_AREA_VALUES)[number];

export const EMPLOYEE_SHIFT_VALUES = ['morning', 'afternoon', 'night', 'rotating'] as const;
export type EmployeeShift = (typeof EMPLOYEE_SHIFT_VALUES)[number];

export const EMPLOYEE_ROLE_OPTIONS: Array<{ value: EmployeeRole; label: string }> = [
  { value: 'operator', label: 'Operario de campo' },
  { value: 'official', label: 'Funcionario municipal' },
  { value: 'admin', label: 'Administrador' },
];

export const EMPLOYEE_AREA_OPTIONS: Array<{ value: EmployeeArea; label: string }> = [
  { value: 'monitoring', label: 'Monitoreo Central' },
  { value: 'traffic', label: 'Transito' },
  { value: 'public_works', label: 'Obras Publicas' },
];

export const EMPLOYEE_SHIFT_OPTIONS: Array<{ value: EmployeeShift; label: string }> = [
  { value: 'morning', label: 'Mañana (06:00 - 14:00)' },
  { value: 'afternoon', label: 'Tarde (14:00 - 22:00)' },
  { value: 'night', label: 'Noche (22:00 - 06:00)' },
  { value: 'rotating', label: 'Rotativo' },
];
