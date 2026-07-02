-- Sample Data for June 2026 Demo
-- This script adds diverse activities across June 2026 to demonstrate reporting features
-- Including individual check-ins and group events with various attendee counts

-- Get some registration IDs to use
DO $$
DECLARE
    device_id uuid := '3366f147-1e0a-4d02-a7a9-1a49e6b71ab5';
    reg_ids uuid[];
BEGIN
    -- Get 15 random registration IDs
    SELECT ARRAY_AGG(id) INTO reg_ids
    FROM (SELECT id FROM "Registration" ORDER BY RANDOM() LIMIT 15) AS sample_regs;

    -- Week 1 of June (June 1-7, 2026)
    -- Sunday June 1: Recovery Meeting (small group)
    INSERT INTO "Activity" ("id", "deviceId", "category", "attendeeCount", "createdAt", "registrationId")
    VALUES 
        (gen_random_uuid(), device_id, 'Recovery Meeting', 1, '2026-06-01 10:00:00Z', reg_ids[1]),
        (gen_random_uuid(), device_id, 'Recovery Meeting', 1, '2026-06-01 10:05:00Z', reg_ids[2]),
        (gen_random_uuid(), device_id, 'Recovery Meeting', 1, '2026-06-01 10:10:00Z', reg_ids[3]),
        (gen_random_uuid(), device_id, 'Recovery Meeting', 1, '2026-06-01 10:15:00Z', reg_ids[4]);

    -- Monday June 2: Drop-In and Wellness activities
    INSERT INTO "Activity" ("id", "deviceId", "category", "attendeeCount", "createdAt", "registrationId")
    VALUES 
        (gen_random_uuid(), device_id, 'Drop-In', 1, '2026-06-02 13:30:00Z', reg_ids[1]),
        (gen_random_uuid(), device_id, 'Wellness', 1, '2026-06-02 14:00:00Z', reg_ids[2]),
        (gen_random_uuid(), device_id, 'Wellness', 1, '2026-06-02 14:30:00Z', reg_ids[5]),
        (gen_random_uuid(), device_id, 'Drop-In', 1, '2026-06-02 15:00:00Z', reg_ids[6]);

    -- Tuesday June 3: Veteran Programming
    INSERT INTO "Activity" ("id", "deviceId", "category", "attendeeCount", "createdAt", "registrationId")
    VALUES 
        (gen_random_uuid(), device_id, 'Veteran Programming', 1, '2026-06-03 11:00:00Z', reg_ids[3]),
        (gen_random_uuid(), device_id, 'Veteran Programming', 1, '2026-06-03 11:15:00Z', reg_ids[7]);

    -- Wednesday June 4: Art class (medium group)
    INSERT INTO "Activity" ("id", "deviceId", "category", "attendeeCount", "createdAt", "registrationId")
    VALUES 
        (gen_random_uuid(), device_id, 'Art', 12, '2026-06-04 14:00:00Z', reg_ids[4]);

    -- Thursday June 5: Virtual Reality sessions
    INSERT INTO "Activity" ("id", "deviceId", "category", "attendeeCount", "createdAt", "registrationId")
    VALUES 
        (gen_random_uuid(), device_id, 'Virtual Reality', 1, '2026-06-05 10:00:00Z', reg_ids[1]),
        (gen_random_uuid(), device_id, 'Virtual Reality', 1, '2026-06-05 10:30:00Z', reg_ids[5]),
        (gen_random_uuid(), device_id, 'Virtual Reality', 1, '2026-06-05 11:00:00Z', reg_ids[8]),
        (gen_random_uuid(), device_id, 'Virtual Reality', 1, '2026-06-05 11:30:00Z', reg_ids[9]);

    -- Friday June 6: Social Event (large group evening event)
    INSERT INTO "Activity" ("id", "deviceId", "category", "attendeeCount", "createdAt", "registrationId")
    VALUES 
        (gen_random_uuid(), device_id, 'Social Event', 45, '2026-06-06 18:00:00Z', reg_ids[6]);

    -- Saturday June 7: Family Support
    INSERT INTO "Activity" ("id", "deviceId", "category", "attendeeCount", "createdAt", "registrationId")
    VALUES 
        (gen_random_uuid(), device_id, 'Family Support', 1, '2026-06-07 10:00:00Z', reg_ids[2]),
        (gen_random_uuid(), device_id, 'Family Support', 1, '2026-06-07 10:30:00Z', reg_ids[10]);

    -- Week 2 of June (June 8-14, 2026)
    -- Sunday June 8: Recovery Meeting + Faith-Based
    INSERT INTO "Activity" ("id", "deviceId", "category", "attendeeCount", "createdAt", "registrationId")
    VALUES 
        (gen_random_uuid(), device_id, 'Recovery Meeting', 1, '2026-06-08 10:00:00Z', reg_ids[1]),
        (gen_random_uuid(), device_id, 'Recovery Meeting', 1, '2026-06-08 10:05:00Z', reg_ids[3]),
        (gen_random_uuid(), device_id, 'Recovery Meeting', 1, '2026-06-08 10:10:00Z', reg_ids[4]),
        (gen_random_uuid(), device_id, 'Faith-Based', 8, '2026-06-08 11:00:00Z', reg_ids[5]);

    -- Monday June 9: Personal Growth workshop
    INSERT INTO "Activity" ("id", "deviceId", "category", "attendeeCount", "createdAt", "registrationId")
    VALUES 
        (gen_random_uuid(), device_id, 'Personal Growth', 15, '2026-06-09 13:00:00Z', reg_ids[7]);

    -- Tuesday June 10: Peer Support and Bus Pass
    INSERT INTO "Activity" ("id", "deviceId", "category", "attendeeCount", "createdAt", "registrationId")
    VALUES 
        (gen_random_uuid(), device_id, 'Peer Support', 1, '2026-06-10 14:00:00Z', reg_ids[2]),
        (gen_random_uuid(), device_id, 'Peer Support', 1, '2026-06-10 14:30:00Z', reg_ids[6]),
        (gen_random_uuid(), device_id, 'Bus Pass', 1, '2026-06-10 15:00:00Z', reg_ids[8]),
        (gen_random_uuid(), device_id, 'Bus Pass', 1, '2026-06-10 15:10:00Z', reg_ids[9]);

    -- Wednesday June 11: The Retreat Virtual Reality
    INSERT INTO "Activity" ("id", "deviceId", "category", "attendeeCount", "createdAt", "registrationId")
    VALUES 
        (gen_random_uuid(), device_id, 'The Retreat Virtual Reality', 1, '2026-06-11 10:00:00Z', reg_ids[3]),
        (gen_random_uuid(), device_id, 'The Retreat Virtual Reality', 1, '2026-06-11 10:45:00Z', reg_ids[7]),
        (gen_random_uuid(), device_id, 'The Retreat Virtual Reality', 1, '2026-06-11 11:30:00Z', reg_ids[11]);

    -- Thursday June 12: Training/Focus Group
    INSERT INTO "Activity" ("id", "deviceId", "category", "attendeeCount", "createdAt", "registrationId")
    VALUES 
        (gen_random_uuid(), device_id, 'Training/Focus Group', 22, '2026-06-12 13:00:00Z', reg_ids[4]);

    -- Friday June 13: Event (community picnic - large group)
    INSERT INTO "Activity" ("id", "deviceId", "category", "attendeeCount", "createdAt", "registrationId")
    VALUES 
        (gen_random_uuid(), device_id, 'Event', 67, '2026-06-13 17:00:00Z', reg_ids[5]);

    -- Saturday June 14: Volunteer activities
    INSERT INTO "Activity" ("id", "deviceId", "category", "attendeeCount", "createdAt", "registrationId")
    VALUES 
        (gen_random_uuid(), device_id, 'Volunteer', 1, '2026-06-14 09:00:00Z', reg_ids[1]),
        (gen_random_uuid(), device_id, 'Volunteer', 1, '2026-06-14 09:15:00Z', reg_ids[6]),
        (gen_random_uuid(), device_id, 'Volunteer', 1, '2026-06-14 09:30:00Z', reg_ids[12]);

    -- Week 3 of June (June 15-21, 2026)
    -- Sunday June 15: Recovery Meeting
    INSERT INTO "Activity" ("id", "deviceId", "category", "attendeeCount", "createdAt", "registrationId")
    VALUES 
        (gen_random_uuid(), device_id, 'Recovery Meeting', 1, '2026-06-15 10:00:00Z', reg_ids[1]),
        (gen_random_uuid(), device_id, 'Recovery Meeting', 1, '2026-06-15 10:05:00Z', reg_ids[2]),
        (gen_random_uuid(), device_id, 'Recovery Meeting', 1, '2026-06-15 10:10:00Z', reg_ids[4]),
        (gen_random_uuid(), device_id, 'Recovery Meeting', 1, '2026-06-15 10:15:00Z', reg_ids[13]);

    -- Monday June 16: Board Meeting
    INSERT INTO "Activity" ("id", "deviceId", "category", "attendeeCount", "createdAt", "registrationId")
    VALUES 
        (gen_random_uuid(), device_id, 'Board Meeting', 12, '2026-06-16 18:00:00Z', reg_ids[3]);

    -- Tuesday June 17: Drop-In day
    INSERT INTO "Activity" ("id", "deviceId", "category", "attendeeCount", "createdAt", "registrationId")
    VALUES 
        (gen_random_uuid(), device_id, 'Drop-In', 1, '2026-06-17 10:00:00Z', reg_ids[5]),
        (gen_random_uuid(), device_id, 'Drop-In', 1, '2026-06-17 11:00:00Z', reg_ids[7]),
        (gen_random_uuid(), device_id, 'Drop-In', 1, '2026-06-17 13:00:00Z', reg_ids[8]),
        (gen_random_uuid(), device_id, 'Drop-In', 1, '2026-06-17 14:00:00Z', reg_ids[9]),
        (gen_random_uuid(), device_id, 'Drop-In', 1, '2026-06-17 15:00:00Z', reg_ids[10]);

    -- Wednesday June 18: Wellness sessions
    INSERT INTO "Activity" ("id", "deviceId", "category", "attendeeCount", "createdAt", "registrationId")
    VALUES 
        (gen_random_uuid(), device_id, 'Wellness', 1, '2026-06-18 10:00:00Z', reg_ids[2]),
        (gen_random_uuid(), device_id, 'Wellness', 1, '2026-06-18 11:00:00Z', reg_ids[6]),
        (gen_random_uuid(), device_id, 'Wellness', 1, '2026-06-18 14:00:00Z', reg_ids[11]),
        (gen_random_uuid(), device_id, 'Wellness', 1, '2026-06-18 15:00:00Z', reg_ids[14]);

    -- Thursday June 19: Art workshop
    INSERT INTO "Activity" ("id", "deviceId", "category", "attendeeCount", "createdAt", "registrationId")
    VALUES 
        (gen_random_uuid(), device_id, 'Art', 18, '2026-06-19 14:00:00Z', reg_ids[1]);

    -- Friday June 20: Tour/Outreach
    INSERT INTO "Activity" ("id", "deviceId", "category", "attendeeCount", "createdAt", "registrationId")
    VALUES 
        (gen_random_uuid(), device_id, 'Tour/Outreach', 25, '2026-06-20 10:00:00Z', reg_ids[4]);

    -- Saturday June 21: Family Support day
    INSERT INTO "Activity" ("id", "deviceId", "category", "attendeeCount", "createdAt", "registrationId")
    VALUES 
        (gen_random_uuid(), device_id, 'Family Support', 1, '2026-06-21 10:00:00Z', reg_ids[3]),
        (gen_random_uuid(), device_id, 'Family Support', 1, '2026-06-21 11:00:00Z', reg_ids[7]),
        (gen_random_uuid(), device_id, 'Family Support', 1, '2026-06-21 13:00:00Z', reg_ids[12]);

    -- Week 4 of June (June 22-28, 2026)
    -- Sunday June 22: Recovery Meeting
    INSERT INTO "Activity" ("id", "deviceId", "category", "attendeeCount", "createdAt", "registrationId")
    VALUES 
        (gen_random_uuid(), device_id, 'Recovery Meeting', 1, '2026-06-22 10:00:00Z', reg_ids[1]),
        (gen_random_uuid(), device_id, 'Recovery Meeting', 1, '2026-06-22 10:05:00Z', reg_ids[2]),
        (gen_random_uuid(), device_id, 'Recovery Meeting', 1, '2026-06-22 10:10:00Z', reg_ids[4]);

    -- Monday June 23: Peer Support
    INSERT INTO "Activity" ("id", "deviceId", "category", "attendeeCount", "createdAt", "registrationId")
    VALUES 
        (gen_random_uuid(), device_id, 'Peer Support', 1, '2026-06-23 14:00:00Z', reg_ids[5]),
        (gen_random_uuid(), device_id, 'Peer Support', 1, '2026-06-23 14:30:00Z', reg_ids[8]),
        (gen_random_uuid(), device_id, 'Peer Support', 1, '2026-06-23 15:00:00Z', reg_ids[9]);

    -- Tuesday June 24: Virtual Reality day
    INSERT INTO "Activity" ("id", "deviceId", "category", "attendeeCount", "createdAt", "registrationId")
    VALUES 
        (gen_random_uuid(), device_id, 'Virtual Reality', 1, '2026-06-24 10:00:00Z', reg_ids[3]),
        (gen_random_uuid(), device_id, 'Virtual Reality', 1, '2026-06-24 10:30:00Z', reg_ids[6]),
        (gen_random_uuid(), device_id, 'Virtual Reality', 1, '2026-06-24 11:00:00Z', reg_ids[10]),
        (gen_random_uuid(), device_id, 'Virtual Reality', 1, '2026-06-24 11:30:00Z', reg_ids[13]),
        (gen_random_uuid(), device_id, 'The Retreat Virtual Reality', 1, '2026-06-24 13:00:00Z', reg_ids[7]),
        (gen_random_uuid(), device_id, 'The Retreat Virtual Reality', 1, '2026-06-24 13:45:00Z', reg_ids[14]);

    -- Wednesday June 25: Personal Growth
    INSERT INTO "Activity" ("id", "deviceId", "category", "attendeeCount", "createdAt", "registrationId")
    VALUES 
        (gen_random_uuid(), device_id, 'Personal Growth', 20, '2026-06-25 13:00:00Z', reg_ids[2]);

    -- Thursday June 26: Veteran Programming
    INSERT INTO "Activity" ("id", "deviceId", "category", "attendeeCount", "createdAt", "registrationId")
    VALUES 
        (gen_random_uuid(), device_id, 'Veteran Programming', 1, '2026-06-26 11:00:00Z', reg_ids[4]),
        (gen_random_uuid(), device_id, 'Veteran Programming', 1, '2026-06-26 11:30:00Z', reg_ids[11]),
        (gen_random_uuid(), device_id, 'Veteran Programming', 1, '2026-06-26 12:00:00Z', reg_ids[15]);

    -- Friday June 27: Social Event (end of month celebration)
    INSERT INTO "Activity" ("id", "deviceId", "category", "attendeeCount", "createdAt", "registrationId")
    VALUES 
        (gen_random_uuid(), device_id, 'Social Event', 53, '2026-06-27 18:00:00Z', reg_ids[1]);

    -- Saturday June 28: Mixed activities
    INSERT INTO "Activity" ("id", "deviceId", "category", "attendeeCount", "createdAt", "registrationId")
    VALUES 
        (gen_random_uuid(), device_id, 'Wellness', 1, '2026-06-28 10:00:00Z', reg_ids[5]),
        (gen_random_uuid(), device_id, 'Drop-In', 1, '2026-06-28 11:00:00Z', reg_ids[8]),
        (gen_random_uuid(), device_id, 'Art', 1, '2026-06-28 13:00:00Z', reg_ids[12]),
        (gen_random_uuid(), device_id, 'Bus Pass', 1, '2026-06-28 14:00:00Z', reg_ids[9]);

    -- Sunday June 29: Recovery Meeting (final week)
    INSERT INTO "Activity" ("id", "deviceId", "category", "attendeeCount", "createdAt", "registrationId")
    VALUES 
        (gen_random_uuid(), device_id, 'Recovery Meeting', 1, '2026-06-29 10:00:00Z', reg_ids[1]),
        (gen_random_uuid(), device_id, 'Recovery Meeting', 1, '2026-06-29 10:05:00Z', reg_ids[2]),
        (gen_random_uuid(), device_id, 'Recovery Meeting', 1, '2026-06-29 10:10:00Z', reg_ids[3]),
        (gen_random_uuid(), device_id, 'Recovery Meeting', 1, '2026-06-29 10:15:00Z', reg_ids[13]);

    -- Monday June 30: Volunteer day (final day)
    INSERT INTO "Activity" ("id", "deviceId", "category", "attendeeCount", "createdAt", "registrationId")
    VALUES 
        (gen_random_uuid(), device_id, 'Volunteer', 1, '2026-06-30 09:00:00Z', reg_ids[6]),
        (gen_random_uuid(), device_id, 'Volunteer', 1, '2026-06-30 09:30:00Z', reg_ids[10]),
        (gen_random_uuid(), device_id, 'Volunteer', 1, '2026-06-30 10:00:00Z', reg_ids[14]);

END $$;

-- Summary
SELECT 
    'June 2026 Sample Data Summary' as description,
    COUNT(*) as total_activity_records,
    SUM("attendeeCount") as total_people_count,
    COUNT(DISTINCT "registrationId") as unique_participants
FROM "Activity"
WHERE "createdAt" >= '2026-06-01' AND "createdAt" < '2026-07-01';
