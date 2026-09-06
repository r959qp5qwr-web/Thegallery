-- SCHEMA ISOLATION (2026-09-06). Every object this product owns lives in ONE schema, and
-- nothing is created in `public`. That is what makes it safe to host The Gallery inside a
-- Supabase project that already carries another product: a name clash is impossible, the whole
-- product dumps and restores as one schema, and a migration run against the wrong database
-- cannot touch tables it does not own.
--
-- @schema@ is substituted by the migration runner (db/cli.ts, GALLERY_SCHEMA, default
-- `gallery`). A plain token rather than a psql variable, so the same file runs through psql
-- and through the Node runner without one of them choking on meta-commands.
--
-- search_path is set once here, so every unqualified CREATE below lands in that schema.
CREATE SCHEMA IF NOT EXISTS "@schema@";
SET search_path = "@schema@";

-- The Gallery — public views, grants, row-level security, transition functions.
--
-- DOMAIN_MODEL §3: "An object is public only when every ancestor is public: work published
-- AND gallery published AND maker active." That predicate lives in ONE place — the views
-- below — and every public surface reads them. Discovery, search, work detail, maker gallery
-- and the image route all go through the same predicate, so a surface cannot drift.

-- ------------------------------------------------------------------ the public predicate
CREATE OR REPLACE VIEW public_makers AS
SELECT m.id, m.handle, m.display_name, m.kind, m.city, m.region, m.country,
       CASE WHEN m.exact_address_public THEN m.exact_address END AS exact_address,
       m.practice_note, m.commissions_open, m.commissions_note,
       g.id AS gallery_id, g.intro AS gallery_intro, g.published_at AS gallery_published_at
FROM makers m
JOIN galleries g ON g.maker_id = m.id
WHERE m.status = 'active' AND g.lifecycle = 'published';
-- Deliberately absent from this view: account_id, status_reason, exact_address when private,
-- and every column of auth_accounts. The account email has no path to a public surface.

CREATE OR REPLACE VIEW public_works AS
SELECT w.id, w.public_token, w.title, w.material, w.medium, w.process,
       w.height_mm, w.width_mm, w.depth_mm, w.year,
       w.price_mode, w.price_amount, w.price_currency,
       w.status, w.status_confirmed_at, w.published_at, w.position,
       pm.id AS maker_id, pm.handle AS maker_handle, pm.display_name AS maker_display_name,
       pm.city AS maker_city, pm.kind AS maker_kind
FROM works w
JOIN galleries g   ON g.id = w.gallery_id
JOIN public_makers pm ON pm.gallery_id = g.id
WHERE w.lifecycle = 'published' AND w.taken_down = false;

-- A retired or taken-down work keeps its URL and renders a truthful ending
-- (PRODUCT_ARCHITECTURE §4.1). This view carries only what that ending needs.
CREATE OR REPLACE VIEW public_work_endings AS
SELECT w.public_token, w.title, w.lifecycle, w.taken_down,
       m.handle AS maker_handle, m.display_name AS maker_display_name, m.status AS maker_status
FROM works w
JOIN galleries g ON g.id = w.gallery_id
JOIN makers m    ON m.id = g.maker_id;

CREATE OR REPLACE VIEW public_work_images AS
SELECT i.id, i.work_id, i.position, i.width, i.height, i.alt_text, i.variants
FROM work_images i
JOIN public_works pw ON pw.id = i.work_id
WHERE i.state = 'ready';

-- A route becomes an action only when enabled AND validated (DOMAIN_MODEL §2.7).
CREATE OR REPLACE VIEW public_contact_routes AS
SELECT r.id, r.maker_id, r.kind, r.value, r.label, r.position
FROM contact_routes r
JOIN public_makers pm ON pm.id = r.maker_id
WHERE r.enabled = true AND r.validated = true;

-- ---------------------------------------------------------------------------- grants
-- The anonymous role gets NOTHING on any base table. Not a policy that returns zero rows —
-- no grant at all, so a direct read raises "permission denied for table works".
REVOKE ALL ON ALL TABLES IN SCHEMA "@schema@" FROM gallery_anon, gallery_auth;
GRANT SELECT ON public_makers, public_works, public_work_images, public_contact_routes,
                public_work_endings, material_categories TO gallery_anon, gallery_auth;

GRANT SELECT, INSERT, UPDATE ON makers, galleries, works, work_images, contact_routes TO gallery_auth;
GRANT DELETE ON work_images, contact_routes TO gallery_auth;
GRANT SELECT ON auth_accounts TO gallery_auth;
GRANT UPDATE (access_state, closed_at) ON auth_accounts TO gallery_auth;
GRANT SELECT, INSERT ON operator_actions TO gallery_auth;
GRANT SELECT, INSERT ON write_intents TO gallery_auth;
GRANT INSERT ON operational_failures TO gallery_auth;
GRANT USAGE ON SCHEMA "@schema@" TO gallery_anon, gallery_auth;

