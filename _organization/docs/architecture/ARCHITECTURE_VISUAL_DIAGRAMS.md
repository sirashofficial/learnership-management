# 🎨 YEHA Project - Comprehensive Architecture Diagrams

**Generated:** February 23, 2026  
**Purpose:** Visual representations of system architecture, dependencies, and data flows  
**Companion to:** COMPREHENSIVE_ARCHITECTURE_SITEMAP.md

---

## 1. Complete System Architecture Diagram

```mermaid
graph TB
    subgraph Client["🌐 Client Layer"]
        Browser["Web Browser"]
        LocalStorage["LocalStorage<br/>JWT Token & User Data"]
    end

    subgraph Frontend["📦 Next.js Frontend"]
        Pages["Pages & Routes<br/>dashboard, groups,<br/>students, assessments"]
        Components["React Components<br/>UI, modals, forms,<br/>tables, charts"]
        Hooks["Custom Hooks<br/>useStudents, useGroups,<br/>useApi, useAsync"]
        Contexts["Context Providers<br/>AuthContext,<br/>GroupsContext"]
    end

    subgraph CacheLayer["💾 Caching"]
        SWR["SWR Cache<br/>Stale-while-revalidate<br/>15-300 sec TTL"]
        GlobalCache["Global Cache<br/>useApi Map<br/>30 sec TTL"]
        HTTPCache["HTTP Cache Headers<br/>Cache-Control"]
    end

    subgraph BackendAPI["⚙️ Next.js API Routes"]
        AuthAPI["Auth Routes<br/>/api/auth/*"]
        DataAPI["Data Routes<br/>/api/students<br/>/api/groups<br/>/api/assessments"]
        GenerationAPI["Generation Routes<br/>/api/ai/*"]
        ReportAPI["Report Routes<br/>/api/reports/*"]
        MiscAPI["Misc Routes<br/>/api/undo<br/>/api/search"]
    end

    subgraph Middleware["🔐 Security & Validation"]
        AuthMiddleware["Authentication<br/>JWT verification<br/>User extraction"]
        RoleMiddleware["Authorization<br/>Role checking<br/>Permissions"]
        RateLimiter["Rate Limiting<br/>Per-endpoint<br/>Per-IP"]
        InputValidation["Input Validation<br/>Zod schemas"]
    end

    subgraph DataLayer["🗄️ Data Layer"]
        Prisma["Prisma Client<br/>ORM & Client lib<br/>Type-safe queries"]
        SQLite["SQLite Database<br/>File-based<br/>ACID transactions"]
    end

    subgraph AIServices["🤖 AI Integrations"]
        GoogleAI["Google Gemini<br/>Lesson generation<br/>Assessment creation"]
        CohereAI["Cohere AI<br/>Embeddings<br/>Chat completion<br/>Question generation"]
        Pinecone["Pinecone<br/>Vector database<br/>Semantic search<br/>1024-dim embeddings"]
        ZAI["Z.AI Local<br/>OpenAI-compatible<br/>Fallback inference"]
    end

    subgraph ThirdParty["🔗 External Services"]
        Resend["Resend<br/>Email API"]
        FileSystem["Filesystem<br/>PDF/Doc storage"]
    end

    Browser -->|Store/Retrieve| LocalStorage
    Browser -->|Load/Interact| Pages
    Pages -->|Compose| Components
    Pages -->|Use| Hooks
    Pages -->|Use| Contexts
    Components -->|Use| Hooks
    
    Hooks -->|Fetch & Cache| SWR
    Hooks -->|Fallback Cache| GlobalCache
    SWR -->|HTTP Headers| HTTPCache
    
    Hooks -->|API Calls| DataAPI
    Hooks -->|API Calls| GenerationAPI
    
    DataAPI -->|Check Auth| AuthMiddleware
    DataAPI -->|Check Role| RoleMiddleware
    DataAPI -->|Rate Limit| RateLimiter
    DataAPI -->|Validate Input| InputValidation
    GenerationAPI -->|Check Auth| AuthMiddleware
    ReportAPI -->|Check Auth| AuthMiddleware
    
    DataAPI -->|Query/Update| Prisma
    ReportAPI -->|Query| Prisma
    GenerationAPI -->|Query| Prisma
    
    Prisma -->|Execute SQL| SQLite
    
    GenerationAPI -->|Call| GoogleAI
    GenerationAPI -->|Call| CohereAI
    GenerationAPI -->|Query| Pinecone
    GenerationAPI -->|Fallback| ZAI
    ReportAPI -->|Send Email| Resend
    DataAPI -->|Store/Read| FileSystem
    
    GoogleAI -.->|Optional APIs| CohereAI
    CohereAI -->|Index| Pinecone

    style Client fill:#e1f5ff
    style Frontend fill:#f3e5f5
    style CacheLayer fill:#fff9c4
    style BackendAPI fill:#c8e6c9
    style Middleware fill:#ffccbc
    style DataLayer fill:#f0f4c3
    style AIServices fill:#d1c4e9
    style ThirdParty fill:#f8bbd0
```

