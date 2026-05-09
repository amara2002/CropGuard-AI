# CropGuard – AI-Powered Crop Disease Detection Platform

## Project Overview

A full-stack AI-powered crop disease detection platform with multilingual support, farmer profiles, AI chat assistant, analytics dashboard, and professional reporting.

---

# TODO.md

## 1. Project Setup & Infrastructure

### Core Setup

* [ ] Initialize monorepo structure
* [ ] Configure React 19 + TypeScript frontend
* [ ] Configure Express.js backend
* [ ] Setup Vite build system
* [ ] Configure Tailwind CSS with emerald theme
* [ ] Setup shadcn/ui component library
* [ ] Install and configure Framer Motion
* [ ] Configure environment variables
* [ ] Add `.env` to `.gitignore`
* [ ] Setup ESLint + Prettier
* [ ] Configure TypeScript paths and aliases
* [ ] Setup Docker configuration (optional)

### Database & ORM

* [ ] Setup PostgreSQL database
* [ ] Configure Drizzle ORM
* [ ] Create database migrations system
* [ ] Create users table schema
* [ ] Create scans table schema
* [ ] Create chat_messages table schema
* [ ] Add indexes for performance
* [ ] Seed demo data for development

### API & Backend Infrastructure

* [ ] Setup Express.js server
* [ ] Configure tRPC integration
* [ ] Configure REST API routes
* [ ] Setup CORS security configuration
* [ ] Setup centralized error handling
* [ ] Add request logging middleware
* [ ] Setup JWT middleware
* [ ] Add API rate limiting
* [ ] Configure file upload middleware (Multer)

---

# 2. Authentication & User Management

## User Registration

* [ ] Create multi-step signup page
* [ ] Add progress indicator (3-step flow)
* [ ] Create Step 1: Account Information
* [ ] Add full name field
* [ ] Add email field
* [ ] Add password field
* [ ] Add confirm password field
* [ ] Implement password strength meter
* [ ] Add terms and conditions checkbox
* [ ] Add inline validation errors
* [ ] Add loading state during signup
* [ ] Add smooth step animations
* [ ] Add security notice banner

## Farm Parameters Setup

* [ ] Create Step 2: Farm Parameters
* [ ] Add farm location field
* [ ] Add geolocation search integration
* [ ] Add manual location fallback
* [ ] Add crop type multi-select
* [ ] Support 5 crop categories
* [ ] Persist crop preferences

## Environment Setup

* [ ] Create Step 3: Environment Setup
* [ ] Add language selector (EN/FR/SW/LG)
* [ ] Add profile summary review
* [ ] Add final confirmation screen
* [ ] Save language preference

## Login System

* [ ] Create login page
* [ ] Add email/password login
* [ ] Implement bcrypt password hashing
* [ ] Add JWT authentication
* [ ] Configure 7-day JWT expiry
* [ ] Add duplicate email detection
* [ ] Add OAuth account protection
* [ ] Add secure session handling
* [ ] Add logout functionality
* [ ] Clear tokens on logout
* [ ] Redirect after logout

## Google OAuth

* [ ] Setup Google OAuth 2.0
* [ ] Configure OAuth callback routes
* [ ] Auto-create OAuth user accounts
* [ ] Skip Step 1 for OAuth users
* [ ] Auto-fill profile data from Google
* [ ] Handle duplicate OAuth accounts

## Password Reset Flow

* [ ] Create forgot password page
* [ ] Add email reset request form
* [ ] Generate JWT reset tokens
* [ ] Configure 15-minute token expiry
* [ ] Create reset password page
* [ ] Validate reset tokens
* [ ] Add new password validation
* [ ] Redirect after successful reset

## User Profile Management

* [ ] Create profile settings page
* [ ] Allow updating user name
* [ ] Allow updating farm location
* [ ] Allow updating crop types
* [ ] Add profile summary display
* [ ] Add save/cancel actions

## Account Settings

* [ ] Create account settings page
* [ ] Add language preference settings
* [ ] Add notification preferences
* [ ] Add disease alert toggles
* [ ] Display account metadata
* [ ] Add “Set Password” for OAuth users
* [ ] Add placeholder delete account section

---

# 3. Protected Routing & Session Management

* [ ] Create protected route middleware
* [ ] Restrict dashboard access
* [ ] Restrict scan history access
* [ ] Restrict analytics access
* [ ] Redirect guests to signup/login
* [ ] Add token verification middleware
* [ ] Add session persistence
* [ ] Add token expiration handling

---

# 4. Image Upload & Processing

## Upload Experience

