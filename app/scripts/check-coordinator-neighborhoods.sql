-- Check Activist Coordinator neighborhood assignments
-- Replace 'activist.coordinator@telaviv.test' with the actual email

SELECT
  u.id as user_id,
  u.email,
  u.full_name,
  ac.id as coordinator_id,
  acn.neighborhood_id,
  n.name as neighborhood_name,
  c.name as city_name
FROM users u
LEFT JOIN activist_coordinators ac ON ac.user_id = u.id
LEFT JOIN activist_coordinator_neighborhoods acn ON acn.legacy_activist_coordinator_user_id = u.id
LEFT JOIN neighborhoods n ON n.id = acn.neighborhood_id AND n.city_id = acn.city_id
LEFT JOIN cities c ON c.id = n.city_id
WHERE u.role = 'ACTIVIST_COORDINATOR'
ORDER BY u.email;
