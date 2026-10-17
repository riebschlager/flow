CREATE TABLE `likes` (
	`track` text NOT NULL,
	`user` text NOT NULL,
	`created` integer NOT NULL,
	`active` integer DEFAULT 1 NOT NULL,
	PRIMARY KEY(`track`, `user`),
	FOREIGN KEY (`track`) REFERENCES `tracks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `likes_created_track` ON `likes` (`created`,`track`);--> statement-breakpoint
CREATE TABLE `tracks` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`title` text NOT NULL,
	`artist` text NOT NULL,
	`object_key` text NOT NULL,
	`created` integer NOT NULL,
	`duration` integer NOT NULL,
	`bytes` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `tracks_created` ON `tracks` (`created`);--> statement-breakpoint
CREATE INDEX `tracks_owner_created` ON `tracks` (`owner`,`created`);--> statement-breakpoint
CREATE TABLE `write_limits` (
	`user` text PRIMARY KEY NOT NULL,
	`window` integer NOT NULL,
	`count` integer NOT NULL
);
