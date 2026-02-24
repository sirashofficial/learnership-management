# System Data Flow - Visual Mermaid Diagrams

## Complete System Architecture

```mermaid
graph TB
    subgraph Database["🗄️ DATABASE (Prisma)"]
        Users[("Users")]
        Students[("Students")]
        Groups[("Groups")]
        UnitStandards[("Unit Standards")]
        Modules[("Modules")]
        Sessions[("Sessions")]
        Assessments[("Assessments")]
        Attendance[("Attendance")]
    end

    subgraph APIs["🔌 API LAYER"]
        AuthAPI["🔐 Auth API<br/>/api/auth/*"]
        StatsAPI["📊 Stats API<br/>/api/dashboard/stats"]
        SummaryAPI["📋 Summary API<br/>/api/dashboard/summary"]
        GroupsAPI["👥 Groups API<br/>/api/groups"]
        AssessAPI["📝 Assessment API<br/>/api/assessments"]
        StudentAPI["🎓 Student API<br/>/api/students"]
        SessionAPI["📅 Session API<br/>/api/sessions"]
        AttendAPI["✅ Attendance API<br/>/api/attendance"]
    end

    subgraph Pages["📄 FRONTEND PAGES"]
        Dashboard["🏠 Dashboard<br/>src/app/page.tsx"]
        GroupsPage["👥 Groups Manager<br/>src/app/groups/page.tsx"]
        AssessPage["📝 Assessments<br/>src/app/assessments/page.tsx"]
        StudentPage["🎓 Students<br/>src/app/students/page.tsx"]
        SessionPage["📅 Sessions<br/>src/app/sessions/page.tsx"]
    end

    subgraph Components["🎨 COMPONENTS"]
        Stats["DashboardStats"]
        Charts["Charts<br/>Attendance/Distribution"]
        Table["ProgrammeHealthTable"]
        Cards["GroupCards<br/>GridView/ListView"]
        Modal["Modals<br/>Create/Edit/Details"]
        Progress["ProgressBars<br/>Status Badges"]
    end

    %% Database to API connections
    Users --> AuthAPI
    Students --> StatsAPI
    Groups --> StatsAPI
    Assessments --> StatsAPI

    Students --> SummaryAPI
    Groups --> SummaryAPI
    Assessments --> SummaryAPI

    Groups --> GroupsAPI
    Students --> GroupsAPI
    Assessments --> GroupsAPI

    Students --> StudentAPI
    Groups --> GroupsAPI

    Sessions --> SessionAPI
    Attendance --> SessionAPI

    Assessments --> AssessAPI

    Attendance --> AttendAPI
    Sessions --> AttendAPI

    %% API to Pages
    StatsAPI --> Dashboard
    SummaryAPI --> Dashboard
    GroupsAPI --> Dashboard
    
    GroupsAPI --> GroupsPage
    StudentAPI --> GroupsPage
    AssessAPI --> GroupsPage

    AssessAPI --> AssessPage
    StudentAPI --> AssessPage

    StudentAPI --> StudentPage
    GroupsAPI --> StudentPage

    SessionAPI --> SessionPage
    AttendAPI --> SessionPage

    %% Pages to Components
    Dashboard --> Stats
    Dashboard --> Charts
    Dashboard --> Table

    GroupsPage --> Cards
    GroupsPage --> Modal
    GroupsPage --> Progress

    AssessPage --> Modal
    StudentPage --> Cards
    SessionPage --> Charts

    %% Styling
    classDef db fill:#e1f5ff,stroke:#01579b,stroke-width:2px
    classDef api fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef page fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    classDef comp fill:#fff3e0,stroke:#e65100,stroke-width:2px

    class Users,Students,Groups,UnitStandards,Modules,Sessions,Assessments,Attendance db
    class AuthAPI,StatsAPI,SummaryAPI,GroupsAPI,AssessAPI,StudentAPI,SessionAPI,AttendAPI api
    class Dashboard,GroupsPage,AssessPage,StudentPage,SessionPage page
    class Stats,Charts,Table,Cards,Modal,Progress comp
```

---

## Page-Specific Data Flows

### Dashboard Page Flow

