# System Flowcharts — Admin & User

> View this file on GitHub to see the diagrams rendered.
> Boxes with 🔷 are screens/pages; ◆ are decisions; ▢ are actions.

## 1. Resident / User flow (mobile app)

```mermaid
flowchart TD
    A[🔷 Open mobile app] --> B{May account na?}
    B -- Wala --> C[🔷 Sign Up]
    C --> C1[▢ Fill in details + valid ID photo]
    C1 --> C2{Valid lahat?}
    C2 -- Hindi --> C1
    C2 -- Oo --> D[▢ Account = Pending]
    D --> E[🔷 Login]
    B -- Meron --> E
    E --> E1{Status ng account?}
    E1 -- Pending --> E2[⛔ Hintay ng admin approval]
    E1 -- Declined/Suspended --> E3[⛔ Makipag-ugnayan sa barangay]
    E1 -- Active --> F[🔷 Home tabs]

    F --> G[🔷 Complaints]
    F --> H[🔷 Emergency]
    F --> I[🔷 Community]
    F --> J[🔷 Profile]

    G --> G1[▢ Submit complaint<br/>pumili o mag-type ng uri]
    G1 --> G2[Status: Pending]
    G2 --> G3[🔷 Track status + barangay response + comments]
    G3 --> G4{Final status?}
    G4 -- Ongoing --> G3
    G4 -- Resolved / Rejected --> G5[✔ Tapos]

    H --> H1[🔷 SEND EMERGENCY request]
    H1 --> H2[Status: Pending → Approved → Processing]
    H2 --> H3[🔷 Tingnan ang ETA + admin response]

    I --> I1[🔷 Basahin ang announcements<br/>at daily operations]
    J --> J1[🔷 Edit profile / change password]

    E --> K{Nakalimutan ang password?}
    K -- Oo --> K1[🔷 Email → 6-digit code → bagong password]
    K1 --> E
```

## 2. Admin flow (desktop app)

```mermaid
flowchart TD
    A[🔷 Open Barangay Admin desktop app] --> B[🔷 Login]
    B --> B1{Role?}
    B1 -- Resident --> B2[🔷 Read-only: My Complaints + Profile lang]
    B1 -- Admin --> C[🔷 Dashboard Overview]
    B1 -- HeadAdmin --> C

    C --> C1[▢ Tingnan: pending sign-ups / complaints /<br/>emergencies / total residents / staff]
    C --> C2[▢ Complaint stats: pending, ongoing,<br/>resolved, rejected]
    C --> C3[▢ Emergency stats: pending, approved,<br/>processing, declined]
    C --> C4[▢ Personnel on duty board:<br/>name, duty, area, position]

    C --> D[🔷 Accounts]
    D --> D1[▢ Tingnan ang valid ID ng applicant]
    D1 --> D2{Approve?}
    D2 -- Oo --> D3[▢ Status = Active + ikabit sa household]
    D2 -- Hindi --> D4[▢ Decline + dahilan]

    C --> E[🔷 Complaints]
    E --> E1[▢ Search: username / subject / location + Reset]
    E1 --> E2[🔷 Update Status button]
    E2 --> E3[▢ Baguhin ang status + response + assigned officer]
    E2 --> E4[▢ Comment thread: detailed response]
    E --> E5{HeadAdmin?}
    E5 -- Oo --> E6[▢ Pwedeng mag-delete ng complaint]
    E5 -- Hindi --> E7[⛔ Bawal mag-delete]

    C --> F[🔷 Emergencies]
    F --> F1[▢ Update status + response + ETA + officer]
    F --> F2{HeadAdmin?}
    F2 -- Oo --> F3[▢ Pwedeng mag-delete]
    F2 -- Hindi --> F4[⛔ Bawal mag-delete]

    C --> G[🔷 Daily Operations]
    G --> G1[▢ Create log + assigned officer/staff + Publish toggle]

    C --> H[🔷 Staff - HeadAdmin lang]
    H --> H1[▢ Create staff account + position + role]

    C --> I[🔷 Households]
    I --> I1[▢ Manage households + members per household]

    C --> J[🔷 Duty Roster]
    J --> J1[▢ Sino ang naka-duty: duty, area, position, shift]

    C --> K[🔷 Announcements]
    K --> K1[▢ Post / publish / delete community posts]

    C --> L[🔷 About]
    L --> L1[▢ Edit mission/vision + hotlines + org chart]
```

## 3. Account approval sequence (both sides meet here)

```mermaid
sequenceDiagram
    participant U as Resident (mobile)
    participant API as Backend API
    participant A as HeadAdmin (desktop)
    U->>API: POST /auth/register + valid ID photo
    API-->>U: "Submitted, hintay ng approval"
    A->>API: GET /users?status=Pending
    API-->>A: List + valid ID image
    A->>API: PUT /users/{id}/status = Active
    API-->>A: Approved
    U->>API: POST /auth/login
    API-->>U: JWT + pwedeng gumamit ng app
```

## 4. Complaint lifecycle (both sides meet here)

```mermaid
stateDiagram-v2
    [*] --> Pending: resident nag-submit
    Pending --> Ongoing: admin/officer humawak
    Pending --> Rejected: hindi valid (admin/head)
    Ongoing --> Resolved: naayos na
    Ongoing --> Rejected: hindi valid
    Resolved --> [*]
    Rejected --> [*]
    note right of Ongoing
        Bawat galaw: response +
        comment thread para
        makita ng resident
    end note
```
