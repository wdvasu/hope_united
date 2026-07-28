# Hope United Activity Tracking System - Technical Documentation

**Version:** 1.1  
**Last Updated:** July 28, 2026  
**Author:** Development Team

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture](#architecture)
4. [Development Environment Setup](#development-environment-setup)
5. [Database Schema](#database-schema)
6. [API Endpoints](#api-endpoints)
7. [Frontend Components](#frontend-components)
8. [Key Features Implementation](#key-features-implementation)
9. [Deployment Process](#deployment-process)
10. [Common Maintenance Tasks](#common-maintenance-tasks)
11. [Troubleshooting](#troubleshooting)
12. [Security Considerations](#security-considerations)

---

## System Overview

The Hope United Activity Tracking System is a full-stack web application designed to track participant registrations and daily activities. The system supports:

- Individual participant registration with demographic data
- Individual activity check-ins with QR code support
- Manual activity entry by staff
- Anonymous group event tracking (bulk entries)
- Comprehensive reporting with demographic filtering
- Activity date editing and corrections
- Excel exports for data analysis

### Key Design Decisions

- **Production Mode Only**: System runs in production mode (`next start`) to avoid HMR (Hot Module Replacement) issues that caused page reloads and filter resets
- **No Authentication Layer**: API endpoints rely on middleware authentication rather than individual endpoint checks
- **Sticky Table Navigation**: Enhanced UX with sticky headers/columns for large datasets
- **Bulk Operations**: Support for group events and bulk date editing to handle real-world use cases

---

## Technology Stack

### Frontend
- **Framework**: Next.js 16.0.1 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom React components
- **State Management**: React hooks (useState, useEffect)

### Backend
- **Runtime**: Node.js 20.20.0+
- **Framework**: Next.js API Routes
- **Database ORM**: Prisma 6.1.0
- **Database**: PostgreSQL
- **Validation**: Zod schemas

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint
- **Type Checking**: TypeScript compiler

### Production Environment (Windows)
- **Process Manager**: NSSM (Non-Sucking Service Manager)
- **Port**: 3000
- **Node Version**: 20.20.0+

---

## Architecture

### Directory Structure

```
hope_united/
├── src/
│   ├── app/                      # Next.js App Router pages
│   │   ├── page.tsx             # Home page (registration/activity cards)
│   │   ├── register/            # Participant registration flow
│   │   ├── activity/            # Individual check-in kiosk
│   │   ├── start/               # Landing page
│   │   ├── admin/               # Admin dashboard and reports
│   │   │   ├── page.tsx         # Admin dashboard
│   │   │   ├── registrations/  # Registration management
│   │   │   ├── activity/        # Activity reports
│   │   │   │   ├── page.tsx            # Main activity report (monthly calendar)
│   │   │   │   ├── by-person/          # Activity by person report
│   │   │   │   ├── manual/             # Manual activity entry
│   │   │   │   └── group/              # Group event entry
│   │   │   └── enroll/          # Staff enrollment
│   │   └── api/                 # API endpoints
│   │       ├── activity/        # Activity-related endpoints
│   │       ├── registrations/   # Registration endpoints
│   │       ├── reports/         # Report generation endpoints
│   │       └── auth/            # Authentication endpoints
│   ├── lib/                     # Shared utilities
│   │   ├── db.ts               # Prisma client
│   │   ├── auth.ts             # Authentication utilities
│   │   └── activityCategories.ts # Activity category definitions
│   └── middleware.ts            # Request middleware
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── migrations/              # Database migrations
├── public/
│   └── hope-united-user-manual.html  # User documentation
├── .env                         # Environment variables (DATABASE_URL, etc.)
└── package.json                 # Dependencies and scripts
```

### Data Flow

```
User Request → Next.js Middleware (Auth) → Page Component → API Route → Prisma → PostgreSQL
                                                ↓
                                        React State Updates
                                                ↓
                                            Re-render UI
```

---

## Development Environment Setup

### Prerequisites

1. **Node.js 20.20.0 or higher**
   ```bash
   # Check version
   node --version
   
   # Install via nvm (recommended)
   nvm install 20.20.0
   nvm use 20.20.0
   ```

2. **PostgreSQL Database**
   - Install PostgreSQL 16+ (Windows: use official installer)
   - Create database: `hope_united`
   - Note connection details for `.env` file

3. **Git**
   - Clone repository: `git clone <repository-url>`

### Initial Setup

```bash
# 1. Navigate to project directory
cd hope_united

# 2. Install dependencies
npm install

# 3. Create .env file with database connection
echo "DATABASE_URL=postgresql://username:password@localhost:5432/hope_united" > .env

# 4. Run database migrations
npx prisma migrate deploy

# 5. Generate Prisma client
npx prisma generate

# 6. Build the application
npm run build

# 7. Start production server (port 3004 for local testing)
PORT=3004 npm run start
```

### Available Scripts

```json
{
  "dev": "next dev",           // Development mode (NOT USED - causes HMR issues)
  "build": "next build",       // Build production bundle
  "start": "next start",       // Start production server
  "lint": "next lint"          // Run ESLint
}
```

---

## Database Schema

### Core Tables

#### `Registration`
Stores participant demographic information.

```prisma
model Registration {
  id                String    @id @default(uuid())
  uid               String    @unique
  fullName          String
  birthYear         Int?
  zipCode           String
  veteranStatus     String
  sexualOrientation String
  sexualOther       String?
  gender            String
  genderOther       String?
  race              String
  raceOther         String?
  ethnicity         String
  county            County
  countyOther       String?
  waiverAgreed      Boolean
  eSignatureAt      DateTime
  eSignatureImage   String?   @db.Text
  deviceId          String?
  createdIp         String?
  createdAt         DateTime  @default(now())
  activities        Activity[]
}
```

**Key Fields:**
- `uid`: Unique identifier for QR code scanning
- `county`: Enum type (SUMMIT, STARK, PORTAGE, CUYAHOGA, MEDINA, OTHER_OH_COUNTY, OUT_OF_STATE, REFUSED)
- `eSignatureImage`: Base64-encoded signature image
- Demographics: All `REFUSED` option available for privacy

#### `Activity`
Records individual activity entries (both individual and group).

```prisma
model Activity {
  id             String       @id @default(uuid())
  registrationId String?
  category       String
  attendeeCount  Int          @default(1)
  createdAt      DateTime     @default(now())
  registration   Registration? @relation(fields: [registrationId], references: [id], onDelete: Cascade)
  
  @@index([registrationId])
  @@index([createdAt])
  @@index([category])
}
```

**Key Fields:**
- `registrationId`: Nullable - null for anonymous group events
- `category`: Activity category (see activityCategories.ts)
- `attendeeCount`: Number of attendees (default 1 for individual, N for groups)
- `createdAt`: Timestamp of activity (can be backdated via manual entry)

#### `ActivityAdjustment`
Stores manual corrections to activity counts.

```prisma
model ActivityAdjustment {
  id        String   @id @default(uuid())
  day       String   // YYYY-MM-DD format
  category  String
  value     Int
  createdAt DateTime @default(now())
  
  @@unique([day, category])
}
```

**Purpose:** Allows staff to override calculated counts in monthly reports.

#### `Staff`
Admin user accounts.

```prisma
model Staff {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String
  role         String   @default("ADMIN")
  createdAt    DateTime @default(now())
}
```

---

## API Endpoints

### Activity Endpoints

#### `POST /api/activity`
Create individual activity entry.

**Request Body:**
```json
{
  "uid": "participant-uid",
  "categories": ["Wellness", "Drop-In"]
}
```

**Response:**
```json
{
  "success": true,
  "count": 2
}
```

#### `POST /api/activity/group`
Create group event (anonymous bulk entry).

**Request Body:**
```json
{
  "day": "2026-07-15",
  "categories": ["Training/Focus Group"],
  "attendeeCount": 50
}
```

**Response:**
```json
{
  "success": true,
  "created": 1
}
```

#### `GET /api/activity/group`
Get recent group events (last 50, filtered to attendeeCount > 1).

**Response:**
```json
{
  "events": [
    {
      "id": "uuid",
      "category": "Training/Focus Group",
      "attendeeCount": 50,
      "createdAt": "2026-07-15T14:30:00Z"
    }
  ]
}
```

#### `DELETE /api/activity/[id]`
Delete a specific activity.

**Response:**
```json
{
  "success": true
}
```

#### `POST /api/activity/manual`
Create activity for specific registered participant (staff use).

**Request Body:**
```json
{
  "registrationId": "uuid",
  "categories": ["Wellness"],
  "day": "2026-07-15"
}
```

#### `GET /api/activity/by-person-details`
Get activities for a person grouped by day.

**Query Params:**
- `registrationId`: UUID
- `start`: YYYY-MM-DD
- `end`: YYYY-MM-DD

**Response:**
```json
{
  "days": [
    {
      "day": "2026-07-15",
      "count": 3,
      "activities": [
        {
          "id": "uuid",
          "category": "Wellness",
          "createdAt": "2026-07-15T10:30:00Z",
          "attendeeCount": 1
        }
      ]
    }
  ]
}
```

#### `POST /api/activity/bulk-update-date`
Move all activities for a person on one day to another date.

**Request Body:**
```json
{
  "registrationId": "uuid",
  "oldDate": "2026-07-15",
  "newDate": "2026-07-16"
}
```

**Response:**
```json
{
  "updated": 3
}
```

**Implementation:**
```typescript
// Preserves time-of-day when moving dates
const activities = await prisma.activity.findMany({
  where: {
    registrationId,
    createdAt: { gte: oldStart, lte: oldEnd }
  }
});

for (const activity of activities) {
  const time = activity.createdAt.toISOString().slice(11); // HH:mm:ss.sssZ
  const newTimestamp = new Date(newDate + 'T' + time);
  await prisma.activity.update({
    where: { id: activity.id },
    data: { createdAt: newTimestamp }
  });
}
```

### Report Endpoints

#### `GET /api/reports/activities-by-person`
Generate activity by person report with demographic filtering.

**Query Params:**
- `start`: YYYY-MM-DD (required)
- `end`: YYYY-MM-DD (required)
- `personName`: string (optional, contains search)
- `zip`: string (optional, exact match)
- `birthYear`: YYYY (optional)
- `veteranStatus`: string (optional)
- `sexualOrientation`: string (optional)
- `gender`: string (optional)
- `race`: string (optional)
- `ethnicity`: string (optional)
- `county`: string (optional)

**Response:**
```json
{
  "day": "2026-07-15",
  "start": "2026-07-01",
  "end": "2026-07-31",
  "totalPeople": 45,
  "totalVisits": 230,
  "totalUniqueVisits": 180,
  "items": [
    {
      "registration": {
        "id": "uuid",
        "fullName": "John Doe",
        "zipCode": "44308"
      },
      "total": 5,
      "uniqueDays": 3,
      "categories": {
        "Wellness": 3,
        "Drop-In": 2
      }
    }
  ]
}
```

**Key Logic:**
- `totalPeople`: Count of unique registrations with activities (includes both individual and anonymous group activities when no filters applied; only people matching filters when filters applied)
- `totalVisits`: Sum of all attendeeCount values
- `totalUniqueVisits`: Count of unique (registrationId, date) pairs
- Demographic filters applied BEFORE activity queries to ensure accurate counts

### Registration Endpoints

#### `POST /api/registrations`
Create new participant registration.

#### `GET /api/registrations`
List all registrations with optional filtering.

#### `PATCH /api/registrations/[id]`
Update registration details.

#### `DELETE /api/registrations/[id]`
Delete registration and all associated activities (CASCADE).

---

## Frontend Components

### Key Components

#### `ByPersonClient.tsx`
**Location:** `src/app/admin/activity/by-person/ByPersonClient.tsx`

**Features:**
- Date range and demographic filtering
- Person name autocomplete search
- Sticky table headers and first column
- Always-visible scrollbars
- Drill-down modal for editing activity dates
- CSV export
- Clear Filters button

**State Management:**
```typescript
const [startDay, setStartDay] = useState(/* from localStorage */);
const [endDay, setEndDay] = useState(/* from localStorage */);
const [personName, setPersonName] = useState("");
// ... other filter states
const [data, setData] = useState<ApiResponse | null>(null);
const [selectedPerson, setSelectedPerson] = useState<{id, name} | null>(null);
const [personDays, setPersonDays] = useState<DayActivity[]>([]);
```

**Key Functions:**
- `load()`: Fetch report data with filters
- `clearFilters()`: Reset all demographic filters
- `viewPersonDetails()`: Open drill-down modal
- `editDayDate()`: Bulk update activity dates

**Sticky Table CSS:**
```tsx
<div className="overflow-x-auto overflow-y-scroll max-h-[70vh] border">
  <table className="relative border-collapse">
    <thead className="sticky top-0 z-10 bg-white">
      <th className="sticky left-0 z-20 bg-white shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
        Person
      </th>
    </thead>
    <tbody>
      <td className="sticky left-0 z-10 bg-white shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)]">
        {name}
      </td>
    </tbody>
  </table>
</div>
```

#### `CollapsibleMonths.tsx`
**Location:** `src/app/admin/activity/CollapsibleMonths.tsx`

**Features:**
- Expandable monthly calendar view
- Day-by-day activity counts by category
- Editable cells for manual adjustments
- Sticky headers (day numbers) and category column
- Real-time updates via API

**Implementation:**
```typescript
// Groups activities by day and category
const byCategory: Record<ActivityCategory, number[]> = /* ... */;

// Applies manual adjustments
for (const adj of adjustments) {
  byCategory[adj.category][dayIndex] = adj.value;
}

// Renders editable cells
<EditableCell 
  value={count} 
  onSave={(val) => saveAdjustment(day, category, val)} 
/>
```

#### `EditableTable.tsx`
**Location:** `src/app/admin/registrations/EditableTable.tsx`

**Features:**
- Registration list with inline editing
- Delete functionality with confirmation
- Sticky headers and first two columns (Actions, Full Name)
- Edit modal for demographic updates

---

## Key Features Implementation

### 1. Sticky Table Navigation

**Problem:** Large tables with many columns lose context when scrolling.

**Solution:**
- Sticky header row (`position: sticky; top: 0`)
- Sticky first column(s) (`position: sticky; left: 0`)
- Z-index layering (header: 10, sticky column in header: 20, sticky column in body: 10)
- Shadow on sticky columns for visual separation
- Always-visible scrollbars via webkit styling

**Applied to:**
- Activity by Person report
- Registrations table
- Monthly activity calendar

### 2. Bulk Date Editing

**Problem:** Activities recorded on wrong date need correction.

**Solution:**
1. Click person name to view activities grouped by day
2. Each day shows all activities with timestamps
3. "Edit Date" button moves ALL activities from that day to new date
4. Preserves original time-of-day (only changes date component)
5. Auto-refreshes both detail view and main report

**API Flow:**
```
User clicks person name
  → GET /api/activity/by-person-details
  → Display modal with days grouped

User clicks "Edit Date" for a day
  → Prompt for new date
  → POST /api/activity/bulk-update-date
  → Update all activities for that person on that day
  → Refresh modal data
  → Refresh main report
```

### 3. Anonymous Group Events

**Problem:** Need to track group activities without individual participant names.

**Solution:**
- `registrationId` is nullable in Activity table
- Group Event Entry form accepts attendeeCount
- One activity record created per category, null registrationId
- Report queries handle both individual and anonymous activities
- Recent events view filters out orphaned single-person activities (attendeeCount > 1)

**Example:**
```typescript
// Create group event with 50 attendees
await prisma.activity.create({
  data: {
    registrationId: null,
    category: "Training/Focus Group",
    attendeeCount: 50,
    createdAt: new Date(day)
  }
});

// This contributes 50 to totalVisits for that day
```

### 4. Demographic Filtering

**Problem:** Need to generate reports for specific demographics without counting excluded people.

**Solution:**
1. Apply demographic filters to Registration table FIRST
2. Get list of matching registrationIds
3. Query activities only for those registrationIds
4. Calculate totalPeople based on filtered set

**Implementation:**
```typescript
// Step 1: Filter registrations
const regs = await prisma.registration.findMany({
  where: {
    zipCode: filters.zip,
    birthYear: filters.birthYear,
    // ... other filters
  }
});

const regIds = regs.map(r => r.id);

// Step 2: Query activities for filtered people only
const activities = await prisma.activity.findMany({
  where: {
    registrationId: { in: regIds },
    createdAt: { gte: start, lte: end }
  }
});

// Step 3: Calculate totals from filtered set
const totalPeople = regIds.length;
```

### 5. Filter Layout with Clear Button

**Problem:** Many filters wrap awkwardly; resetting requires clicking each one.

**Solution:**
- Wrap each label+input in flex container with `whitespace-nowrap`
- Labels always stay on same line as their input
- "Clear Filters" button resets all state at once
- Red border styling for visual distinction

**Implementation:**
```tsx
<div className="flex items-center gap-2">
  <label className="text-sm whitespace-nowrap">ZIP</label>
  <input value={zip} onChange={setZip} />
</div>

<button onClick={clearFilters} className="border-red-300 text-red-600">
  Clear Filters
</button>
```

---

## Deployment Process

### Development → Production Flow

```
Local Mac (Port 3004)          →    Windows Server (Port 3000)
-------------------                 -----------------------
1. Make code changes                1. Pull from GitHub
2. npm run build                    2. npm run build
3. PORT=3004 npm run start          3. nssm restart HopeUnited-Node
4. Test on localhost:3004
5. git add . && git commit -m "..."
6. git push
```

### Windows Production Deployment

**Prerequisites:**
- Node.js 20.20.0+ installed
- PostgreSQL 16+ installed and running
- NSSM installed for service management
- Repository cloned to `C:\HopeUnited`

**Initial Setup (One-time):**

```powershell
# 1. Navigate to project
cd C:\HopeUnited

# 2. Install dependencies
npm install

# 3. Create .env file
echo DATABASE_URL=postgresql://postgres:password@localhost:5432/hope_united > .env

# 4. Run migrations
npx prisma migrate deploy

# 5. Generate Prisma client
npx prisma generate

# 6. Build application
npm run build

# 7. Install Windows service with NSSM
nssm install HopeUnited-Node "C:\Program Files\nodejs\node.exe"
nssm set HopeUnited-Node AppDirectory "C:\HopeUnited"
nssm set HopeUnited-Node AppParameters "node_modules\.bin\next start"
nssm set HopeUnited-Node AppEnvironmentExtra "PORT=3000"
nssm set HopeUnited-Node Start SERVICE_AUTO_START
nssm start HopeUnited-Node
```

**Regular Updates:**

```powershell
cd C:\HopeUnited
git pull
npm run build
nssm restart HopeUnited-Node
```

**Database Migrations (if needed):**

```powershell
# Check for new migrations
git pull

# Apply migrations
npx prisma migrate deploy

# Regenerate client (if schema changed)
npx prisma generate

# Rebuild and restart
npm run build
nssm restart HopeUnited-Node
```

**Adding New Enum Values (e.g., new County):**

```powershell
# Manual SQL required for enum changes
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d hope_united -c "ALTER TYPE \"County\" ADD VALUE IF NOT EXISTS 'NEW_COUNTY';"

# Then generate and rebuild
npx prisma generate
npm run build
nssm restart HopeUnited-Node
```

---

## Common Maintenance Tasks

### Adding a New Activity Category

**1. Update constant:**
`src/lib/activityCategories.ts`
```typescript
export const ACTIVITY_CATEGORIES = [
  // ... existing
  "New Category",
] as const;
```

**2. Rebuild and deploy:**
```bash
npm run build
# Deploy to Windows
```

**Note:** No database migration needed - categories stored as strings.

### Adding a New Demographic Filter

**1. Add to Prisma schema (if new field):**
`prisma/schema.prisma`
```prisma
model Registration {
  // ... existing fields
  newField String?
}
```

**2. Create migration:**
```bash
npx prisma migrate dev --name add_new_field
```

**3. Update API route:**
`src/app/api/reports/activities-by-person/route.ts`
```typescript
const querySchema = z.object({
  // ... existing
  newField: z.string().optional(),
});

// Add to filter logic
if (filters.newField) regWhereClause.newField = filters.newField;
```

**4. Update client component:**
`src/app/admin/activity/by-person/ByPersonClient.tsx`
```typescript
const [newField, setNewField] = useState("");

// Add to filters UI
<div className="flex items-center gap-2">
  <label className="text-sm whitespace-nowrap">New Field</label>
  <Select value={newField} onChange={setNewField} options={[...]} />
</div>

// Add to load() API params
if (newField) apiParams.set('newField', newField);

// Add to clearFilters()
setNewField("");
```

**5. Update registration forms** to capture the new field.

### Modifying Report Calculations

**Example: Change how totalPeople is calculated**

**Location:** `src/app/api/reports/activities-by-person/route.ts`

```typescript
// Current logic (lines ~120-140)
const totalPeople = hasFilters 
  ? peopleWithActivities.size 
  : allPeopleCount + (anonymousVisits > 0 ? 1 : 0);

// Modify as needed, e.g., always exclude anonymous:
const totalPeople = peopleWithActivities.size;
```

### Adding a New Report

**1. Create page:**
`src/app/admin/reports/new-report/page.tsx`

**2. Create API endpoint:**
`src/app/api/reports/new-report/route.ts`

**3. Create client component:**
`src/app/admin/reports/new-report/NewReportClient.tsx`

**4. Add navigation link:**
`src/app/admin/page.tsx`

**5. Follow patterns from existing reports** (by-person, activities-by-person, etc.)

---

## Troubleshooting

### Build Errors

**Error: "Node.js version >=20.9.0 is required"**
```bash
node --version  # Check current version
nvm use 20.20.0  # Switch to correct version
```

**Error: Module not found**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Error: Prisma client out of sync**
```bash
npx prisma generate
npm run build
```

### Runtime Errors

**Error: "Can't reach database server"**
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Test connection: `psql -U postgres -d hope_united`

**Error: 500 on CSS/JS chunks**
```bash
rm -rf .next
npm run build
```

**Error: Filter reset after 70 seconds (HMR issue)**
- Ensure running production mode (`npm run start`), NOT dev mode
- Dev mode causes HMR reconnection attempts → full page reload

### Service Management (Windows)

**Service won't start:**
```powershell
# Check service status
nssm status HopeUnited-Node

# View service logs
nssm set HopeUnited-Node AppStdout C:\HopeUnited\stdout.log
nssm set HopeUnited-Node AppStderr C:\HopeUnited\stderr.log
nssm restart HopeUnited-Node
type C:\HopeUnited\stderr.log
```

**Port already in use:**
```powershell
# Find process on port 3000
netstat -ano | findstr :3000
# Kill process (replace PID)
taskkill /PID <PID> /F
```

### Database Issues

**Orphaned activities (deleted registrations):**
- Activities remain if registration deleted before CASCADE setup
- Filter with `attendeeCount > 1` in group events view (already implemented)
- Clean up manually if needed:
  ```sql
  DELETE FROM "Activity" WHERE "registrationId" IS NOT NULL 
    AND "registrationId" NOT IN (SELECT id FROM "Registration");
  ```

**Enum value not found:**
```sql
-- Check existing values
SELECT enumlabel FROM pg_enum WHERE enumtypid = 'County'::regtype;

-- Add missing value
ALTER TYPE "County" ADD VALUE IF NOT EXISTS 'MEDINA';
```

---

## Security Considerations

### Authentication

**Current Implementation:**
- Middleware-based authentication (`src/middleware.ts`)
- Session cookies
- Admin routes protected at middleware level
- Individual API endpoints do NOT check auth (rely on middleware)

**Important:** If adding new authenticated routes, ensure middleware covers the path.

### Data Privacy

**Participant Data:**
- All demographic fields support "REFUSED" option
- Signatures stored as base64 in database
- No personally identifiable information exposed in logs
- Anonymous group events have null `registrationId`

**Best Practices:**
- Never log `eSignatureImage` or other PII
- Use parameterized queries (Prisma handles this)
- Sanitize user inputs via Zod schemas
- HTTPS required in production (configured at reverse proxy/IIS level)

### Input Validation

**All API endpoints use Zod schemas:**
```typescript
const schema = z.object({
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  categories: z.array(z.string()),
  attendeeCount: z.number().int().min(1)
});

const parsed = schema.safeParse(body);
if (!parsed.success) {
  return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
}
```

**SQL Injection Prevention:**
- Prisma ORM prevents SQL injection
- Never use raw SQL without parameterization
- If raw SQL needed, use Prisma's `$queryRaw` with parameters

### Dependency Management

**Regular Updates:**
```bash
# Check for outdated packages
npm outdated

# Update dependencies (test thoroughly after)
npm update

# Security audit
npm audit
npm audit fix
```

---

## Performance Optimization

### Database Indexes

**Current indexes:**
```prisma
model Activity {
  @@index([registrationId])
  @@index([createdAt])
  @@index([category])
}
```

**Add indexes if queries are slow:**
```bash
# Create migration for new index
npx prisma migrate dev --name add_index_to_field
```

### Query Optimization

**Use Prisma's select to limit fields:**
```typescript
const regs = await prisma.registration.findMany({
  select: { id: true, fullName: true, zipCode: true },  // Only needed fields
  where: { ... }
});
```

**Avoid N+1 queries:**
```typescript
// BAD: Separate query per activity
for (const activity of activities) {
  const reg = await prisma.registration.findUnique({ where: { id: activity.registrationId } });
}

// GOOD: Single query with include
const activities = await prisma.activity.findMany({
  include: { registration: true }
});
```

### Frontend Optimization

**Sticky tables use CSS-only solution** (no JavaScript scrolling)
- Hardware-accelerated via `position: sticky`
- Minimal performance impact

**Large lists:**
- Consider pagination if reports exceed 1000 rows
- Current implementation loads all data (acceptable for typical use case)

---

## Version History

### Version 1.1 (July 2026)
- Added bulk date editing feature
- Implemented sticky headers and columns on all major tables
- Added "Clear Filters" button
- Improved filter layout (labels stay with inputs)
- Fixed authentication issues on new endpoints
- Enhanced user manual with all new features

### Version 1.0 (June 2026)
- Initial production release
- Registration and activity tracking
- Group event entry
- Monthly activity reports
- Activity by person reports
- Excel export functionality
- Manual activity entry
- Group event deletion

---

## Contact and Support

For questions about this documentation or the system:

1. Review this technical documentation
2. Check user manual at `/hope-united-user-manual.html`
3. Examine code comments in relevant files
4. Test changes on local development environment (port 3004) before deploying to production

**Key Files for Reference:**
- Database schema: `prisma/schema.prisma`
- Activity categories: `src/lib/activityCategories.ts`
- Main activity report: `src/app/admin/activity/page.tsx`
- Activity by person: `src/app/admin/activity/by-person/ByPersonClient.tsx`
- API routes: `src/app/api/`

---

## Appendix: Activity Categories

Current categories (as of July 2026):
- Wellness
- Recovery Meeting
- Drop-In
- Veteran Programming
- Social Event
- Volunteer
- Peer Support
- Family Support
- Art
- Training/Focus Group
- Tour/Outreach
- Faith-Based
- Personal Growth
- Event
- Board Meeting
- Bus Pass
- Virtual Reality
- The Retreat Virtual Reality
- Community Service

**Adding new categories:** Edit `src/lib/activityCategories.ts` and rebuild. No database migration required.

---

**End of Technical Documentation**
