export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  PLANT_ADMIN: 'PLANT_ADMIN',
  DEPARTMENT_HEAD: 'DEPARTMENT_HEAD',
  EMPLOYEE: 'EMPLOYEE',
  VIEWER: 'VIEWER'
} as const;

export type Role = typeof ROLES[keyof typeof ROLES];

export const ROLE_HIERARCHY: Record<Role, number> = {
  SUPER_ADMIN: 5,
  PLANT_ADMIN: 4,
  DEPARTMENT_HEAD: 3,
  EMPLOYEE: 2,
  VIEWER: 1
};

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  SUPER_ADMIN: ['*'],
  PLANT_ADMIN: ['manage_plant', 'manage_department', 'manage_user', 'manage_file'],
  DEPARTMENT_HEAD: ['manage_department', 'manage_user', 'manage_file'],
  EMPLOYEE: ['view_file', 'upload_file'],
  VIEWER: ['view_file']
};