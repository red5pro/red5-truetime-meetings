export const USER_ROLES = {
  ADMIN: 'admin',
  PUBLISHER: 'publisher',
  SUBSCRIBER: 'subscriber',
  MODERATOR: 'moderator',
  GUEST: 'guest',
  USER: 'user',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];