```mermaid
sequenceDiagram
    participant DashboardComponent as 📊 Dashboard Page
    participant Cache as SWR Cache
    participant APIs as API Endpoints
    participant Database as 🗄️ Database

    DashboardComponent->>Cache: Check cached data
    Cache->>DashboardComponent: Return cached (if exists)
    
    rect rgb(200, 220, 255) 
        note over DashboardComponent,Database: Parallel Requests
        DashboardComponent->>APIs: GET /api/dashboard/stats
        DashboardComponent->>APIs: GET /api/dashboard/summary
        DashboardComponent->>APIs: GET /api/dashboard/charts?range=30d
        DashboardComponent->>APIs: GET /api/groups
    end

    APIs->>Database: Query Users (count active)
    APIs->>Database: Query Group Summaries
    APIs->>Database: Query Attendance (30d)
    APIs->>Database: Query Groups (all)

    Database-->>APIs: Return results
    APIs-->>Cache: Store in SWR cache
    Cache-->>DashboardComponent: Render with data

    DashboardComponent->>DashboardComponent: Display Stats<br/>Display Charts<br/>Display Health Table<br/>Display Alerts
```

---

### Groups Page Flow

```mermaid
sequenceDiagram
    participant GroupsPage as 👥 Groups Page
    participant Context as GroupsContext
    participant Cache as SWR Cache
    participant APIs as API Endpoints
    participant Memory as In-Memory<br/>Calculations

    GroupsPage->>Context: Initialize context
    Context->>Cache: Request /api/groups
    Cache->>APIs: GET /api/groups
    APIs->>Database: Query all groups

    Database-->>APIs: [Group records]
    APIs-->>Cache: Cache results
    Cache-->>Context: Return groups

    par Process Groups
        Context->>APIs: GET /api/groups/{id}/students
        Context->>APIs: GET /api/assessments?groupId={id}
    and
        Context->>Memory: For each group:
        Memory->>Memory: Calculate total credits
        Memory->>Memory: Calculate completion %
        Memory->>Memory: Determine status
    end

    APIs-->>Context: Student/Assessment data
    Context->>GroupsPage: Pass to components
    GroupsPage->>GroupsPage: Render GroupCards<br/>or GroupsList
```

---

### Cross-Page Synchronization Issue

```mermaid
graph LR
    A["User marks<br/>assessment"] -->|POST /api/assessments/mark| B["Assessment<br/>Updated"]
    
    B -->|T=0| C["Groups Page<br/>shows old<br/>credit value"]
    B -->|T=0| D["Dashboard<br/>shows old<br/>completion %"]
    
    C -->|T=30s| E["Groups page<br/>refreshes<br/>✅ Updated"]
    D -->|T=5-60s| F["Dashboard<br/>refreshes<br/>✅ Updated"]
    
    E -.->|Race Condition| F
    
    style A fill:#90EE90
    style B fill:#90EE90
    style C fill:#FFB6C6
    style D fill:#FFB6C6
    style E fill:#90EE90
    style F fill:#90EE90
```

---

## Data Dependency Matrix

```mermaid
graph TB
    subgraph Reads["📖 DATA READS"]
        R1["Dashboard reads:<br/>groups, students,<br/>assessments, attendance"]
        R2["Groups reads:<br/>groups, students,<br/>assessments"]
        R3["Assessments reads:<br/>assessments,<br/>students, standards"]
        R4["Students reads:<br/>students, groups,<br/>progress"]
        R5["Sessions reads:<br/>sessions, groups,<br/>attendance"]
    end

    subgraph Writes["✏️ DATA WRITES"]
        W1["Create/Edit:<br/>Groups"]
        W2["Mark:<br/>Assessments"]
        W3["Create/Edit:<br/>Students"]
        W4["Create/Edit:<br/>Sessions"]
        W5["Record:<br/>Attendance"]
    end

    subgraph Impacts["💥 IMPACTS"]
        I1["Affects:<br/>Dashboard,<br/>GroupsPage"]
        I2["Affects:<br/>Dashboard,<br/>GroupsPage,<br/>StudentPage"]
        I3["Affects:<br/>Dashboard,<br/>GroupsPage,<br/>StudentPage"]
        I4["Affects:<br/>Dashboard,<br/>SessionPage"]
        I5["Affects:<br/>Dashboard,<br/>StudentPage"]
    end

    R1 -.-> |when cache invalidated| Writes
    R2 -.-> |when cache invalidated| Writes
    R3 -.-> |when cache invalidated| Writes
    R4 -.-> |when cache invalidated| Writes
    R5 -.-> |when cache invalidated| Writes

    W1 --> I1
    W2 --> I2
    W3 --> I3
    W4 --> I4
    W5 --> I5

    style R1 fill:#E3F2FD
    style R2 fill:#E3F2FD
    style R3 fill:#E3F2FD
    style R4 fill:#E3F2FD
    style R5 fill:#E3F2FD
    style W1 fill:#FFF9C4
    style W2 fill:#FFF9C4
    style W3 fill:#FFF9C4
    style W4 fill:#FFF9C4
    style W5 fill:#FFF9C4
    style I1 fill:#F8BBD0
    style I2 fill:#F8BBD0
    style I3 fill:#F8BBD0
    style I4 fill:#F8BBD0
    style I5 fill:#F8BBD0
```

