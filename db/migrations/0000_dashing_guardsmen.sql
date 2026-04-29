CREATE TABLE `todo_lists` (
	`created_at` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`name_normalized` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `todo_lists_name_normalized_unique` ON `todo_lists` (`name_normalized`);