---

## 2. Data Request Flow Diagram

```mermaid
sequenceDiagram
    participant User as User/Browser
    participant Component as React Component
    participant Hook as Custom Hook (SWR)
    participant Cache as Cache Layer
    participant API as API Route Handler
    participant DB as SQLite Database
    participant AI as AI Services

    User->>Component: User Action (e.g., view students)
    Component->>Hook: const { data } = useStudents(groupId)
    
    Hook->>Cache: Check cache for /api/students?groupId=X
    alt Cache Hit (not expired)
        Cache-->>Hook: Return cached data
        Hook-->>Component: Return data
        Component-->>User: Render UI with data
    else Cache Miss or Expired
        Hook->>API: GET /api/students?groupId=X
        API->>API: Extract user from JWT
        API->>API: Check user has access
        API->>DB: SELECT students WHERE groupId = X
        DB-->>API: Return student records
        API->>API: Calculate computed fields (progress, status)
        API->>API: Format pagination response
        API-->>Hook: 200 OK {data, pagination}
        Hook->>Cache: Update cache
        Hook-->>Component: Return data
        Component-->>User: Render UI with data
        Note over Cache: Cache TTL: 30 seconds
    end

    User->>Component: Edit student
    Component->>Hook: mutation(putStudentUpdate)
    Hook->>API: PUT /api/students/[studentId]
    API->>DB: UPDATE students SET...
    DB-->>API: Success
    API-->>Hook: 200 OK {updated data}
    Hook->>Cache: Invalidate cache
    Hook->>API: GET /api/students (revalidate)
    API-->>Hook: Fresh data
    Hook-->>Component: Updated data
    Component-->>User: Show changes
```

---

## 3. State Management Hierarchy

```mermaid
graph TB
    subgraph Component["🔷 Component Level"]
        LocalState["useState<br/>- Modal visibility<br/>- Form values<br/>- UI state<br/>- Loading spinners"]
    end

    subgraph Context["🔶 Context Level<br/>Provides global access"  ]
        Auth["AuthContext<br/>- Current user<br/>- JWT token<br/>- login/logout<br/>- isAuthenticated"]
        Groups["GroupsContext<br/>- Groups list<br/>- Selected group<br/>- Full group details<br/>- Refresh fn"]
        Student["StudentContext<br/>- Students list<br/>- Selected student<br/>- Student progress<br/>- Update fn"]
    end

    subgraph Request["🔷 Request Hook Level<br/>Provides caching"  ]
        Cache1["useStudents()<br/>- Fetches students<br/>- SWR cache<br/>- Auto-refresh<br/>- Pagination"]
        Cache2["useGroups()<br/>- Fetches groups<br/>- SWR cache<br/>- Relationships<br/>- Sorting"]
        Cache3["useAssessments()<br/>- Fetches assessments<br/>- Filter support<br/>- Moderation state<br/>- Results"]
        Cache4["useApi()<br/>- Generic hook<br/>- Global cache<br/>- Deduplication<br/>- Retry logic"]
    end

    subgraph APIs["🔷 API Layer<br/>Single source of truth"  ]
        API1["/api/students<br/>- Query DB<br/>- Auth check<br/>- Pagination<br/>- Calculated fields"]
        API2["/api/groups<br/>- Query DB<br/>- Include relations<br/>- Count aggregates<br/>- Status calc"]
        API3["/api/assessments<br/>- Query DB<br/>- Moderation filter<br/>- Joined data<br/>- Scoring"]
    end

    subgraph Database["🔷 Database Layer<br/>Truth & Persistence"  ]
        DB["SQLite Database<br/>- Tables (students, groups, etc)<br/>- Indexes<br/>- Relationships<br/>- Transactions"]
    end

    LocalState -->|Stores temp UI state| Context
    Context -->|Provides global values| Request
    Request -->|Fetches fresh from| APIs
    APIs -->|Queries| Database

    Database -.->|Notify on change| Request
    Request -.->|Update| Context
    Context -.->|Re-render| LocalState

    style Component fill:#e3f2fd
    style Context fill:#f3e5f5
    style Request fill:#fff9c4
    style APIs fill:#c8e6c9
    style Database fill:#f0f4c3
```

