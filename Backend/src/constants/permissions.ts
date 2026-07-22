export const PERMISSIONS = {
  // Plant permissions
  CREATE_PLANT: 'create_plant',
  EDIT_PLANT: 'edit_plant',
  DELETE_PLANT: 'delete_plant',
  VIEW_PLANT: 'view_plant',
  
  // Department permissions
  CREATE_DEPARTMENT: 'create_department',
  EDIT_DEPARTMENT: 'edit_department',
  DELETE_DEPARTMENT: 'delete_department',
  VIEW_DEPARTMENT: 'view_department',
  
  // User permissions
  CREATE_USER: 'create_user',
  EDIT_USER: 'edit_user',
  DELETE_USER: 'delete_user',
  VIEW_USER: 'view_user',
  
  // File permissions
  UPLOAD_FILE: 'upload_file',
  DOWNLOAD_FILE: 'download_file',
  DELETE_FILE: 'delete_file',
  EDIT_FILE: 'edit_file',
  SHARE_FILE: 'share_file',
  VIEW_FILE: 'view_file'
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];