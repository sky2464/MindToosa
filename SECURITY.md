# Security Policy

## Security Architecture

MindToosa implements a defense-in-depth security architecture with multiple layers of protection:

### 1. Authentication & Authorization

- **NextAuth.js v5**: Handles user authentication via Google OAuth
- **JWT Sessions**: Stateless session management for scalability
- **Protected API Routes**: All API endpoints verify authentication before processing requests
- **Service Layer Authorization**: Each service method enforces user-based data isolation

### 2. Database Security

#### Row Level Security (RLS)

All database tables have RLS policies enabled for defense-in-depth:

```sql
-- Example RLS policy pattern (used across all tables)
create policy "Users can view their own data"
  on table_name for select
  using ( user_id = (select email from auth.users where id = auth.uid()) );
```

**Tables with RLS:**

- `spaces`
- `goals`
- `tasks`
- `focus_sessions`
- `projects`
- `user_stats`

#### Service Role Key Usage

**IMPORTANT**: The application uses Supabase's service role key, which bypasses RLS policies.

**Why?**

- Simplifies server-side operations (no need to pass user context to Supabase)
- Allows admin operations when needed
- Centralizes authorization logic in the service layer

**Security Requirements:**

- Service role key is NEVER exposed to the browser
- Each service method MUST verify `userId` matches the authenticated user
- All queries use `.eq("user_id", userId)` to enforce data isolation
- RLS policies provide defense-in-depth if service layer is compromised

### 3. Input Validation

All external inputs are validated using Zod schemas:

- **API Routes**: Validate request bodies before processing
- **Service Layer**: Validate UUIDs, dates, and field restrictions
- **Type Safety**: TypeScript strict mode enforces compile-time type checking

**Validation Examples:**

```typescript
// UUID validation
const UUIDSchema = z.string().uuid("Invalid UUID format");

// Date validation
const DateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

// Array size limits
const TaskArraySchema = z.array(z.any()).max(50, "Cannot schedule more than 50 tasks");
```

### 4. Environment Variables

All environment variables are validated at application startup using Zod:

```typescript
// See src/server/env.ts for the complete schema
const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  NEXTAUTH_SECRET: z.string().min(32),
  // ... more fields
});
```

**Benefits:**

- Fail-fast behavior: Application won't start with missing/invalid env vars
- Type safety: Environment variables are strongly typed
- Clear error messages: Developers know exactly what's missing

### 5. Data Isolation

**User Data Isolation Strategy:**

1. **Authentication**: Verify user is authenticated (`auth()`)
2. **User ID Extraction**: Extract `userId` from session (`session?.user?.email`)
3. **Service Layer**: Pass `userId` to service methods
4. **Database Queries**: Filter by `user_id` in all queries

**Example:**

```typescript
// API Route
const session = await auth();
const userId = session?.user?.email;
if (!userId) return new NextResponse("Unauthorized", { status: 401 });

// Service Method
async getGoals(userId: string) {
  return db.from("goals").select("*").eq("user_id", userId);
}
```

## Security Best Practices for Developers

### 1. Never Expose Secrets

- ✅ Use environment variables for all secrets
- ✅ Add `.env.local` to `.gitignore`
- ❌ Never commit secrets to version control
- ❌ Never log secrets (even in development)

### 2. Always Validate Input

- ✅ Use Zod schemas for all external inputs
- ✅ Validate UUIDs before using them in queries
- ✅ Validate dates, array sizes, and field restrictions
- ❌ Never trust client-provided data

### 3. Enforce Authorization

- ✅ Check authentication in all API routes
- ✅ Use `.eq("user_id", userId)` in all database queries
- ✅ Validate user owns the resource before updating/deleting
- ❌ Never rely solely on client-side authorization

### 4. Production Code Quality

- ✅ Remove all `console.log` statements before deploying
- ✅ Use structured logging for production (e.g., Winston, Pino)
- ✅ Handle errors gracefully with user-friendly messages
- ❌ Never expose stack traces or internal errors to users

## Reporting Security Vulnerabilities

If you discover a security vulnerability, please report it to the project maintainers immediately. Do not open a public issue.

## Security Checklist for New Features

Before deploying new features, verify:

- [ ] All API routes check authentication
- [ ] All service methods verify `userId`
- [ ] All inputs are validated with Zod schemas
- [ ] No secrets are hardcoded or logged
- [ ] No debug code (console.log) in production
- [ ] RLS policies are enabled for new tables
- [ ] Environment variables are validated in `env.ts`
- [ ] Error messages don't leak sensitive information

## Migration Security

When creating database migrations:

1. **Enable RLS**: Always enable RLS for new tables
2. **Create Policies**: Create policies for SELECT, INSERT, UPDATE, DELETE
3. **Use Standard Pattern**: Use the email lookup pattern for consistency:
   ```sql
   user_id = (select email from auth.users where id = auth.uid())
   ```
4. **Test Policies**: Verify policies work correctly before deploying

## Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Zod Documentation](https://zod.dev/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