---

## 4. API Routes Dependency Map

```mermaid
graph LR
    subgraph Core["Core APIs"]
        Auth["🔐 Auth<br/>/api/auth"]
        Students["👥 Students<br/>/api/students"]
        Groups["👨‍👩‍👧‍👦 Groups<br/>/api/groups"]
    end

    subgraph Operations["Operations APIs"]
        Assessments["📝 Assessments<br/>/api/assessments"]
        Attendance["✅ Attendance<br/>/api/attendance"]
        Sessions["📅 Sessions<br/>/api/sessions"]
    end

    subgraph Computed["Computed APIs<br/>Depend on Core"]
        Progress["📊 Progress<br/>/api/progress"]
        Dashboard["🏠 Dashboard<br/>/api/dashboard"]
        Reports["📄 Reports<br/>/api/reports"]
    end

    subgraph AI["AI APIs"]
        Chat["💬 Chat<br/>/api/ai/chat"]
        Generate["🎨 Generate<br/>/api/ai/generate-*"]
        Search["🔍 Search<br/>/api/ai/semantic-search"]
    end

    subgraph Utils["Utility APIs"]
        Undo["↩️ Undo<br/>/api/undo"]
        Search2["🔍 Global Search<br/>/api/search"]
    end

    Auth -->|Authorizes| Students
    Auth -->|Authorizes| Groups
    Auth -->|Authorizes| Assessments
    Auth -->|Authorizes| Attendance
    
    Students -->|Uses| Progress
    Students -->|Uses| Dashboard
    Students -->|Uses| Reports
    Groups -->|Uses| Progress
    Groups -->|Uses| Dashboard
    Groups -->|Uses| Reports
    Assessments -->|Uses| Progress
    Attendance -->|Uses| Progress
    
    Chat -->|Reads| Students
    Chat -->|Reads| Groups
    Generate -->|Reads| Students
    Search -->|Searches| Progress
    
    Reports -->|Calls| Chat
    Reports -->|Calls| Generate
    
    Progress -->|Data for| Undo
    Assessments -->|Data for| Undo
    Attendance -->|Data for| Undo

    style Core fill:#e1f5ff
    style Operations fill:#f3e5f5
    style Computed fill:#fff9c4
    style AI fill:#fce4ec
    style Utils fill:#f1f8e9
```

---

## 5. Database Entity Relationships

