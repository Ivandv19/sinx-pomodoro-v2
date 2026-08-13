CREATE TABLE `account` (
	`id` text PRIMARY KEY NOT NULL,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`userId` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`idToken` text,
	`accessTokenExpiresAt` integer,
	`refreshTokenExpiresAt` integer,
	`scope` text,
	`password` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `account_provider_unique` ON `account` (`accountId`,`providerId`);--> statement-breakpoint
CREATE TABLE `break` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`tipo` text NOT NULL,
	`status` text NOT NULL,
	`minutes_planned` integer NOT NULL,
	`minutes_actual` integer,
	`created_at` integer NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "break_tipo_check" CHECK("break"."tipo" IN ('short', 'long')),
	CONSTRAINT "break_status_check" CHECK("break"."status" IN ('active', 'completed', 'skipped', 'interrupted'))
);
--> statement-breakpoint
CREATE INDEX `idx_break_created_at` ON `break` (`created_at`);--> statement-breakpoint
CREATE INDEX `idx_break_user_id` ON `break` (`user_id`);--> statement-breakpoint
CREATE TABLE `categoria` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_categoria_user_id` ON `categoria` (`user_id`);--> statement-breakpoint
CREATE TABLE `pomodoro` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tarea_id` integer NOT NULL,
	`status` text NOT NULL,
	`minutes_planned` integer DEFAULT 25 NOT NULL,
	`minutes_actual` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`tarea_id`) REFERENCES `tarea`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "pomodoro_status_check" CHECK("pomodoro"."status" IN ('active', 'completed', 'completed_early', 'interrupted'))
);
--> statement-breakpoint
CREATE INDEX `idx_pomodoro_tarea_fecha` ON `pomodoro` (`tarea_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_pomodoro_status` ON `pomodoro` (`status`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`expiresAt` integer NOT NULL,
	`token` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`ipAddress` text,
	`userAgent` text,
	`userId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE TABLE `tarea` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`nombre` text NOT NULL,
	`categoria_id` integer,
	`user_id` text NOT NULL,
	`estado` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	`completed_at` integer,
	FOREIGN KEY (`categoria_id`) REFERENCES `categoria`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "tarea_estado_check" CHECK("tarea"."estado" IN ('pending', 'in_progress', 'done', 'abandoned'))
);
--> statement-breakpoint
CREATE INDEX `idx_tarea_usuario_fecha` ON `tarea` (`user_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_tarea_estado` ON `tarea` (`estado`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text,
	`email` text NOT NULL,
	`emailVerified` integer NOT NULL,
	`image` text,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` integer NOT NULL,
	`createdAt` integer,
	`updatedAt` integer
);