-- ------------------------------------------------------------------ row-level security
ALTER TABLE auth_accounts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE makers              ENABLE ROW LEVEL SECURITY;
ALTER TABLE galleries           ENABLE ROW LEVEL SECURITY;
ALTER TABLE works               ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_images         ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_routes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE operator_actions    ENABLE ROW LEVEL SECURITY;
ALTER TABLE write_intents       ENABLE ROW LEVEL SECURITY;
ALTER TABLE operational_failures ENABLE ROW LEVEL SECURITY;

-- An account row is reachable only by its own owner. There is no policy that lets one
-- maker read another account's email, and no grant that lets anyone anonymous try.
CREATE POLICY account_self ON auth_accounts FOR SELECT TO gallery_auth
  USING (id = account_id());
CREATE POLICY account_self_close ON auth_accounts FOR UPDATE TO gallery_auth
  USING (id = account_id()) WITH CHECK (id = account_id());

CREATE POLICY maker_self ON makers FOR SELECT TO gallery_auth
  USING (account_id = account_id() OR is_operator());
CREATE POLICY maker_self_insert ON makers FOR INSERT TO gallery_auth
  WITH CHECK (account_id = account_id());
CREATE POLICY maker_self_update ON makers FOR UPDATE TO gallery_auth
  USING (account_id = account_id()) WITH CHECK (account_id = account_id());

CREATE POLICY gallery_self ON galleries FOR SELECT TO gallery_auth
  USING (maker_id = maker_id() OR is_operator());
CREATE POLICY gallery_self_insert ON galleries FOR INSERT TO gallery_auth
  WITH CHECK (maker_id = maker_id());
CREATE POLICY gallery_self_update ON galleries FOR UPDATE TO gallery_auth
  USING (maker_id = maker_id()) WITH CHECK (maker_id = maker_id());

CREATE POLICY work_self ON works FOR SELECT TO gallery_auth
  USING (gallery_id IN (SELECT id FROM galleries WHERE maker_id = maker_id()) OR is_operator());
CREATE POLICY work_self_insert ON works FOR INSERT TO gallery_auth
  WITH CHECK (gallery_id IN (SELECT id FROM galleries WHERE maker_id = maker_id()));
CREATE POLICY work_self_update ON works FOR UPDATE TO gallery_auth
  USING (gallery_id IN (SELECT id FROM galleries WHERE maker_id = maker_id()))
  WITH CHECK (gallery_id IN (SELECT id FROM galleries WHERE maker_id = maker_id()));

CREATE POLICY image_self ON work_images FOR ALL TO gallery_auth
  USING (work_id IN (SELECT w.id FROM works w JOIN galleries g ON g.id = w.gallery_id
                     WHERE g.maker_id = maker_id()))
  WITH CHECK (work_id IN (SELECT w.id FROM works w JOIN galleries g ON g.id = w.gallery_id
                     WHERE g.maker_id = maker_id()));

CREATE POLICY route_self ON contact_routes FOR ALL TO gallery_auth
  USING (maker_id = maker_id()) WITH CHECK (maker_id = maker_id());

CREATE POLICY intent_self ON write_intents FOR ALL TO gallery_auth
  USING (account_id = account_id()) WITH CHECK (account_id = account_id());

CREATE POLICY failure_insert ON operational_failures FOR INSERT TO gallery_auth WITH CHECK (true);

-- Only an operator may write the append-only record, and only as themselves.
CREATE POLICY operator_read ON operator_actions FOR SELECT TO gallery_auth
  USING (is_operator());
CREATE POLICY operator_write ON operator_actions FOR INSERT TO gallery_auth
  WITH CHECK (is_operator() AND actor_account_id = account_id());

-- ------------------------------------------------------------------ transition functions
-- Every consequential state change re-reads its row under a lock and predicates the write on
-- the current state (DOMAIN_MODEL §4), so a double submit or a retry cannot half-apply.

CREATE OR REPLACE FUNCTION publish_work(p_work_id uuid, p_intent_key text)
RETURNS TABLE (outcome text, work_id uuid, public_token text)
LANGUAGE plpgsql SECURITY INVOKER SET search_path = "@schema@" AS $$
DECLARE w works%ROWTYPE; g galleries%ROWTYPE; ready int; existing write_intents%ROWTYPE;
BEGIN
  SELECT * INTO existing FROM write_intents WHERE key = p_intent_key;
  IF FOUND THEN
    -- The same intent replayed: report the first outcome, do not publish twice.
    RETURN QUERY SELECT 'already_applied'::text, existing.subject_id,
                        (SELECT wk.public_token FROM works wk WHERE wk.id = existing.subject_id);
    RETURN;
  END IF;

  SELECT * INTO w FROM works WHERE id = p_work_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'work not found or not yours' USING ERRCODE = '42501'; END IF;
  SELECT * INTO g FROM galleries WHERE id = w.gallery_id FOR UPDATE;

  SELECT count(*) INTO ready FROM work_images WHERE work_images.work_id = p_work_id AND state = 'ready';
  IF ready = 0 THEN RAISE EXCEPTION 'a work publishes only with at least one ready image'; END IF;

  IF w.lifecycle = 'published' THEN
    INSERT INTO write_intents (key, account_id, kind, subject_id, result)
      VALUES (p_intent_key, account_id(), 'publish_work', p_work_id, '{"outcome":"already_published"}');
    RETURN QUERY SELECT 'already_published'::text, w.id, w.public_token; RETURN;
  END IF;

  UPDATE works SET lifecycle = 'published', published_at = now(), retired_at = NULL, updated_at = now()
    WHERE id = p_work_id;
  IF g.lifecycle = 'draft' THEN
    UPDATE galleries SET lifecycle = 'published', published_at = now() WHERE id = g.id;
  END IF;
  INSERT INTO write_intents (key, account_id, kind, subject_id, result)
    VALUES (p_intent_key, account_id(), 'publish_work', p_work_id, '{"outcome":"published"}');
  RETURN QUERY SELECT 'published'::text, w.id, w.public_token;