```mermaid
erDiagram
    USER ||--o{ GROUP : facilitates
    USER ||--o{ SESSION : leads
    USER ||--o{ LESSONPLAN : creates
    USER ||--o{ REMINDERPREFERENCE : configures
    
    COMPANY ||--o{ GROUP : "1 to many"
    
    GROUP ||--o{ STUDENT : contains
    GROUP ||--o{ SESSION : hosts
    GROUP ||--o{ GROUPSCHEDULE : schedules
    GROUP ||--o{ GROUPROLLOUTPLAN : "1 to 1"
    GROUP ||--o{ ROLLOUTPLAN : plans
    GROUP ||--o{ UNITSTANDARDROLLOUT : schedules
    GROUP ||--o{ FACILITATORTASK : has
    
    STUDENT ||--o{ ASSESSMENT : "takes"
    STUDENT ||--o{ ATTENDANCE : "has"
    STUDENT ||--o{ MODULEPROGRESS : "tracks"
    STUDENT ||--o{ UNITSTANDARDPROGRESS : "tracks"
    STUDENT ||--o{ FORMATIVECOMPLETION : "completes"
    STUDENT ||--o{ POECHECKLIST : "maintains"
    STUDENT ||--o{ ATTENDANCEALERT : "triggered by"
    STUDENT ||--o{ COURSEPROGRESS : "has"
    
    MODULE ||--o{ FORMATIVEASSESSMENT : contains
    MODULE ||--o{ UNITSTANDARD : "contains"
    MODULE ||--o{ SESSION : "subject of"
    MODULE ||--o{ ROLLOUTPLAN : "has planning"
    MODULE ||--o{ MODULEPROGRESS : "tracked by"
    MODULE ||--o{ CURRICULUMDOCUMENT : "has"
    MODULE ||--o{ CURRICULUMEMBEDDING : "indexed by"
    
    UNITSTANDARD ||--o{ ASSESSMENT : "assessed by"
    UNITSTANDARD ||--o{ FORMATIVEASSESSMENT : "includes"
    UNITSTANDARD ||--o{ UNITSTANDARDPROGRESS : "tracked by"
    UNITSTANDARD ||--o{ UNITSTANDARDROLLOUT : "has schedule"
    
    SESSION ||--o{ ATTENDANCE : "records"
    SESSION ||--o{ GROUPSCHEDULE : "scheduled as"
    
    ROLLOUTPLAN ||--o{ UNITSTANDARDROLLOUT : "plan's"
    
    FORMATIVEASSESSMENT ||--o{ FORMATIVECOMPLETION : "completed by"
    
    COURSE ||--o{ COURSEPROGRESS : "tracked by"
    COURSE ||--o{ GROUPCOURSE : "assigned to"
    
    GROUPCOURSE ||--o{ GROUP : "belongs to"
    
    POEFILE ||--o{ POECHECKLIST : "attached to"
```

---

## 6. Request Authorization Flow

```mermaid
graph TD
    A["Request arrives<br/>GET /api/students"]
    B["Extract JWT from<br/>Authorization header"]
    C{"JWT exists?"}
    C -->|No| D["Return 401<br/>Unauthorized"]
    C -->|Yes| E["Verify JWT signature<br/>Check expiration"]
    F{"Token valid?"}
    F -->|No| D
    F -->|Yes| G["Extract user info<br/>userId, email, role"]
    H["Check required role<br/>for this endpoint"]
    I{"User authorized?"}
    I -->|No| J["Return 403<br/>Forbidden"]
    I -->|Yes| K["Check rate limit<br/>Requests per IP per minute"]
    L{"Within limit?"}
    L -->|No| M["Return 429<br/>Too Many Requests"]
    L -->|Yes| N["Validate input params<br/>Zod validation"]
    O{"Input valid?"}
    O -->|No| P["Return 400<br/>Bad Request"]
    O -->|Yes| Q["Execute business logic<br/>Query DB, call AI, etc"]
    Q -->|Success| R["Return 200 OK<br/>with data"]
    Q -->|Error| S["Return 500<br/>Server Error"]

    style A fill:#e1f5ff
    style D fill:#ffcdd2
    style J fill:#ffcdd2
    style M fill:#ffcdd2
    style P fill:#ffcdd2
    style R fill:#c8e6c9
    style S fill:#ffcdd2
```

---

## 7. Caching Strategy Timeline

```
Request Timeline (Example: GET /api/students)
════════════════════════════════════════════════════════════════════════

T=0ms         T=500ms         T=1s         T=10s        T=30s
│             │               │            │            │
├─ Request    │               │            │            │
│  API        │               │            │            │
│             │               │            │            │
├────────────────────────────────────────────────────────┤
│  SWR Cache: FRESH (use cached data immediately)       │
├────────────────────────────────────────────────────────┤
        Response rendered
        No network request
        
T=30s+       T=31s           T=32s        T=35s        T=40s
│            │               │            │            │
├─ Cache     │               │            │            │
│  STALE     │               │            │            │
│            │               │            │            │
├────────────────┬───────────────────────────────────────┤
│ Still show     │ Background refresh kicked off         │
│ cached data    │                                       │
│                │                                       │
│                ├────────────────────┬──────────────────┤
│                │ API call in flight │                 │
│                │                    │                 │
│                │                    └─────────────────┤
│                │                    Data received,
│                │                    cache updated,
│                │                    UI re-renders
│
Revalidation Triggers:
├─ Page focus (revalidateOnFocus: true)
├─ Network reconnection
├─ Manual mutation call
└─ Time-based refresh (RefreshInterval: 30000ms)

Deduplication Window (5 seconds):
├─ Request 1: GET /api/students
├─ Request 2 (same URL within 5s): Merged with Request 1
└─ Only 1 network request sent to server
```

