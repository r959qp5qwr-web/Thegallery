-- TEST PROJECT ONLY (thegallery-test, fbgrumcwlnoljkkbiqfe). Never apply to the live project.
--
-- Supabase's built-in mailer delivers only to organisation members, and the journeys use
-- reserved .example addresses. This replaces sending with a Send Email auth hook that writes
-- each message to a table the journeys read, the hosted equivalent of the old dev_outbox.
-- The link is built the way the product's email templates must build it: redirect_to, a slash,
-- then GoTrue's token hash, which is what /makers/confirm/[token] and /makers/reset/[token] take.
-- It proves the link is minted, addressed and single-use. It does NOT prove an email round trip.
CREATE SCHEMA IF NOT EXISTS test_support;

CREATE TABLE IF NOT EXISTS test_support.outbox (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  to_email    text NOT NULL,
  action_type text NOT NULL,
  link        text NOT NULL,
  payload     jsonb NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE test_support.outbox ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION test_support.send_email(event jsonb) RETURNS jsonb
LANGUAGE plpgsql AS $$
DECLARE d jsonb := event->'email_data';
BEGIN
  INSERT INTO test_support.outbox (to_email, action_type, link, payload)
  VALUES (event->'user'->>'email', d->>'email_action_type',
          rtrim(d->>'redirect_to', '/') || '/' || (d->>'token_hash'), event);
  RETURN '{}'::jsonb;
END $$;

GRANT USAGE ON SCHEMA test_support TO supabase_auth_admin;
GRANT INSERT, SELECT ON test_support.outbox TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION test_support.send_email(jsonb) TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION test_support.send_email(jsonb) FROM PUBLIC, anon, authenticated;
CREATE POLICY outbox_auth_admin ON test_support.outbox TO supabase_auth_admin USING (true) WITH CHECK (true);