---

## Proposed Unified Architecture

```mermaid
graph TB
    subgraph Database["🗄️ DATABASE"]
        RawTables["Primary Tables:<br/>users, students, groups,<br/>sessions, assessments,<br/>attendance"]
        
        Views["🔄 Materialized Views<br/>(Updated on data change)"]
        
        Views1["v_group_credits<br/>(group_id, total, earned, %)"]
        Views2["v_student_progress<br/>(student_id, completion, status)"]
        Views3["v_assessment_stats<br/>(unit_id, pass_rate, avg_score)"]
        Views4["v_attendance_rates<br/>(period, rate, trend)"]
    end

    subgraph API["🔌 UNIFIED API LAYER"]
        APIGrouped["All endpoints use:<br/>- Same calculation functions<br/>- Same view definitions<br/>- Standard response format"]
    end

    subgraph Cache["⚡ CACHE LAYER"]
        CacheStrategy["SWR + Cache Invalidation:<br/>- POST/PATCH/DELETE trigger<br/>- Invalidate related cache keys<br/>- Optional: Real-time events<br/>&nbsp;&nbsp;(SSE or WebSockets)"]
    end

    subgraph Frontend["📱 FRONTEND"]
        Pages["All pages read<br/>from unified cache"]
    end

    RawTables -->|triggers| Views
    Views --> Views1
    Views --> Views2
    Views --> Views3
    Views --> Views4

    Views1 --> APIGrouped
    Views2 --> APIGrouped
    Views3 --> APIGrouped
    Views4 --> APIGrouped

    APIGrouped -->|cached via| Cache
    Cache -->|consumed by| Pages

    Pages -->|mutations go to| APIGrouped
    APIGrouped -->|updates| RawTables
    RawTables -->|triggers| CacheStrategy
    CacheStrategy -->|invalidates| Cache

    style Database fill:#E1F5FE,stroke:#01579b,stroke-width:3px
    style API fill:#F3E5F5,stroke:#4a148c,stroke-width:3px
    style Cache fill:#E8F5E9,stroke:#1b5e20,stroke-width:3px
    style Frontend fill:#FFF3E0,stroke:#e65100,stroke-width:3px
    style Views fill:#C8E6C9,stroke:#2e7d32,stroke-width:2px
```

---

## Critical Sync Points (Red Flags)

```mermaid
graph TD
    Event["🚨 Critical Events<br/>That Need Sync"]
    
    Event -->|When Student Added| A["1. Update group count<br/>2. Invalidate student list<br/>3. Refresh dashboard<br/>4. Recalc group metrics"]
    
    Event -->|When Assessment Marked| B["1. Update credits earned<br/>2. Recalc completion %<br/>3. Update student progress<br/>4. Update group status<br/>5. Refresh all dependent pages"]
    
    Event -->|When Attendance Recorded| C["1. Update attendance rate<br/>2. Update group attendance %<br/>3. Refresh dashboard<br/>4. Update student record"]
    
    Event -->|When Session Created| D["1. Add to calendar views<br/>2. Update group schedule<br/>3. Invalidate timetable<br/>4. Prepare attendance template"]

    A --> Solution["✅ SOLUTION:<br/>Implement cache invalidation<br/>or event broadcasting"]
    B --> Solution
    C --> Solution
    D --> Solution

    style Event fill:#FFCDD2
    style A fill:#FFCDD2
    style B fill:#FFCDD2
    style C fill:#FFCDD2
    style D fill:#FFCDD2
    style Solution fill:#C8E6C9
```

---

## Legend

```
Color Coding:
🟦 Blue  = Database/Storage
🟪 Purple = API Layer
🟩 Green = Frontend/Caching
🟨 Yellow = Calculations/Processing
🟥 Red = Issues/Concerns

Symbols:
→  Synchronous call
⇢  Asynchronous call
..  Suggested/Optional
💥 Impact/Side effect
✅ Working correctly
❌ Issue/Problem
```