---

## 8. AI Integration Flow

```mermaid
graph TB
    subgraph UserAction["👤 User Action"]
        A["User requests<br/>lesson generation"]
    end

    subgraph Processing["⚙️ Processing Phase"]
        B["GET /api/curriculum<br/>fetch module info"]
        C["GET /api/ai/semantic-search<br/>find relevant docs"]
        D["POST /api/ai/generate-lesson<br/>send to Google Gemini"]
    end

    subgraph AI["🤖 AI Providers"]
        E["Google Gemini API<br/>Generate lesson structure"]
        F["Cohere AI<br/>Generate embeddings"]
        G["Pinecone<br/>Vector similarity search"]
    end

    subgraph Output["📤 Output"]
        H["Format lesson plan<br/>activities, timeline"]
        I["Save to database<br/>optional"]
        J["Return to UI<br/>display/download/edit"]
    end

    A --> B
    B --> C
    C -->|Query vector DB<br/>get curriculum context| G
    G -->|Relevant docs| F
    F -->|Embeddings| G
    C -->|Curriculum context| D
    D -->|Generate lesson| E
    E -->|Formatted response| H
    H --> I
    H --> J

    style UserAction fill:#e1f5ff
    style Processing fill:#fff9c4
    style AI fill:#fce4ec
    style Output fill:#c8e6c9
```

---

## 9. Data Freshness Guarantee

```mermaid
graph TB
    subgraph Write["✏️ Write Operation"]
        A["User submits form"]
        B["POST /api/assessments<br/>update grade"]
        C["Database updated<br/>assessment.result = COMPETENT"]
    end

    subgraph Invalidation["🔄 Invalidation"]
        D["API response received"]
        E["SWR mutate called"]
        F["Cache invalidated<br/>flag data as stale"]
        G["Trigger background<br/>revalidation"]
    end

    subgraph Refresh["🔃 Refresh"]
        H["GET /api/assessments<br/>fresh from DB"]
        I["Database returns<br/>latest assessment"]
        J["SWR cache updated<br/>with fresh data"]
    end

    subgraph UI["🎨 UI Update"]
        K["Component receives<br/>updated data"]
        L["React re-renders<br/>show new assessment"]
        M["User sees<br/>COMPETENT status"]
    end

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> J
    J --> K
    K --> L
    L --> M

    style Write fill:#c8e6c9
    style Invalidation fill:#fff9c4
    style Refresh fill:#e1f5ff
    style UI fill:#f3e5f5
```

---

## 10. Security & Authentication Sequence

```mermaid
sequenceDiagram
    participant User as User
    participant Client as Browser/Client
    participant Middleware as Auth Middleware
    participant API as API Route
    participant DB as Database

    User->>Client: Enter email & password
    Client->>API: POST /api/auth/login
    API->>DB: SELECT user WHERE email = ?
    DB-->>API: User found { password_hash }
    API->>API: bcrypt.compare(input_pwd, hash)
    API->>API: Create JWT token { userId, role, exp }
    API-->>Client: 200 OK { token, user }
    Client->>Client: localStorage.setItem('token')
    Client->>User: Logged in ✓

    rect rgb(200, 220, 255)
    Note over User,DB: Subsequent requests
    User->>Client: Click "View assessments"
    Client->>API: GET /api/assessments
    Note over API: Add Authorization header
    Client->>Middleware: Authorization: Bearer token
    Middleware->>Middleware: Verify JWT signature
    Middleware->>Middleware: Check expiration
    Middleware->>Middleware: Extract userId, role
    API->>API: Check if role allows this endpoint
    API->>DB: SELECT assessments WHERE...
    DB-->>API: Results
    API-->>Client: 200 OK { data }
    Client->>User: Display assessments
    end

    User->>Client: Logout
    Client->>Client: localStorage.removeItem('token')
    Client->>API: POST /api/auth/logout (optional)
    Client->>User: Logged out, redirect to login
```

---

