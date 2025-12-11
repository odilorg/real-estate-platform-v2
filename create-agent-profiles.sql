-- Create Agent profiles for existing users with AGENT role
-- This will create agent profiles for users who don't have them yet

INSERT INTO "Agent" (
  id,
  "userId",
  "firstName",
  "lastName",
  email,
  phone,
  verified,
  "superAgent",
  rating,
  "reviewCount",
  "yearsExperience",
  "totalDeals",
  "showPhone",
  "showEmail",
  "createdAt",
  "updatedAt"
)
SELECT
  'agent_' || u.id as id,
  u.id as "userId",
  u."firstName",
  u."lastName",
  u.email,
  u.phone,
  false as verified,
  false as "superAgent",
  0 as rating,
  0 as "reviewCount",
  0 as "yearsExperience",
  0 as "totalDeals",
  true as "showPhone",
  true as "showEmail",
  NOW() as "createdAt",
  NOW() as "updatedAt"
FROM "User" u
WHERE u.role = 'AGENT'
  AND NOT EXISTS (
    SELECT 1 FROM "Agent" a WHERE a."userId" = u.id
  );
