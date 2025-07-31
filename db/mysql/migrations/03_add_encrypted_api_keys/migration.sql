-- Add encrypted key field to api_key table
ALTER TABLE `api_key` ADD COLUMN `key_encrypted` TEXT NOT NULL;