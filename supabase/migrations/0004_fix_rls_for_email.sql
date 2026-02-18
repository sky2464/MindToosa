-- Drop existing policies that use UUID comparison
drop policy if exists "Users can view their own stats" on user_stats;
drop policy if exists "Users can update their own stats" on user_stats;

-- Create new policies that compare user_id (email) with auth.users.email
create policy "Users can view their own stats"
  on user_stats for select
  using ( user_id = (select email from auth.users where id = auth.uid()) );

create policy "Users can update their own stats"
  on user_stats for update
  using ( user_id = (select email from auth.users where id = auth.uid()) );

create policy "Users can insert their own stats"
  on user_stats for insert
  with check ( user_id = (select email from auth.users where id = auth.uid()) );
