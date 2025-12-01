-- Create table to store which agents a user is watching
CREATE TABLE IF NOT EXISTS public.agents_watchlist (
  user_id uuid NOT NULL,
  agent_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT agents_watchlist_pkey PRIMARY KEY (user_id, agent_id),
  CONSTRAINT agents_watchlist_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE,
  CONSTRAINT agents_watchlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_agents_watchlist_user_id ON public.agents_watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_agents_watchlist_agent_id ON public.agents_watchlist(agent_id);

ALTER TABLE public.agents_watchlist ENABLE ROW LEVEL SECURITY;

-- Users can read their own watchlist
CREATE POLICY "Users can view their watchlist"
  ON public.agents_watchlist
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can manage entries tied to their account
CREATE POLICY "Users can modify their watchlist"
  ON public.agents_watchlist
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
