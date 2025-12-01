import type {
  users,
  festivals,
  transportRequests,
  missions,
  driverAvailabilities,
  realTimeTracking,
  notificationsLog,
  auditLogs
} from '@/lib/db/schema';

// ============================================
// DATABASE TYPES (inferred from Drizzle schema)
// ============================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Festival = typeof festivals.$inferSelect;
export type NewFestival = typeof festivals.$inferInsert;

export type TransportRequest = typeof transportRequests.$inferSelect;
export type NewTransportRequest = typeof transportRequests.$inferInsert;

export type Mission = typeof missions.$inferSelect;
export type NewMission = typeof missions.$inferInsert;

export type DriverAvailability = typeof driverAvailabilities.$inferSelect;
export type NewDriverAvailability = typeof driverAvailabilities.$inferInsert;

export type RealTimeTracking = typeof realTimeTracking.$inferSelect;
export type NewRealTimeTracking = typeof realTimeTracking.$inferInsert;

export type NotificationLog = typeof notificationsLog.$inferSelect;
export type NewNotificationLog = typeof notificationsLog.$inferInsert;

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

// ============================================
// ENUMS
// ============================================

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  FESTIVAL_ADMIN = 'FESTIVAL_ADMIN',
  GENERAL_COORDINATOR = 'GENERAL_COORDINATOR',
  VIP_MANAGER = 'VIP_MANAGER',
  DRIVER_MANAGER = 'DRIVER_MANAGER',
  DRIVER = 'DRIVER',
  VIP = 'VIP',
}

export enum SubscriptionPlan {
  FREE = 'FREE',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  TRIALING = 'TRIALING',
}

export enum TimeSlot {
  MORNING = 'MORNING',
  AFTERNOON = 'AFTERNOON',
  EVENING = 'EVENING',
}

export enum TransportType {
  STATION_TO_VENUE = 'STATION_TO_VENUE',
  VENUE_TO_STATION = 'VENUE_TO_STATION',
  INTRA_CITY = 'INTRA_CITY',
  OTHER = 'OTHER',
}

export enum RequestStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  ACCEPTED = 'ACCEPTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum MissionStatus {
  PROPOSED = 'PROPOSED',
  ACCEPTED = 'ACCEPTED',
  DECLINED = 'DECLINED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export enum AssignmentMethod {
  AUTO = 'AUTO',
  MANUAL = 'MANUAL',
}

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  TELEGRAM = 'TELEGRAM',
  PUSH = 'PUSH',
  DISCORD = 'DISCORD',
  SLACK = 'SLACK',
}

// ============================================
// EXTENDED TYPES (with relations)
// ============================================

export type UserWithFestival = User & {
  festival: Festival;
};

export type TransportRequestWithRelations = TransportRequest & {
  vip: Vip | null;
  createdBy: User;
  festival: Festival;
  missions?: MissionWithDriver[];
};

export type MissionWithDriver = Mission & {
  driver: User;
  assignedBy: User;
};

export type MissionWithDetails = Mission & {
  driver: User;
  transportRequest: TransportRequestWithRelations;
  assignedBy: User;
};

// ============================================
// API TYPES
// ============================================

export interface GeoLocation {
  lat: number;
  lng: number;
  address: string;
}

export interface DistanceResult {
  distanceKm: number;
  durationMinutes: number;
  route?: {
    geometry: any;
    distance: number;
    duration: number;
  };
}

export interface DriverScore {
  driverId: string;
  score: number;
  availabilityScore: number;
  equityScore: number;
  proximityScore: number;
  preferenceScore: number;
  continuityScore: number;
}

// ============================================
// FORM TYPES
// ============================================

export interface CreateTransportRequestForm {
  vipId: string;
  type: TransportType;
  pickupAddress: string;
  dropoffAddress: string;
  requestedDatetime: Date;
  passengerCount?: number;
  notes?: string;
}

export interface CreateFestivalForm {
  name: string;
  slug: string;
  description?: string;
  locationAddress: string;
  startDate: Date;
  endDate: Date;
  timezone?: string;
}

export interface UpdateUserProfileForm {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  preferences?: User['preferences'];
}

export interface SetDriverAvailabilityForm {
  date: Date;
  slot: TimeSlot;
  isAvailable: boolean;
  recurringPattern?: {
    allMornings?: boolean;
    allAfternoons?: boolean;
    allEvenings?: boolean;
  };
}

// ============================================
// PERMISSIONS
// ============================================