* [ ] Create drag-and-drop upload area
* [ ] Add image preview functionality
* [ ] Display uploaded filename
* [ ] Validate image formats (JPG/PNG/WebP)
* [ ] Validate max file size (5MB)
* [ ] Add upload progress indicator
* [ ] Add upload loading states
* [ ] Add upload retry handling

## File Storage

* [ ] Create uploads directory
* [ ] Store uploaded images locally
* [ ] Add image cleanup routines
* [ ] Add unique filename generation
* [ ] Secure file access handling

---

# 5. AI Disease Detection System

## ML Model Integration

* [ ] Train MobileNetV3-Small model
* [ ] Support 16 disease classes
* [ ] Support 5 crop categories
* [ ] Achieve target validation accuracy (~86%)
* [ ] Create training visualization charts
* [ ] Save/export trained model

## FastAPI Inference Service

* [ ] Setup FastAPI server
* [ ] Create async inference endpoint
* [ ] Add image preprocessing pipeline
* [ ] Add disease prediction logic
* [ ] Return confidence score
* [ ] Add async background processing
* [ ] Add inference logging

## Frontend Detection Flow

* [ ] Display detection results
* [ ] Display confidence score (0–100%)
* [ ] Add pending analysis state
* [ ] Implement auto-polling every 2 seconds
* [ ] Add retry capability for failed scans
* [ ] Add detection error handling

## Explainability

* [ ] Generate Grad-CAM heatmaps
* [ ] Display explainability overlays
* [ ] Add transparency explanations

---

# 6. Gemini AI Advisory System

## AI Recommendations

* [ ] Integrate Gemini AI API
* [ ] Generate treatment recommendations
* [ ] Generate fertilizer suggestions
* [ ] Include NPK ratios
* [ ] Generate prevention strategies
* [ ] Generate structured JSON responses
* [ ] Add fallback advisory messages
* [ ] Add retry logic for API failures

## Multilingual AI Output

* [ ] Translate AI outputs to English
* [ ] Translate AI outputs to French
* [ ] Translate AI outputs to Swahili
* [ ] Translate AI outputs to Luganda

---

# 7. Dashboard & Scan History

## Dashboard UI

* [ ] Create farmer dashboard layout
* [ ] Add sticky header
* [ ] Add responsive sidebar
* [ ] Add AI chat toggle button
* [ ] Add summary statistic cards
* [ ] Add recent scan previews
* [ ] Add empty state guidance

## Scan History

* [ ] Display previous scans
* [ ] Add scan status indicators
* [ ] Add detailed scan view
* [ ] Add delete scan functionality
* [ ] Cleanup deleted image files
* [ ] Add retry failed scan action
* [ ] Add real-time scan counts
* [ ] Add dedicated statistics endpoint

---

# 8. Report Generation

## PDF Reports

* [ ] Design professional PDF template
* [ ] Add green-themed headers
* [ ] Include disease analysis sections
* [ ] Include treatment recommendations
* [ ] Include prevention strategies
* [ ] Include metadata fields
* [ ] Add multilingual support
* [ ] Generate downloadable filenames

---

# 9. Multi-Language Support

## i18n Infrastructure

* [ ] Setup i18n framework
* [ ] Add English translations
* [ ] Add French translations
* [ ] Add Swahili translations
* [ ] Add Luganda translations
* [ ] Translate scanner UI
* [ ] Translate dashboard UI
* [ ] Translate signup/login UI
* [ ] Translate error messages
* [ ] Persist language preference

## Accessibility & Speech

* [ ] Add text-to-speech support
* [ ] Configure language-specific voices
* [ ] Add accessibility labels
* [ ] Improve WCAG compliance

---

# 10. UI/UX & Design System

## Design System

* [ ] Create emerald theme palette
* [ ] Add typography system
* [ ] Create reusable UI components
* [ ] Add spacing system
* [ ] Create card components
* [ ] Create loading skeletons

## Animations & Responsiveness

* [ ] Add Framer Motion transitions
* [ ] Add reduced-motion accessibility support
* [ ] Optimize mobile responsiveness
* [ ] Optimize tablet responsiveness
* [ ] Optimize desktop responsiveness

## Error & Empty States

* [ ] Add helpful error messages
* [ ] Add onboarding guidance
* [ ] Add empty state illustrations

---

# 11. AI Chat Assistant

## Chat Infrastructure

* [ ] Create AI chat panel
* [ ] Create floating AI assistant
* [ ] Persist chat history in database
* [ ] Add multilingual AI responses
* [ ] Add suggested prompts
* [ ] Add typing/loading indicators
* [ ] Add clear history action
* [ ] Add confirmation modal
* [ ] Add animated chat UI

## Chat Persistence

* [ ] Restore conversations on reload
* [ ] Sync conversations across sessions
* [ ] Handle failed message retries

---

# 12. Guest Mode

