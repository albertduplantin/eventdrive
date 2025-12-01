import { pgTable, uuid, varchar, text, timestamp, boolean, integer, pgEnum, jsonb, decimal, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ============================================
// ENUMS
// ============================================

export const userRoleEnum = pgEnum('user_role', [
  'SUPER_ADMIN',
  'FESTIVAL_ADMIN',
  'GENERAL_COORDINATOR',
  'VIP_MANAGER',
  'DRIVER_MANAGER',
  'DRIVER',
  'VIP',
]);

export const subscriptionPlanEnum = pgEnum('subscription_plan', [
  'FREE',
  'PRO',
  'ENTERPRISE',
]);

export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'ACTIVE',
  'CANCELLED',
  'EXPIRED',
  'TRIALING',
]);

export const timeSlotEnum = pgEnum('time_slot', [
  'MORNING',
  'AFTERNOON',
  'EVENING',
]);

export const transportTypeEnum = pgEnum('transport_type', [
  'STATION_TO_VENUE',
  'VENUE_TO_STATION',
  'INTRA_CITY',
  'OTHER',
]);

export const requestStatusEnum = pgEnum('request_status', [
  'PENDING',
  'ASSIGNED',
  'ACCEPTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]);

export const missionStatusEnum = pgEnum('mission_status', [
  'PROPOSED',
  'ACCEPTED',
  'DECLINED',
  'IN_PROGRESS',
  'COMPLETED',
]);

export const assignmentMethodEnum = pgEnum('assignment_method', [
  'AUTO',
  'MANUAL',
]);

export const notificationChannelEnum = pgEnum('notification_channel', [
  'EMAIL',
  'SMS',
  'TELEGRAM',
  'PUSH',
  'DISCORD',
  'SLACK',
]);

// ============================================
// TABLES
// ============================================

// Super Admins (global table)
export const superAdmins = pgTable('super_admins', {
  id: uuid('id').defaultRandom().primaryKey(),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Festivals (multi-tenant parent)
export const festivals = pgTable('festivals', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  description: text('description'),

  // Location (geocoded)
  locationAddress: text('location_address'),
  locationLat: decimal('location_lat', { precision: 10, scale: 8 }),
  locationLng: decimal('location_lng', { precision: 11, scale: 8 }),

  // Dates
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  timezone: varchar('timezone', { length: 100 }).default('Europe/Paris'),

  // Settings (JSONB)
  settings: jsonb('settings').$type<{
    bufferTimeMinutes?: number;
    morningSlot?: { start: string; end: string };
    afternoonSlot?: { start: string; end: string };
    eveningSlot?: { start: string; end: string };
    autoAssignmentEnabled?: boolean;
    requireDriverApproval?: boolean;
  }>().default({}),

  // Subscription
  subscriptionPlan: subscriptionPlanEnum('subscription_plan').default('FREE').notNull(),
  subscriptionStatus: subscriptionStatusEnum('subscription_status').default('ACTIVE').notNull(),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  subscriptionEndsAt: timestamp('subscription_ends_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  slugIdx: index('festivals_slug_idx').on(table.slug),
}));

// Users (multi-tenant)
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  festivalId: uuid('festival_id').references(() => festivals.id, { onDelete: 'cascade' }).notNull(),
  clerkUserId: varchar('clerk_user_id', { length: 255 }).notNull(),

  // Profile
  email: varchar('email', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  phone: varchar('phone', { length: 50 }),
  avatarUrl: text('avatar_url'),

  // Role
  role: userRoleEnum('role').notNull(),

  // Address (optional, for drivers)
  address: text('address'),
  geocodedLat: decimal('geocoded_lat', { precision: 10, scale: 8 }),
  geocodedLng: decimal('geocoded_lng', { precision: 11, scale: 8 }),

  // Preferences (JSONB)
  preferences: jsonb('preferences').$type<{
    notificationChannels?: ('EMAIL' | 'SMS' | 'TELEGRAM' | 'PUSH' | 'DISCORD' | 'SLACK')[];
    telegramChatId?: string;
    discordWebhook?: string;
    slackWebhook?: string;
    preferredMissionTypes?: ('STATION_TO_VENUE' | 'VENUE_TO_STATION' | 'INTRA_CITY' | 'OTHER')[];
    language?: string;
  }>().default({}),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  festivalIdIdx: index('users_festival_id_idx').on(table.festivalId),
  clerkUserIdIdx: index('users_clerk_user_id_idx').on(table.clerkUserId),
  roleIdx: index('users_role_idx').on(table.role),
}));

// VIPs (multi-tenant)
export const vips = pgTable('vips', {
  id: uuid('id').defaultRandom().primaryKey(),
  festivalId: uuid('festival_id').references(() => festivals.id, { onDelete: 'cascade' }).notNull(),

  // Profile
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 50 }),
  organization: varchar('organization', { length: 255 }),
  title: varchar('title', { length: 255 }),
  category: varchar('category', { length: 100 }),
  notes: text('notes'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  festivalIdIdx: index('vips_festival_id_idx').on(table.festivalId),
}));

