-- Seed default cold rooms so temperature recording and dashboard status work
INSERT IGNORE INTO `cold_rooms` (`id`, `name`, `temperature`, `humidity`, `status`, `zone_type`, `created_at`)
VALUES
  ('coldroom1', 'Cold Room 1', 5.0, 90, 'Optimal', 'Fruit', CURRENT_TIMESTAMP(0)),
  ('coldroom2', 'Cold Room 2', 5.0, 90, 'Optimal', 'Fruit', CURRENT_TIMESTAMP(0));