## Guest Scanning

* [ ] Allow scanning without login
* [ ] Create guest results page
* [ ] Add temporary scan handling
* [ ] Add volatile data notice
* [ ] Add “Create Free Account” CTA
* [ ] Prevent guest scan persistence
* [ ] Add multilingual guest experience

---

# 13. Analytics Dashboard

## Data Visualization

* [ ] Add disease trends bar chart
* [ ] Add disease distribution pie chart
* [ ] Add crop scan analytics
* [ ] Add recent activity timeline
* [ ] Add responsive analytics layout

## Farm Mapping

* [ ] Integrate OpenStreetMap
* [ ] Integrate Leaflet.js
* [ ] Add disease markers on map
* [ ] Add marker clustering
* [ ] Add scan location filtering

---

# 14. Navigation & User Menu

## User Account Menu

* [ ] Create profile dropdown
* [ ] Display user initials avatar
* [ ] Display name and email
* [ ] Add account settings shortcut
* [ ] Add profile settings shortcut
* [ ] Add logout button
* [ ] Style logout button in red

## Authentication Navigation

* [ ] Add signup/login links
* [ ] Add back button on signup page
* [ ] Add login/signup redirects
* [ ] Add helpful OAuth messages

---

# 15. Security & Validation

## Security

* [ ] Add bcrypt password hashing (10 salt rounds)
* [ ] Validate JWT tokens on every request
* [ ] Validate upload MIME types
* [ ] Enforce upload size limits
* [ ] Sanitize user inputs
* [ ] Add CSRF protection
* [ ] Add secure headers
* [ ] Protect environment variables

## Validation

* [ ] Setup Zod validation schemas
* [ ] Validate auth forms
* [ ] Validate profile forms
* [ ] Validate upload requests
* [ ] Validate AI request payloads

---

# 16. Testing & Quality Assurance

## Unit Testing

* [ ] Add auth unit tests
* [ ] Add upload validation tests
* [ ] Add AI service tests
* [ ] Add utility function tests
* [ ] Add middleware tests

## End-to-End Testing

* [ ] Test signup flow
* [ ] Test login flow
* [ ] Test guest scanning flow
* [ ] Test authenticated scanning flow
* [ ] Test report generation flow
* [ ] Test AI chat workflows
* [ ] Test multilingual support

## Performance & Reliability

* [ ] Optimize image upload performance
* [ ] Optimize dashboard loading
* [ ] Add lazy loading where appropriate
* [ ] Add caching strategies
* [ ] Add graceful API failure handling

---

# 17. Deployment & Production

## Deployment

* [ ] Configure production environment variables
* [ ] Deploy PostgreSQL database
* [ ] Deploy frontend application
* [ ] Deploy Express backend
* [ ] Deploy FastAPI AI service
* [ ] Configure reverse proxy
* [ ] Configure HTTPS
* [ ] Setup CI/CD pipeline

## Monitoring

* [ ] Add server monitoring
* [ ] Add API error tracking
* [ ] Add performance monitoring
* [ ] Add database monitoring
* [ ] Add uptime monitoring

---

# 18. Final Polish & Launch

## Final Review

* [ ] Perform accessibility audit
* [ ] Perform security audit
* [ ] Review mobile responsiveness
* [ ] Review multilingual translations
* [ ] Final UI polish
* [ ] Remove unused code
* [ ] Optimize bundle size
* [ ] Prepare production documentation

## Launch Preparation

* [ ] Create onboarding walkthrough
* [ ] Create demo accounts
* [ ] Create marketing screenshots
* [ ] Prepare release notes
* [ ] Publish v1.0

---

# Tech Stack Summary

## Frontend

* React 19
* TypeScript
* Vite
* Tailwind CSS
* Framer Motion
* wouter
* shadcn/ui
* Recharts
* jsPDF

## Backend

* Express.js
* tRPC
* PostgreSQL
* Drizzle ORM
* JWT Authentication
* Multer
* Google OAuth 2.0

## AI Stack

* FastAPI
* MobileNetV3-Small
* Gemini AI
* Grad-CAM

## Additional Services

* OpenStreetMap
* Leaflet.js
* Web Speech API

---

# Priority Roadmap

## Phase 1 – Core MVP

* Authentication
* Image Upload
* AI Disease Detection
* Dashboard
* Scan History

## Phase 2 – AI Enhancements

* Gemini Advisory System
* Grad-CAM Explainability
* PDF Reports
* Multi-language Support

## Phase 3 – Advanced Features

* AI Chat Assistant
* Analytics Dashboard
* Guest Mode
* Farm Mapping

## Phase 4 – Production Readiness

* Security Hardening
* Performance Optimization
* Testing & QA
* Deployment & Monitoring