// Driver Availabilities
export const driverAvailabilities = pgTable('driver_availabilities', {
  id: uuid('id').defaultRandom().primaryKey(),
  driverId: uuid('driver_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  festivalId: uuid('festival_id').references(() => festivals.id, { onDelete: 'cascade' }).notNull(),

  date: timestamp('date').notNull(),
  slot: timeSlotEnum('slot').notNull(),
  isAvailable: boolean('is_available').default(true).notNull(),

  // Recurring pattern (optional)
  recurringPattern: jsonb('recurring_pattern').$type<{
    allMornings?: boolean;
    allAfternoons?: boolean;
    allEvenings?: boolean;
    daysOfWeek?: number[]; // 0-6 (Sunday-Saturday)
  }>(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  driverIdIdx: index('driver_avail_driver_id_idx').on(table.driverId),
  dateSlotIdx: index('driver_avail_date_slot_idx').on(table.date, table.slot),
}));

// Transport Requests (demandes de transport)
export const transportRequests = pgTable('transport_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  festivalId: uuid('festival_id').references(() => festivals.id, { onDelete: 'cascade' }).notNull(),
  vipId: uuid('vip_id').references(() => vips.id, { onDelete: 'cascade' }).notNull(),
  createdById: uuid('created_by_id').references(() => users.id).notNull(),

  // Request details
  type: transportTypeEnum('type').notNull(),

  // Locations
  pickupAddress: text('pickup_address').notNull(),
  pickupLat: decimal('pickup_lat', { precision: 10, scale: 8 }),
  pickupLng: decimal('pickup_lng', { precision: 11, scale: 8 }),

  dropoffAddress: text('dropoff_address').notNull(),
  dropoffLat: decimal('dropoff_lat', { precision: 10, scale: 8 }),
  dropoffLng: decimal('dropoff_lng', { precision: 11, scale: 8 }),

  // Timing
  requestedDatetime: timestamp('requested_datetime').notNull(),
  estimatedDurationMinutes: integer('estimated_duration_minutes'), // Auto-calculated via API
  manualDurationOverride: integer('manual_duration_override'), // Manual adjustment
  actualDurationMinutes: integer('actual_duration_minutes'), // Filled after completion

  // Additional info
  passengerCount: integer('passenger_count').default(1),
  notes: text('notes'),

  // Status
  status: requestStatusEnum('status').default('PENDING').notNull(),

  // Cancellation
  cancelledById: uuid('cancelled_by_id').references(() => users.id),
  cancelledAt: timestamp('cancelled_at'),
  cancellationReason: text('cancellation_reason'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  festivalIdIdx: index('transport_req_festival_id_idx').on(table.festivalId),
  vipIdIdx: index('transport_req_vip_id_idx').on(table.vipId),
  statusIdx: index('transport_req_status_idx').on(table.status),
  datetimeIdx: index('transport_req_datetime_idx').on(table.requestedDatetime),
}));