export const PERMISSIONS = {
  // Festival Management
  MANAGE_ALL_FESTIVALS: [UserRole.SUPER_ADMIN],
  MANAGE_FESTIVAL: [UserRole.SUPER_ADMIN, UserRole.FESTIVAL_ADMIN, UserRole.GENERAL_COORDINATOR],
  MANAGE_SUBSCRIPTION: [UserRole.SUPER_ADMIN, UserRole.FESTIVAL_ADMIN],

  // User Management
  ASSIGN_ROLES: [UserRole.SUPER_ADMIN, UserRole.FESTIVAL_ADMIN, UserRole.GENERAL_COORDINATOR],
  MANAGE_USERS: [UserRole.SUPER_ADMIN, UserRole.FESTIVAL_ADMIN, UserRole.GENERAL_COORDINATOR],

  // VIP Management
  VIEW_VIPS: [
    UserRole.SUPER_ADMIN,
    UserRole.FESTIVAL_ADMIN,
    UserRole.GENERAL_COORDINATOR,
    UserRole.VIP_MANAGER,
    UserRole.DRIVER_MANAGER,
  ],
  MANAGE_VIPS: [
    UserRole.SUPER_ADMIN,
    UserRole.FESTIVAL_ADMIN,
    UserRole.GENERAL_COORDINATOR,
    UserRole.VIP_MANAGER,
  ],

  // Driver Management
  VIEW_DRIVERS: [
    UserRole.SUPER_ADMIN,
    UserRole.FESTIVAL_ADMIN,
    UserRole.GENERAL_COORDINATOR,
    UserRole.VIP_MANAGER,
    UserRole.DRIVER_MANAGER,
  ],
  MANAGE_AVAILABILITIES: [
    UserRole.SUPER_ADMIN,
    UserRole.FESTIVAL_ADMIN,
    UserRole.GENERAL_COORDINATOR,
    UserRole.DRIVER_MANAGER,
    UserRole.DRIVER, // own availability
  ],
  ACCEPT_DECLINE_MISSIONS: [UserRole.DRIVER],

  // Transport Requests
  CREATE_TRANSPORT_REQUEST: [
    UserRole.SUPER_ADMIN,
    UserRole.FESTIVAL_ADMIN,
    UserRole.GENERAL_COORDINATOR,
    UserRole.VIP_MANAGER,
    UserRole.DRIVER_MANAGER,
    UserRole.VIP,
  ],
  VIEW_ALL_REQUESTS: [
    UserRole.SUPER_ADMIN,
    UserRole.FESTIVAL_ADMIN,
    UserRole.GENERAL_COORDINATOR,
    UserRole.VIP_MANAGER,
    UserRole.DRIVER_MANAGER,
  ],
  MODIFY_REQUEST: [
    UserRole.SUPER_ADMIN,
    UserRole.FESTIVAL_ADMIN,
    UserRole.GENERAL_COORDINATOR,
    UserRole.VIP_MANAGER,
  ],

  // Mission Assignment
  ASSIGN_DRIVERS: [
    UserRole.SUPER_ADMIN,
    UserRole.FESTIVAL_ADMIN,
    UserRole.GENERAL_COORDINATOR,
    UserRole.DRIVER_MANAGER,
  ],
  CONFIGURE_AUTO_ASSIGNMENT: [
    UserRole.SUPER_ADMIN,
    UserRole.FESTIVAL_ADMIN,
    UserRole.GENERAL_COORDINATOR,
    UserRole.DRIVER_MANAGER,
  ],

  // Tracking
  SHARE_LOCATION: [UserRole.DRIVER],
  VIEW_DRIVER_LOCATION: [
    UserRole.SUPER_ADMIN,
    UserRole.FESTIVAL_ADMIN,
    UserRole.GENERAL_COORDINATOR,
    UserRole.VIP_MANAGER,
    UserRole.DRIVER_MANAGER,
    UserRole.VIP, // own driver
  ],
  VIEW_REAL_TIME_TRACKING: [
    UserRole.SUPER_ADMIN,
    UserRole.FESTIVAL_ADMIN,
    UserRole.GENERAL_COORDINATOR,
    UserRole.VIP_MANAGER,
    UserRole.DRIVER_MANAGER,
    UserRole.VIP,
  ],

  // Settings
  CONFIGURE_BUFFER_TIME: [
    UserRole.SUPER_ADMIN,
    UserRole.FESTIVAL_ADMIN,
    UserRole.GENERAL_COORDINATOR,
    UserRole.DRIVER_MANAGER,
  ],

  // Analytics
  VIEW_ANALYTICS: [
    UserRole.SUPER_ADMIN,
    UserRole.FESTIVAL_ADMIN,
    UserRole.GENERAL_COORDINATOR,
    UserRole.VIP_MANAGER,
    UserRole.DRIVER_MANAGER,
  ],
} as const;

// ============================================
// UTILITY TYPES
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// NOTIFICATION TYPES
// ============================================

export interface NotificationPayload {
  userId: string;
  channels: NotificationChannel[];
  type: string;
  subject?: string;
  message: string;
  data?: Record<string, any>;
}

export interface EmailNotification {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SmsNotification {
  to: string;
  body: string;
}

export interface TelegramNotification {
  chatId: string;
  text: string;
  parseMode?: 'Markdown' | 'HTML';
}

// ============================================
// SUBSCRIPTION LIMITS
// ============================================

export const SUBSCRIPTION_LIMITS = {
  [SubscriptionPlan.FREE]: {
    maxVips: 20,
    maxDrivers: 5,
    maxFestivals: 1,
    autoAssignment: false,
    realTimeTracking: false,
    smsNotifications: false,
    advancedAnalytics: false,
    apiAccess: false,
  },
  [SubscriptionPlan.PRO]: {
    maxVips: 100,
    maxDrivers: 20,
    maxFestivals: 1,
    autoAssignment: true,
    realTimeTracking: true,
    smsNotifications: true,
    advancedAnalytics: true,
    apiAccess: false,
  },
  [SubscriptionPlan.ENTERPRISE]: {
    maxVips: Infinity,
    maxDrivers: Infinity,
    maxFestivals: Infinity,
    autoAssignment: true,
    realTimeTracking: true,
    smsNotifications: true,
    advancedAnalytics: true,
    apiAccess: true,
  },
} as const;
