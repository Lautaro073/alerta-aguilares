UPDATE public.users AS profile
SET last_seen_at = auth_user.last_sign_in_at
FROM auth.users AS auth_user
WHERE profile.uid = auth_user.id::text
  AND profile.last_seen_at IS NULL
  AND auth_user.last_sign_in_at IS NOT NULL;

UPDATE public.users AS profile
SET
  terms_accepted_at = COALESCE(auth_user.last_sign_in_at, auth_user.created_at),
  terms_version = '2026-07-31'
FROM auth.users AS auth_user
WHERE profile.uid = auth_user.id::text
  AND profile.terms_accepted_at IS NULL
  AND EXISTS (
    SELECT 1
    FROM auth.identities AS identity
    WHERE identity.user_id = auth_user.id
      AND identity.provider = 'google'
  );
