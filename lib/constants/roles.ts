export const ROLES = {
  RESIDENT: 'resident',
  HOUSE_COMMITTEE: 'house_committee',
  AREA_MANAGER: 'area_manager',
} as const;

export const ROLE_HIERARCHY = {
  resident: 1,
  house_committee: 2,
  area_manager: 3,
} as const;
