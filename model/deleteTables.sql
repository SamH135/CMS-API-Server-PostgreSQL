DO $$ 
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS "' || rec.tablename || '" CASCADE';
    END LOOP;
END $$;