// Missions (affectations chauffeur ↔ transport_request)
export const missions = pgTable('missions', {
  id: uuid('id').defaultRandom().primaryKey(),
  transportRequestId: uuid('transport_request_id').references(() => transportRequests.id, { onDelete: 'cascade' }).notNull(),
  driverId: uuid('driver_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  assignedById: uuid('assigned_by_id').references(() => users.id).notNull(),

  // Assignment details
  assignmentMethod: assignmentMethodEnum('assignment_method').notNull(),
  assignmentScore: decimal('assignment_score', { precision: 5, scale: 2 }), // Algorithm score if auto

  // Status
  status: missionStatusEnum('status').default('PROPOSED').notNull(),

  // Timing
  acceptedAt: timestamp('accepted_at'),
  declinedAt: timestamp('declined_at'),
  declinedReason: text('declined_reason'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  transportReqIdx: index('missions_transport_req_idx').on(table.transportRequestId),
  driverIdIdx: index('missions_driver_id_idx').on(table.driverId),
  statusIdx: index('missions_status_idx').on(table.status),
}));

// Real-time Tracking (GPS positions)
export const realTimeTracking = pgTable('real_time_tracking', {
  id: uuid('id').defaultRandom().primaryKey(),
  missionId: uuid('mission_id').references(() => missions.id, { onDelete: 'cascade' }).notNull(),
  driverId: uuid('driver_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),

  lat: decimal('lat', { precision: 10, scale: 8 }).notNull(),
  lng: decimal('lng', { precision: 11, scale: 8 }).notNull(),
  accuracy: decimal('accuracy', { precision: 6, scale: 2 }), // meters
  heading: decimal('heading', { precision: 5, scale: 2 }), // degrees
  speed: decimal('speed', { precision: 6, scale: 2 }), // km/h

  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => ({
  missionIdIdx: index('tracking_mission_id_idx').on(table.missionId),
  timestampIdx: index('tracking_timestamp_idx').on(table.timestamp),
}));

// Notifications Log
export const notificationsLog = pgTable('notifications_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),

  channel: notificationChannelEnum('channel').notNull(),
  type: varchar('type', { length: 100 }).notNull(), // e.g., 'MISSION_ASSIGNED', 'MISSION_CANCELLED'

  content: jsonb('content').$type<{
    subject?: string;
    message?: string;
    data?: Record<string, any>;
  }>().notNull(),

  sentAt: timestamp('sent_at').defaultNow().notNull(),
  status: varchar('status', { length: 50 }).default('sent').notNull(), // 'sent', 'failed'
  errorMessage: text('error_message'),
}, (table) => ({
  userIdIdx: index('notif_log_user_id_idx').on(table.userId),
  sentAtIdx: index('notif_log_sent_at_idx').on(table.sentAt),
}));

// Audit Logs (traceability)
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  festivalId: uuid('festival_id').references(() => festivals.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),

  action: varchar('action', { length: 100 }).notNull(), // e.g., 'mission_assigned', 'vip_created'
  entityType: varchar('entity_type', { length: 100 }).notNull(), // e.g., 'mission', 'transport_request'
  entityId: uuid('entity_id').notNull(),

  oldData: jsonb('old_data'),
  newData: jsonb('new_data'),

  timestamp: timestamp('timestamp').defaultNow().notNull(),
}, (table) => ({
  festivalIdIdx: index('audit_festival_id_idx').on(table.festivalId),
  timestampIdx: index('audit_timestamp_idx').on(table.timestamp),
  entityIdx: index('audit_entity_idx').on(table.entityType, table.entityId),
}));

// ============================================
// RELATIONS
// ============================================

export const festivalsRelations = relations(festivals, ({ many }) => ({
  users: many(users),
  vips: many(vips),
  transportRequests: many(transportRequests),
  driverAvailabilities: many(driverAvailabilities),
  auditLogs: many(auditLogs),
}));

export const vipsRelations = relations(vips, ({ one }) => ({
  festival: one(festivals, {
    fields: [vips.festivalId],
    references: [festivals.id],
  }),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  festival: one(festivals, {
    fields: [users.festivalId],
    references: [festivals.id],
  }),
  driverAvailabilities: many(driverAvailabilities),
  transportRequestsAsVip: many(transportRequests, { relationName: 'vip' }),
  transportRequestsCreated: many(transportRequests, { relationName: 'creator' }),
  missionsAsDriver: many(missions, { relationName: 'driver' }),
  missionsAssigned: many(missions, { relationName: 'assigner' }),
  trackingData: many(realTimeTracking),
  notifications: many(notificationsLog),
}));

export const driverAvailabilitiesRelations = relations(driverAvailabilities, ({ one }) => ({
  driver: one(users, {
    fields: [driverAvailabilities.driverId],
    references: [users.id],
  }),
  festival: one(festivals, {
    fields: [driverAvailabilities.festivalId],
    references: [festivals.id],
  }),
}));

export const transportRequestsRelations = relations(transportRequests, ({ one, many }) => ({
  festival: one(festivals, {
    fields: [transportRequests.festivalId],
    references: [festivals.id],
  }),
  vip: one(users, {
    fields: [transportRequests.vipId],
    references: [users.id],
    relationName: 'vip',
  }),
  createdBy: one(users, {
    fields: [transportRequests.createdById],
    references: [users.id],
    relationName: 'creator',
  }),
  cancelledBy: one(users, {
    fields: [transportRequests.cancelledById],
    references: [users.id],
  }),
  missions: many(missions),
}));

export const missionsRelations = relations(missions, ({ one, many }) => ({
  transportRequest: one(transportRequests, {
    fields: [missions.transportRequestId],
    references: [transportRequests.id],
  }),
  driver: one(users, {
    fields: [missions.driverId],
    references: [users.id],
    relationName: 'driver',
  }),
  assignedBy: one(users, {
    fields: [missions.assignedById],
    references: [users.id],
    relationName: 'assigner',
  }),
  trackingData: many(realTimeTracking),
}));

export const realTimeTrackingRelations = relations(realTimeTracking, ({ one }) => ({
  mission: one(missions, {
    fields: [realTimeTracking.missionId],
    references: [missions.id],
  }),
  driver: one(users, {
    fields: [realTimeTracking.driverId],
    references: [users.id],
  }),
}));

export const notificationsLogRelations = relations(notificationsLog, ({ one }) => ({
  user: one(users, {
    fields: [notificationsLog.userId],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  festival: one(festivals, {
    fields: [auditLogs.festivalId],
    references: [festivals.id],
  }),
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));
