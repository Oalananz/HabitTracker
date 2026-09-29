-- ================================================================
-- Migration v7a: Money Tracker (V3, Part 1)
-- Runs AFTER migration_v6_life_areas.sql.
--
-- Adds money_categories, money_transactions, money_budgets,
-- savings_goals, debts, and subscriptions tables, plus two
-- RPCs for atomic increment/decrement of
-- savings goal / debt balances (mirrors increment_goal_progress).
-- ================================================================

-- ----------------------------------------------------------------
-- 1. money_categories
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS money_categories (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name        text NOT NULL,
  type        text NOT NULL CHECK (type IN ('income', 'expense')),
  color       text,
  icon        text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS money_categories_user_id_idx ON money_categories(user_id);

-- ----------------------------------------------------------------
-- 2. money_transactions
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS money_transactions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type            text NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
  amount          numeric NOT NULL,
  currency        text DEFAULT 'JOD',
  category_id     uuid REFERENCES money_categories(id) ON DELETE SET NULL,
  title           text NOT NULL,
  description     text,
  date            date NOT NULL,
  payment_method  text,
  life_area       text DEFAULT 'money',
  is_recurring    boolean DEFAULT false,
  recurring_rule  jsonb,
  created_at      timestamptz DEFAULT now(),
  updated_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS money_transactions_user_id_idx ON money_transactions(user_id);
CREATE INDEX IF NOT EXISTS money_transactions_user_date_idx ON money_transactions(user_id, date);

-- ----------------------------------------------------------------
-- 3. money_budgets
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS money_budgets (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  month        int NOT NULL,
  year         int NOT NULL,
  category_id  uuid REFERENCES money_categories(id) ON DELETE SET NULL,
  amount       numeric NOT NULL,
  currency     text DEFAULT 'JOD',
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS money_budgets_user_id_idx ON money_budgets(user_id);
CREATE INDEX IF NOT EXISTS money_budgets_user_year_month_idx ON money_budgets(user_id, year, month);

-- ----------------------------------------------------------------
-- 4. savings_goals
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS savings_goals (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title          text NOT NULL,
  target_amount  numeric,
  current_amount numeric DEFAULT 0,
  currency       text DEFAULT 'JOD',
  target_date    date,
  status         text CHECK (status IN ('active', 'completed', 'paused')) DEFAULT 'active',
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS savings_goals_user_id_idx ON savings_goals(user_id);

-- ----------------------------------------------------------------
-- 5. debts
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS debts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title             text NOT NULL,
  total_amount      numeric,
  remaining_amount  numeric,
  currency          text DEFAULT 'JOD',
  monthly_payment   numeric,
  due_date          date,
  status            text CHECK (status IN ('active', 'paid', 'paused')) DEFAULT 'active',
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS debts_user_id_idx ON debts(user_id);

-- ----------------------------------------------------------------
-- 6. subscriptions
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subscriptions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title              text NOT NULL,
  amount             numeric,
  currency           text DEFAULT 'JOD',
  billing_cycle      text CHECK (billing_cycle IN ('monthly', 'yearly', 'weekly', 'custom')),
  next_billing_date  date,
  category_id        uuid REFERENCES money_categories(id) ON DELETE SET NULL,
  is_active          boolean DEFAULT true,
  created_at         timestamptz DEFAULT now(),
  updated_at         timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);

-- ----------------------------------------------------------------
-- 7. RPCs — atomic increment/decrement (mirrors increment_goal_progress)
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION increment_savings_goal(
  p_id UUID,
  p_user_id UUID,
  p_amount NUMERIC
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE savings_goals
  SET
    current_amount = current_amount + p_amount,
    status = CASE
      WHEN target_amount IS NOT NULL AND current_amount + p_amount >= target_amount THEN 'completed'
      ELSE status
    END,
    updated_at = NOW()
  WHERE id = p_id AND user_id = p_user_id
  RETURNING to_jsonb(savings_goals.*) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_debt_remaining(
  p_id UUID,
  p_user_id UUID,
  p_amount NUMERIC
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE debts
  SET
    remaining_amount = GREATEST(remaining_amount - p_amount, 0),
    status = CASE
      WHEN remaining_amount - p_amount <= 0 THEN 'paid'
      ELSE status
    END,
    updated_at = NOW()
  WHERE id = p_id AND user_id = p_user_id
  RETURNING to_jsonb(debts.*) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql;