## 11. Component Dependency Tree

```mermaid
graph TD
    App["RootLayout<br/>Providers + Middleware"]
    
    App -->|Page wrapper| MainLayout["MainLayout<br/>Sidebar + Header + Content"]
    
    MainLayout -->|Left column| Sidebar["Sidebar<br/>Navigation Menu<br/>- Dashboard<br/>- Groups<br/>- Students<br/>- Assessments<br/>- Attendance<br/>- Timetable<br/>- Curriculum"]
    
    MainLayout -->|Top row| Header["Header<br/>- Current page title<br/>- User info<br/>- Logout button"]
    
    MainLayout -->|Main area| Pages["Page Components"]
    
    Pages -->|Dashboard page| DashboardPage["Dashboard<br/>Home page"]
    Pages -->|Groups page| GroupsPage["Groups Manager<br/>List, create, edit"]
    Pages -->|Students page| StudentsPage["Students Manager<br/>List, create, edit"]
    Pages -->|Assessments page| AssessmentsPage["Assessments<br/>Mark, moderation, reports"]
    
    DashboardPage -->|Composed by| DashStats["DashboardStats<br/>Stats cards"]
    DashboardPage -->|Composed by| DashCharts["DashboardCharts<br/>Graphs & charts"]
    DashboardPage -->|Composed by| DashAlerts["DashboardAlerts<br/>Notification cards"]
    DashboardPage -->|Composed by| RecentActivity["RecentActivity<br/>Activity feed"]
    DashboardPage -->|Composed by| TodaysSchedule["TodaysSchedule<br/>Today's sessions"]
    
    GroupsPage -->|Shows| GroupCards["GroupCard<br/>Group grid/list"]
    GroupsPage -->|Has modal| GroupModal["GroupModal<br/>Create/edit form"]
    GroupsPage -->|Uses hook| GroupsHook["useGroups()<br/>Fetch & cache groups"]
    
    StudentsPage -->|Shows| StudentCards["StudentCard<br/>Student grid/list"]
    StudentsPage -->|Has modal| StudentModal["StudentModal<br/>Create/edit form"]
    StudentsPage -->|Uses hook| StudentsHook["useStudents()<br/>Fetch & cache students"]
    
    GroupsHook -->|Uses| SWRCache["SWR Cache<br/>Deduplication<br/>Refresh"]
    StudentsHook -->|Uses| SWRCache

    style App fill:#f3e5f5
    style MainLayout fill:#e1f5ff
    style Pages fill:#fff9c4
    style Sidebar fill:#c8e6c9
    style Header fill:#c8e6c9
    style SWRCache fill:#ffccbc
```

---

## 12. Error Handling Flow

```mermaid
graph TD
    A["API Request<br/>GET /api/students"]
    B{"Middleware<br/>Auth check"}
    B -->|Invalid token| C["Return 401<br/>Unauthorized"]
    B -->|Valid| D["Rate limiting<br/>check"]
    D -->|Exceeded| E["Return 429<br/>Too Many Requests"]
    D -->|OK| F["Input validation<br/>Zod schemas"]
    F -->|Invalid| G["Return 400<br/>Bad Request<br/>Include field errors"]
    F -->|Valid| H["Business logic<br/>Query database"]
    H -->|Generic error| I["Catch & log<br/>Return 500<br/>Server Error"]
    H -->|Not found| J["Return 404<br/>Not Found"]
    H -->|Success| K["Return 200<br/>Paginated data"]
    C -->|Handle in client| L["Show error modal<br/>Prompt re-auth"]
    E -->|Handle in client| M["Show error toast<br/>Retry suggested"]
    G -->|Handle in client| N["Highlight form fields<br/>Show error messages"]
    I -->|Handle in client| O["Log to sentry<br/>Show error boundary<br/>Offer refresh"]
    J -->|Handle in client| P["Redirect<br/>or show empty state"]
    K -->|Handle in client| Q["Update cache<br/>Render components"]

    style C fill:#ffcdd2
    style E fill:#ffcdd2
    style G fill:#ffcdd2
    style I fill:#ffcdd2
    style J fill:#fff9c4
    style K fill:#c8e6c9
    style L fill:#e1f5ff
    style Q fill:#e1f5ff
```

---

## 13. Real-Time Consideration (Polling Pattern)

