-- Add estimation support for Scrum planning.
ALTER TABLE "Task" ADD COLUMN "storyPoints" INTEGER NOT NULL DEFAULT 0;
