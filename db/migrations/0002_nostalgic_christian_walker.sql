CREATE TABLE `task_tags` (
	`created_at` text NOT NULL,
	`name` text NOT NULL,
	`name_normalized` text NOT NULL,
	`task_id` text NOT NULL,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_task_tags_name_normalized` ON `task_tags` (`name_normalized`);--> statement-breakpoint
CREATE INDEX `idx_task_tags_task_id` ON `task_tags` (`task_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `task_tags_task_id_name_normalized_unique` ON `task_tags` (`task_id`,`name_normalized`);