END $$;

CREATE OR REPLACE FUNCTION set_work_status(p_work_id uuid, p_status text)
RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path = "@schema@" AS $$
DECLARE w works%ROWTYPE;
BEGIN
  SELECT * INTO w FROM works WHERE id = p_work_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'work not found or not yours' USING ERRCODE = '42501'; END IF;
  IF w.lifecycle = 'draft' THEN RAISE EXCEPTION 'status belongs to a work that has been published'; END IF;
  UPDATE works SET status = p_status, status_confirmed_at = now(), updated_at = now() WHERE id = p_work_id;
  RETURN p_status;
END $$;

CREATE OR REPLACE FUNCTION retire_work(p_work_id uuid)
RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path = "@schema@" AS $$
BEGIN
  UPDATE works SET lifecycle = 'retired', retired_at = now(), updated_at = now()
    WHERE id = p_work_id AND lifecycle = 'published';
  IF NOT FOUND THEN RAISE EXCEPTION 'work not found, not yours, or not published' USING ERRCODE = '42501'; END IF;
  RETURN 'retired';
END $$;

-- Operator acts. SECURITY DEFINER because the operator legitimately writes another maker's
-- governed state; the first statement is the authority check, so the definer right cannot be
-- borrowed by a maker.
CREATE OR REPLACE FUNCTION set_maker_access(p_maker_id uuid, p_action text, p_reason text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = "@schema@" AS $$
DECLARE m makers%ROWTYPE; new_status text;
BEGIN
  IF NOT is_operator() THEN
    RAISE EXCEPTION 'operator authority required' USING ERRCODE = '42501';
  END IF;
  IF p_reason IS NULL OR btrim(p_reason) = '' THEN
    RAISE EXCEPTION 'every sanction carries a recorded reason (GAL-OD-15)';
  END IF;
  IF p_action NOT IN ('suspend','reinstate') THEN RAISE EXCEPTION 'unknown action %', p_action; END IF;

  SELECT * INTO m FROM makers WHERE id = p_maker_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'maker not found'; END IF;
  new_status := CASE WHEN p_action = 'suspend' THEN 'suspended' ELSE 'active' END;
  IF m.status = new_status THEN RETURN 'unchanged'; END IF;

  UPDATE makers SET status = new_status,
                    status_reason = CASE WHEN p_action = 'suspend' THEN p_reason ELSE NULL END,
                    updated_at = now()
    WHERE id = p_maker_id;
  INSERT INTO operator_actions (actor_account_id, action, subject_type, subject_id, reason)
    VALUES (account_id(), p_action, 'maker', p_maker_id, p_reason);
  RETURN new_status;
END $$;
GRANT EXECUTE ON FUNCTION set_maker_access(uuid, text, text) TO gallery_auth;

CREATE OR REPLACE FUNCTION close_account()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = "@schema@" AS $$
DECLARE acct uuid := account_id(); mk uuid;
BEGIN
  IF acct IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  SELECT id INTO mk FROM makers WHERE account_id = acct;
  IF mk IS NOT NULL THEN
    IF (SELECT status FROM makers WHERE id = mk) = 'suspended' THEN
      RAISE EXCEPTION 'a suspended account is not closed by the maker (DOMAIN_MODEL §2.1)';
    END IF;
    UPDATE works SET lifecycle = 'retired', retired_at = now(), updated_at = now()
      WHERE gallery_id IN (SELECT id FROM galleries WHERE maker_id = mk) AND lifecycle = 'published';
    UPDATE galleries SET lifecycle = 'closed' WHERE maker_id = mk;
    UPDATE makers SET status = 'closed', updated_at = now() WHERE id = mk;
  END IF;
  UPDATE auth_accounts SET access_state = 'closed', closed_at = now() WHERE id = acct;
  UPDATE auth_sessions SET revoked_at = now() WHERE account_id = acct AND revoked_at IS NULL;
  RETURN 'closed';
END $$;
GRANT EXECUTE ON FUNCTION close_account() TO gallery_auth;
