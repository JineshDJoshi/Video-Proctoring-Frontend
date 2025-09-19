# Video Proctoring System

A comprehensive video proctoring solution for online interviews with real-time detection capabilities and integrity scoring.

## Features

* Real-time Video Monitoring: Live candidate video feed with recording capabilities
* Focus Detection: Detects when candidates look away from screen (>5 seconds)
* Face Detection: Monitors face presence and detects multiple faces
* Object Detection: Identifies unauthorized items (phones, books, notes)
* Event Logging: Real-time logging of all suspicious activities
* Integrity Scoring: Automated scoring system (0-100)
* Comprehensive Reports: Detailed proctoring reports with timestamps
* RESTful API: Complete backend API for session management

## Quick Start

### Prerequisites

* Frontend: Node.js 16+, npm/yarn
* Backend: Java 17+, Maven 3.6+
* Browser: Modern browser with camera/microphone permissions

### Frontend Setup (React)

```bash
# Create React app
npx create-react-app video-proctoring-frontend
cd video-proctoring-frontend

# Install dependencies
npm install lucide-react

# Replace src/App.js with the provided React component
# Copy the VideoProctoringSystem component code

# Start development server
npm start
```

The frontend will be available at `http://localhost:3000`.

### Backend Setup (Java Spring Boot)

```bash
# Create project directory
mkdir video-proctoring-backend
cd video-proctoring-backend

# Create the following directory structure:
src/
├── main/
│   ├── java/
│   │   └── com/
│   │       └── tutedude/
│   │           └── proctoring/
│   │               ├── Application.java
│   │               ├── controller/
│   │               │   └── ProctoringController.java
│   │               ├── service/
│   │               │   └── ProctoringService.java
│   │               ├── model/
│   │               │   ├── DetectionEvent.java
│   │               │   ├── InterviewSession.java
│   │               │   └── ProctoringReport.java
│   │               └── config/
│   │                   └── WebConfig.java
│   └── resources/
│       └── application.properties
└── pom.xml

# Copy all Java files from the provided backend code
# Copy pom.xml and application.properties

# Build and run
mvn clean install
mvn spring-boot:run
```

The backend API will be available at `http://localhost:8080`.

## API Endpoints

### Session Management

* `POST /api/proctoring/sessions/start` - Start new interview session
* `POST /api/proctoring/sessions/{sessionId}/end` - End interview session
* `GET /api/proctoring/sessions/{sessionId}` - Get session details
* `GET /api/proctoring/sessions` - Get all sessions

### Event Tracking

* `POST /api/proctoring/sessions/{sessionId}/events` - Add detection event

### Reports

* `GET /api/proctoring/sessions/{sessionId}/report` - Generate proctoring report

### Health Check

* `GET /api/proctoring/health` - API health status

## Usage

### Starting an Interview

1. Launch Application: Open frontend at `localhost:3000`
2. Enter Candidate Name: Fill in the candidate information
3. Start Session: Click "Start Interview" (camera permission required)
4. Monitor: Watch real-time detection status and events
5. End Session: Click "End Interview" to generate report

### Detection Events

The system automatically detects and logs:

* Looking Away (>5s): Yellow warning indicator
* No Face Detected (>10s): Red danger indicator
* Multiple Faces: Red danger indicator
* Phone Detected: Red danger indicator
* Books/Notes: Yellow warning indicator

### Integrity Scoring

* Starting Score: 100 points
* Danger Events: -10 points each (no face, phone, multiple faces)
* Warning Events: -5 points each (looking away, notes)
* Final Score: Maximum 0, displayed with assessment (Excellent/Good/Fair/Poor)

## Sample Data

The backend includes pre-populated demo sessions:

### Demo Session 1 - Jinesh

* Duration: 0.37 Seconds
* Events: 4 violations (looking away, phone detected, no face)
* Integrity Score: 42/100

### Demo Session 2 - Jinesh

* Duration: 1.10 minutes
* Events: 4 violations (looking away, multiple faces)
* Integrity Score: 30/100

## Technical Architecture

### Frontend (React)

* Framework: React 18 with Hooks
* Styling: Tailwind CSS
* Icons: Lucide React
* Camera: WebRTC getUserMedia API
* State Management: useState for real-time updates

### Backend (Java Spring Boot)

* Framework: Spring Boot 3.1
* Architecture: RESTful API with service layer
* Data Storage: In-memory (ConcurrentHashMap)
* CORS: Configured for cross-origin requests
* Validation: Spring Boot Validation

### Key Components

Frontend Components:

* Video streaming and recording
* Real-time detection overlays
* Event logging panel
* Report generation UI

Backend Services:

* Session management
* Event tracking
* Report generation
* Integrity score calculation

## Detection Logic

### Focus Detection

```javascript
// Simulated detection in frontend
const detectFocus = () => {
  // In production: Use MediaPipe/OpenCV
  // Current: Simulated random events
  if (lookingAwayDuration > 5000) {
    logEvent('looking_away', 'warning');
  }
};
```

### Object Detection

```javascript
// Simulated object detection
const detectObjects = () => {
  // In production: Use YOLO/TensorFlow.js
  // Current: Random detection events
  detectPhone();
  detectNotes();
  detectMultipleFaces();
};
```

## Reporting Features

### Real-time Dashboard

* Live detection status
* Recent events log
* Recording indicator
* Session timer

### Final Report

* Candidate information
* Session duration
* Event summary with counts
* Detailed event log with timestamps
* Final integrity score and assessment

## Security Considerations

* Camera Permissions: Required for video access
* Data Privacy: Sessions stored temporarily in memory
* CORS Configuration: Restricted to specific origins in production
* Event Validation: All detection events are validated server-side

## Production Deployment

### Frontend Deployment

```bash
# Build for production
npm run build

# Deploy to static hosting (Netlify, Vercel, S3)
# Update API endpoints to production URLs
```

### Backend Deployment

```bash
# Build JAR file
mvn clean package

# Deploy to cloud (AWS, Heroku, Digital Ocean)
java -jar target/video-proctoring-system-1.0.0.jar

# Configure environment variables:
# SERVER_PORT=8080
# SPRING_PROFILES_ACTIVE=production
```

## Future Enhancements

### Real AI Integration

* MediaPipe: Face mesh detection and eye tracking
* TensorFlow\.js: Real object detection (COCO dataset)
* OpenCV: Advanced computer vision processing

### Database Integration

Kept Values

### Advanced Features

* Video Recording: MP4 file generation and storage
* Audio Analysis: Speech pattern analysis
* Screen Sharing: Desktop monitoring capability
* Mobile App: Native iOS/Android clients

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request


### Sample Reports & Documentation

**You can find the sample report, video, and word documentation for the project in the following Google Drive link:**

[View Sample Reports and Documentation]
(https://drive.google.com/drive/folders/1aM3U--jyy8rVHxIBQPd-EOTXhdMwRqW7?usp=drive_link)

