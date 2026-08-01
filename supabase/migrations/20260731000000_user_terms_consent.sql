-- Registro del consentimiento a los Términos y a la Política de Privacidad.
--
-- El art. 5 de la Ley 25.326 exige que el consentimiento conste "por escrito o
-- por otro medio que permita se le equipare". El checkbox del alta cumple ese
-- estándar solo si queda registrado: sin esta traza no hay forma de acreditar
-- después quién aceptó, cuándo, ni qué texto.
--
-- Se deja NULL a propósito para las cuentas anteriores a esta migración: no
-- aceptaron nada, y marcarlas como si lo hubieran hecho sería falsear el registro.

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version TEXT;

COMMENT ON COLUMN users.terms_accepted_at IS
  'Momento en que la persona aceptó los Términos y la Política de Privacidad al crear su cuenta. NULL = nunca aceptó (cuenta anterior al registro de consentimiento).';

COMMENT ON COLUMN users.terms_version IS
  'Versión del texto legal aceptado (constante LEGAL_VERSION en src/lib/legal.ts).';

-- Permite ubicar rápido las cuentas sin consentimiento registrado, por si más
-- adelante se les quiere pedir que acepten la versión vigente.
CREATE INDEX IF NOT EXISTS idx_users_terms_pending
  ON users (uid)
  WHERE terms_accepted_at IS NULL;
