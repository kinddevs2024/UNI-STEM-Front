# UNI STEM - Pages and Features Guide

This document provides a comprehensive overview of all pages available in the UNI STEM platform and what you can do on each page.

## Table of Contents

1. [Public Pages (Unauthenticated)](#public-pages-unauthenticated)
2. [Authentication Pages](#authentication-pages)
3. [Student Pages](#student-pages)
4. [Admin/Owner Pages](#adminowner-pages)
5. [Special Role Pages](#special-role-pages)
6. [Portfolio System](#portfolio-system)
7. [General Pages](#general-pages)

---

## Public Pages (Unauthenticated)

### 1. Home Page (`/`)

**What you can do:**

- View the landing page with platform introduction
- See 3D animated scenes for different subjects (Math, Physics, Chemistry, English, Science)
- Learn about platform features (proctoring, timer system, leaderboards, etc.)
- Browse available subjects (Mathematics, Physics, Chemistry, English, Science)
- View "How It Works" guide
- Access sign up/login links if not authenticated
- Navigate to Dashboard if already authenticated

**Key Features:**

- Hero section with animated 3D graphics
- Feature showcase
- Subject information
- Step-by-step guide
- Call-to-action buttons

---

### 2. About Page (`/about`)

**What you can do:**

- Learn more about UNI STEM platform
- Understand the mission and vision
- Read about platform benefits
- _Note: Redirects to dashboard if authenticated_

---

### 3. Contact Page (`/contact`)

**What you can do:**

- View contact information
- Get support information
- Access help resources
- _Note: Redirects to dashboard if authenticated_

---

### 4. Services Page (`/services`)

**What you can do:**

- View available services
- Learn about platform offerings
- _Note: Redirects to dashboard if authenticated_

---

## Authentication Pages

### 5. Auth Page (`/auth`)

**What you can do:**

- Sign up for a new account
- Log in with existing credentials
- Log in with Google OAuth
- Reset password (if implemented)
- Complete authentication process

**Features:**

- Google OAuth integration
- Email/password authentication
- Form validation
- Error handling

---

### 6. Complete Profile Page (`/complete-profile`)

**What you can do:**

- Complete your user profile after initial registration
- Add personal information (first name, last name, etc.)
- Set up profile picture
- Add school/university information
- Complete required fields to access full platform features

**Access:** Protected route (requires authentication)

---

## Student Pages

### 7. Dashboard (`/dashboard`)

**What you can do:**

- View all available olympiads
- Filter olympiads by status:
  - **Active**: Olympiads you can participate in right now
  - **Upcoming**: Olympiads that will start soon
  - **Ended**: Finished olympiads
- Click on an olympiad to start it (active olympiads)
- View olympiad details:
  - Title, subject, type
  - Duration
  - Start and end dates
  - Logo/image
- Navigate to results for ended olympiads
- Access portfolio constructor

**Role-specific behavior:**

- **Students**: See only published olympiads, can start active olympiads
- **Admins/Owners**: See all olympiads (including drafts), can view details in modal

---

### 8. Start Olympiad Page (`/olympiad/:id/start`)

**What you can do:**

- Review olympiad instructions
- View olympiad details (duration, rules, etc.)
- Grant permissions for camera and screen sharing (proctoring)
- Start the olympiad after consenting to monitoring
- Navigate to the actual test/essay page

**Features:**

- Proctoring consent modal
- Camera and screen capture permissions
- Pre-test instructions

---

### 9. Test Olympiad Page (`/olympiad/:id`)

**What you can do:**

- Take multiple-choice questions
- Navigate between questions using question navigation
- View timer countdown
- Save answers automatically (draft saving)
- Submit answers manually or automatically when time expires
- See real-time proctoring status (camera/screen monitoring)
- View question progress indicator

**Features:**

- Real-time timer with auto-submit
- Question navigation
- Auto-save draft answers
- Proctoring monitoring overlay
- Question progress tracking
- Answer persistence

---

### 10. Essay Olympiad Page (`/olympiad/:id/essay`)

**What you can do:**

- Write essay responses
- View word/character count
- See timer countdown
- Save drafts automatically
- Submit essay when complete
- Monitor proctoring status

**Features:**

- Rich text editor
- Word/character counter
- Auto-save functionality
- Proctoring monitoring

---

### 11. Leaderboard Page (`/olympiad/:id/leaderboard`)

**What you can do:**

- View real-time rankings
- See your position in the leaderboard
- Compare scores with other participants
- Filter by different criteria (if available)
- See top performers

**Features:**

- Real-time updates via Socket.io
- Ranking display
- Score comparison
- User rankings

---

### 12. Results Page (`/results` or `/olympiad/:id/results`)

**What you can do:**

- View your olympiad results
- See your score and ranking
- Review your answers (for test olympiads)
- View feedback (if provided)
- Access certificates (if available)
- See overall performance statistics

**Features:**

- Score display
- Answer review
- Performance analytics
- Ranking information

---

## Admin/Owner Pages

### 13. Admin Panel (`/admin`)

**What you can do:**

- Create new olympiads (test or essay type)
- Edit existing olympiads
- Manage olympiad status (draft, published, unpublished)
- Add/edit/delete questions:
  - Multiple-choice questions with options and correct answers
  - Essay questions
- Set olympiad properties:
  - Title, subject, type
  - Duration
  - Start and end dates
  - Description
  - Logo upload
- View all olympiads (including drafts)
- Manage question points/scoring
- Delete olympiads

**Features:**

- Multi-step olympiad creation form
- Question management interface
- Olympiad status management
- File upload for logos
- Rich form validation

---

### 14. Owner Panel (`/owner`)

**What you can do:**

- Access all admin features
- Manage users and permissions
- View platform-wide analytics
- Configure system settings
- Manage roles and access levels

**Access:** Requires OWNER role

---

## Special Role Pages

### 15. Resolter Panel (`/resolter`)

**What you can do:**

- Edit and set results for essay olympiads
- Review essay submissions
- Grade essays
- View all results (test and essay)
- Manage scoring for essay questions

**Access:** Requires RESOLTER role

---

### 16. School Teacher Panel (`/school-teacher`)

**What you can do:**

- View results from your school
- Access real-time captures from students at your school
- Monitor student participation
- View school-specific analytics
- Review proctoring data for your school's students

**Access:** Requires SCHOOL_TEACHER role

---

### 17. Checker Panel (`/checker`)

**What you can do:**

- Verify student portfolios
- Approve or reject portfolios
- Review portfolio submissions
- Manage portfolio verification status
- Provide feedback on portfolios

**Access:** Requires CHECKER role

---

### 18. University Dashboard (`/university`)

**What you can do:**

- View student portfolios
- Browse portfolios of students who applied to your university
- Search and filter portfolios
- View portfolio analytics

**Access:** Requires UNIVERSITY role

---

### 19. University Panel (`/university-panel`)

**What you can do:**

- Manage university-specific settings
- Configure portfolio viewing preferences
- Access advanced university features

**Access:** Requires UNIVERSITY role

---

## Portfolio System

### 20. Portfolio Constructor (`/dashboard/portfolio`)

**What you can do:**

- Create and edit your portfolio
- Choose from multiple portfolio layouts
- Customize portfolio theme (colors, fonts, spacing)
- Add/remove/reorder sections:
  - Hero section
  - About section
  - Education section
  - Experience section
  - Projects section
  - Skills section
  - Certificates section
  - Contact section
- Upload portfolio logo
- Use AI text generator to create content (Text-to-Portfolio)
- Upload certificates
- Preview portfolio in real-time
- Save and publish portfolio
- Set portfolio visibility (public/private)
- Generate unique portfolio slug/URL

**Features:**

- Drag-and-drop section management
- Live preview
- Theme customization
- Certificate uploader
- AI-powered content generation
- Auto-save functionality
- Multi-page portfolio support

---

### 21. Portfolio View (`/portfolio/:slug` or `/portfolio/:slug/:sectionId`)

**What you can do:**

- View public portfolios by slug
- Navigate between portfolio sections
- View portfolio in different layouts
- See portfolio owner's information
- View certificates and achievements
- **If you're the owner:**
  - Access inline editing panel
  - Edit sections directly
  - Update content in real-time
  - Save changes

**Features:**

- Multi-section navigation
- Responsive design
- Owner editing capabilities
- Analytics tracking
- Privacy controls

---

## General Pages

### 22. Profile Page (`/profile`)

**What you can do:**

- View your profile information
- See your role and account details
- View personal information (name, email, etc.)
- Access profile editing
- View linked accounts
- See account statistics

**Features:**

- Profile picture display
- Account information overview
- Quick access to edit and settings

---

### 23. Profile Edit Page (`/profile/edit`)

**What you can do:**

- Edit your personal information:
  - First name, last name
  - Profile picture/logo
  - Contact information
  - School/university
  - Additional details
- Update account settings
- Change password (if implemented)
- Save profile changes

**Features:**

- Form validation
- Image upload
- Real-time updates

---

### 24. Settings Page (`/settings`)

**What you can do:**

- Configure account preferences
- Manage notification settings
- Change language (if translation is enabled)
- Update privacy settings
- Manage connected accounts
- Configure email preferences
- Delete account (if available)

**Features:**

- Settings categories
- Preference management
- Privacy controls

---

## Navigation and Access

### Protected Routes

Most pages require authentication. Users are automatically redirected to login if not authenticated.

### Role-Based Access

Different pages are accessible based on user roles:

- **Student**: Dashboard, Olympiad pages, Results, Profile, Portfolio
- **Admin**: All student pages + Admin Panel
- **Owner**: All admin features + Owner Panel
- **Resolter**: Resolter Panel + Results
- **School Teacher**: School Teacher Panel
- **Checker**: Checker Panel
- **University**: University Dashboard and Panel

### Navigation Bar

The navigation bar provides quick access to:

- Home
- Dashboard
- Profile
- Settings
- Role-specific panels (if applicable)
- Logout

---

## Key Features Across Pages

### Proctoring System

- Real-time camera monitoring
- Screen capture and recording
- Periodic screenshot uploads
- Consent-based monitoring
- Available in: Test Olympiad, Essay Olympiad

### Real-Time Features

- Live leaderboard updates (Socket.io)
- Timer synchronization
- Real-time notifications
- Available in: Leaderboard, Test Olympiad, Essay Olympiad

### Portfolio System

- Multi-section portfolios
- Customizable themes
- Certificate management
- Public/private visibility
- Analytics tracking

### Responsive Design

- All pages work on desktop, tablet, and mobile
- Optimized layouts for different screen sizes

---

## Getting Started Flow

1. **New User**: Home → Auth → Complete Profile → Dashboard
2. **Returning User**: Home → Dashboard (auto-redirect)
3. **Taking Olympiad**: Dashboard → Start Olympiad → Test/Essay → Results
4. **Creating Portfolio**: Dashboard → Portfolio Constructor → Publish → Share URL

---

## Additional Notes

- All timers have auto-submit functionality when time expires
- Draft answers are automatically saved during olympiads
- Portfolio editing is available inline for portfolio owners
- Real-time features require Socket.io connection
- Google OAuth is available for authentication
- Cookie consent is managed on first visit

---

**Last Updated**: Based on UNI STEM codebase

