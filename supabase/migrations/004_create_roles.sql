CREATE ROLE kasir LOGIN PASSWORD 'kasir123' INHERIT;
CREATE ROLE owner LOGIN PASSWORD 'owner123' INHERIT;
CREATE ROLE developer LOGIN PASSWORD 'dev123' INHERIT;
GRANT authenticated TO kasir, owner, developer;
GRANT USAGE ON SCHEMA public TO kasir, owner, developer;
GRANT ALL ON ALL TABLES IN SCHEMA public TO kasir, owner, developer;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO kasir, owner, developer;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO kasir, owner, developer;