```
Current Architecture (Interval Polling):
═══════════════════════════════════════════════════════

┌─────────────────────────────────────────────────┐
│         SWR Refresh Intervals (Per Feature)     │
├─────────────────────────────────────────────────┤
│                                                 │
│ Dashboard        ▓▓▓▓▓▓▓▓▓▓ 30 seconds          │
│ Students         ▓▓▓▓▓▓▓▓▓▓ 30 seconds          │
│ Attendance       ▓▓▓▓▓▓▓▓   15 seconds (live)   │
│ Assessments      ▓▓▓▓▓▓▓▓▓▓ 30 seconds          │
│ Curriculum       ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ 5 minutes     │
│ Sites            ▓▓▓▓▓▓▓▓▓▓▓▓ 2 minutes         │
│                                                 │
└─────────────────────────────────────────────────┘

Trade-offs:
┌──────────────────┬──────────────────┐
│ PROS             │ CONS             │
├──────────────────┼──────────────────┤
│ ✓ Simple         │ ✗ Higher latency │
│ ✓ No backend     │ ✗ More bandwidth │
│ ✓ Stateless      │ ✗ Perceived lag  │
│ ✓ Works offline* │ ✗ Not truly      │
│                  │   real-time      │
└──────────────────┴──────────────────┘

For true real-time, would need:
├─ WebSocket server (separate backend)
├─ Message queue (RabbitMQ, Kafka)
├─ Change data capture (CDC)
└─ Event broadcasting system
```

---

## 14. Database Load Optimization

```mermaid
graph TB
    subgraph Original["❌ N+1 Query Problem"]
        A["Get 20 students<br/>20 queries"]
        B["For each student<br/>get facilitator<br/>+20 queries"]
        C["Total: 21 queries!<br/>Slow page load"]
    end

    subgraph Optimized["✅ Optimized with Include"]
        D["Get 20 students<br/>+ include facilitator<br/>+ include group"]
        E["1 SQL query<br/>with JOINs"]
        F["Fast page load<br/>All data at once"]
    end

    subgraph Pagination["✅ Pagination"]
        G["Get students page 1<br/>limit 20, offset 0"]
        H["Single query<br/>returns 20 + count"]
        I["Scale to 1000s<br/>without slowdown"]
    end

    subgraph Index["✅ Database Indexes"]
        J["Create indexes:<br/>studentId<br/>groupId<br/>status"]
        K["WHERE groupId = X<br/>executes in<br/>milliseconds"]
        L["Fast filtering<br/>Large datasets"]
    end

    Original -->|Fixed by| Optimized
    Optimized -->|Combined with| Pagination
    Pagination -->|Enhanced with| Index

    style C fill:#ffcdd2
    style F fill:#c8e6c9
    style I fill:#c8e6c9
    style L fill:#c8e6c9
```

---

## 15. Deployment Architecture

```mermaid
graph TB
    subgraph Dev["👨‍💻 Development"]
        L1["npm run dev<br/>Hot reload<br/>Source maps<br/>Full logging"]
    end

    subgraph Build["🔨 Build Process"]
        L2["npm run build<br/>TypeScript → JS<br/>Prisma codegen<br/>Bundle optimization"]
    end

    subgraph Production["🚀 Production"]
        L3["npm start<br/>next/server CLI<br/>Optimized bundle<br/>Error handling"]
        L4["Environment .env<br/>DATABASE_URL<br/>JWT_SECRET<br/>API keys"]
        L5["SQLite Database<br/>/prisma/dev.db<br/>ACID transactions<br/>Data persistence"]
    end

    subgraph Monitor["📊 Monitoring"]
        L6["Application Logs<br/>console output<br/>Browser DevTools<br/>Server metrics"]
    end

    L1 -->|npm run build| L2
    L2 -->|output: .next/| L3
    L3 -->|loads| L4
    L3 -->|queries| L5
    L3 -->|outputs| L6

    style Dev fill:#e1f5ff
    style Build fill:#fff9c4
    style Production fill:#c8e6c9
    style Monitor fill:#f3e5f5
```

---

**End of Architecture Diagrams**

For detailed explanations of each diagram, refer to the corresponding section in the main COMPREHENSIVE_ARCHITECTURE_SITEMAP.md document.
