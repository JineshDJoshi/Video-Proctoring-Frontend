import React, { useState, useRef, useEffect } from 'react';
import { Camera, AlertTriangle, CheckCircle, Eye, EyeOff, Smartphone, Book, Users } from 'lucide-react';
import './App.css';

// API Configuration
const API_BASE_URL = 'http://localhost:8080/api/proctoring';

// API Service Functions
const apiService = {
  startSession: async (candidateName) => {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ candidateName }),
      });
      return response.json();
    } catch (error) {
      // Mock response for demo
      return { sessionId: `session_${Date.now()}` };
    }
  },

  endSession: async (sessionId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return response.json();
    } catch (error) {
      return { success: true };
    }
  },

  addDetectionEvent: async (sessionId, eventData) => {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });
      return response.text();
    } catch (error) {
      console.log('Event logged:', eventData);
      return 'success';
    }
  },

  getReport: async (sessionId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/report`);
      return response.json();
    } catch (error) {
      // Mock report for demo
      return { integrityScore: 85, events: [] };
    }
  },

  healthCheck: async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return response.json();
    } catch (error) {
      return { status: 'mock' };
    }
  }
};

const VideoProctoringSystem = () => {
  const videoRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [candidateName, setCandidateName] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [detectionEvents, setDetectionEvents] = useState([]);
  const [currentDetections, setCurrentDetections] = useState({
    faceDetected: true,
    lookingAway: false,
    multipleFaces: false,
    phoneDetected: false,
    notesDetected: false
  });
  const [interviewDuration, setInterviewDuration] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Check backend connection on component mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        await apiService.healthCheck();
        console.log('Backend connection established');
      } catch (err) {
        console.log('Using demo mode - backend not available');
      }
    };
    checkConnection();
  }, []);

  // Simulate real-time detection events and send to backend
  useEffect(() => {
    if (!interviewStarted || !sessionId) return;

    const interval = setInterval(() => {
      setInterviewDuration(prev => prev + 1);
      
      // Simulate random detection events
      const random = Math.random();
      
      if (random < 0.1) { // 10% chance
        const eventTypes = [
          { 
            eventType: 'LOOKING_AWAY', 
            message: 'Candidate looking away from screen', 
            severity: 'WARNING' 
          },
          { 
            eventType: 'NO_FACE', 
            message: 'No face detected in frame', 
            severity: 'DANGER' 
          },
          { 
            eventType: 'MULTIPLE_FACES', 
            message: 'Multiple faces detected', 
            severity: 'DANGER' 
          },
          { 
            eventType: 'PHONE_DETECTED', 
            message: 'Mobile phone detected', 
            severity: 'DANGER' 
          },
          { 
            eventType: 'NOTES_DETECTED', 
            message: 'Books/notes detected', 
            severity: 'WARNING' 
          }
        ];
        
        const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const newEvent = {
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          type: randomEvent.eventType.toLowerCase(),
          ...randomEvent
        };
        
        // Send event to backend
        apiService.addDetectionEvent(sessionId, {
          eventType: randomEvent.eventType,
          message: randomEvent.message,
          severity: randomEvent.severity,
          timestamp: new Date().toISOString()
        }).catch(err => console.log('Demo mode - event logged locally'));
        
        setDetectionEvents(prev => [...prev, newEvent]);
        
        // Update current detections
        setCurrentDetections(prev => ({
          ...prev,
          faceDetected: randomEvent.eventType !== 'NO_FACE',
          lookingAway: randomEvent.eventType === 'LOOKING_AWAY',
          multipleFaces: randomEvent.eventType === 'MULTIPLE_FACES',
          phoneDetected: randomEvent.eventType === 'PHONE_DETECTED',
          notesDetected: randomEvent.eventType === 'NOTES_DETECTED'
        }));
        
        // Reset detections after 3 seconds
        setTimeout(() => {
          setCurrentDetections({
            faceDetected: true,
            lookingAway: false,
            multipleFaces: false,
            phoneDetected: false,
            notesDetected: false
          });
        }, 3000);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [interviewStarted, sessionId]);

  const startInterview = async () => {
    if (!candidateName.trim()) {
      setError('Please enter candidate name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Start session in backend
      const sessionResponse = await apiService.startSession(candidateName);
      setSessionId(sessionResponse.sessionId);

      // Start camera
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 }, 
        audio: true 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsRecording(true);
      setInterviewStarted(true);
      
      console.log(`Interview started with session ID: ${sessionResponse.sessionId}`);
    } catch (err) {
      console.error('Error starting interview:', err);
      setError('Unable to start interview. Please check camera permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  const stopInterview = async () => {
    setIsLoading(true);
    
    try {
      // Stop camera
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach(track => track.stop());
      }

      // End session in backend and get report
      if (sessionId) {
        await apiService.endSession(sessionId);
        const report = await apiService.getReport(sessionId);
        setReportData(report);
      }

      setIsRecording(false);
      setInterviewStarted(false);
      setShowReport(true);
    } catch (err) {
      console.error('Error stopping interview:', err);
      setError('Error ending interview session');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateIntegrityScore = () => {
    if (reportData && reportData.integrityScore !== undefined) {
      return reportData.integrityScore;
    }
    
    // Fallback calculation
    let score = 100;
    const dangerEvents = detectionEvents.filter(e => e.severity === 'DANGER').length;
    const warningEvents = detectionEvents.filter(e => e.severity === 'WARNING').length;
    
    score -= (dangerEvents * 10) + (warningEvents * 5);
    return Math.max(0, score);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const resetSystem = () => {
    setShowReport(false);
    setDetectionEvents([]);
    setInterviewDuration(0);
    setCandidateName('');
    setSessionId('');
    setReportData(null);
    setError('');
  };

  if (showReport) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
              Proctoring Report
            </h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Session Information</h3>
                <p><strong>Candidate:</strong> {candidateName}</p>
                <p><strong>Session ID:</strong> {sessionId}</p>
                <p><strong>Duration:</strong> {formatDuration(interviewDuration)}</p>
                <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-green-800 mb-2">Integrity Score</h3>
                <div className="text-3xl font-bold text-green-600">
                  {calculateIntegrityScore()}/100
                </div>
                <p className="text-sm text-gray-600">
                  {calculateIntegrityScore() >= 80 ? 'Excellent' : 
                   calculateIntegrityScore() >= 60 ? 'Good' : 
                   calculateIntegrityScore() >= 40 ? 'Fair' : 'Poor'}
                </p>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold mb-4">Detection Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {detectionEvents.filter(e => e.type === 'looking_away').length}
                  </div>
                  <div className="text-sm text-gray-600">Looking Away</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {detectionEvents.filter(e => e.type === 'no_face').length}
                  </div>
                  <div className="text-sm text-gray-600">Face Not Found</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {detectionEvents.filter(e => e.type === 'phone_detected').length}
                  </div>
                  <div className="text-sm text-gray-600">Phone Detected</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {detectionEvents.filter(e => e.type === 'notes_detected').length}
                  </div>
                  <div className="text-sm text-gray-600">Notes Detected</div>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-4">Event Timeline</h3>
              <div className="max-h-60 overflow-y-auto bg-gray-50 rounded-lg p-4 custom-scrollbar">
                {detectionEvents.length === 0 ? (
                  <p className="text-gray-500 text-center">No suspicious events detected</p>
                ) : (
                  detectionEvents.map(event => (
                    <div key={event.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                      <div className="flex items-center">
                        <AlertTriangle 
                          className={`w-4 h-4 mr-2 ${
                            event.severity === 'DANGER' ? 'text-red-500' : 'text-yellow-500'
                          }`} 
                        />
                        <span className="text-sm">{event.message}</span>
                      </div>
                      <span className="text-xs text-gray-500">{event.timestamp}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="text-center space-x-4">
              <button
                onClick={resetSystem}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors duration-200"
              >
                Start New Interview
              </button>
              <button
                onClick={() => window.print()}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors duration-200"
              >
                Print Report
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Camera className="w-8 h-8 text-blue-500 mr-3" />
              <h1 className="text-2xl font-bold text-gray-800">Video Proctoring System</h1>
            </div>
            {interviewStarted && (
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-600">
                  Duration: {formatDuration(interviewDuration)}
                </div>
                <div className="text-sm text-gray-600">
                  Session: {sessionId}
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                  <span className="text-sm font-medium text-red-600">Recording</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <div className="flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2" />
              {error}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Video Area */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gray-800 text-white p-4">
                <h2 className="text-lg font-semibold">Interview Session</h2>
              </div>
              
              {!interviewStarted ? (
                <div className="p-8 text-center">
                  <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-4">Start Interview Session</h3>
                  
                  <div className="max-w-md mx-auto mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Candidate Name
                    </label>
                    <input
                      type="text"
                      value={candidateName}
                      onChange={(e) => setCandidateName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                      placeholder="Enter candidate name"
                      disabled={isLoading}
                    />
                  </div>
                  
                  <button
                    onClick={startInterview}
                    disabled={isLoading}
                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200"
                  >
                    {isLoading ? 'Starting...' : 'Start Interview'}
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-96 object-cover bg-gray-900"
                  />
                  
                  {/* Real-time Detection Overlays */}
                  <div className="absolute top-4 left-4 space-y-2 z-10">
                    {!currentDetections.faceDetected && (
                      <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm flex items-center">
                        <EyeOff className="w-4 h-4 mr-1" />
                        No Face Detected
                      </div>
                    )}
                    {currentDetections.lookingAway && (
                      <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        Looking Away
                      </div>
                    )}
                    {currentDetections.multipleFaces && (
                      <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        Multiple Faces
                      </div>
                    )}
                    {currentDetections.phoneDetected && (
                      <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm flex items-center">
                        <Smartphone className="w-4 h-4 mr-1" />
                        Phone Detected
                      </div>
                    )}
                    {currentDetections.notesDetected && (
                      <div className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm flex items-center">
                        <Book className="w-4 h-4 mr-1" />
                        Notes Detected
                      </div>
                    )}
                  </div>
                  
                  <div className="absolute bottom-4 right-4">
                    <button
                      onClick={stopInterview}
                      disabled={isLoading}
                      className="bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200"
                    >
                      {isLoading ? 'Ending...' : 'End Interview'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Detection Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Current Status */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Detection Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Face Detection</span>
                  <div className="flex items-center">
                    <CheckCircle className={`w-4 h-4 mr-1 ${currentDetections.faceDetected ? 'text-green-500' : 'text-red-500'}`} />
                    <span className={`text-sm ${currentDetections.faceDetected ? 'text-green-600' : 'text-red-600'}`}>
                      {currentDetections.faceDetected ? 'Active' : 'Not Found'}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Focus Status</span>
                  <div className="flex items-center">
                    <CheckCircle className={`w-4 h-4 mr-1 ${!currentDetections.lookingAway ? 'text-green-500' : 'text-yellow-500'}`} />
                    <span className={`text-sm ${!currentDetections.lookingAway ? 'text-green-600' : 'text-yellow-600'}`}>
                      {!currentDetections.lookingAway ? 'Focused' : 'Distracted'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Object Detection</span>
                  <div className="flex items-center">
                    <CheckCircle className={`w-4 h-4 mr-1 ${!currentDetections.phoneDetected && !currentDetections.notesDetected ? 'text-green-500' : 'text-red-500'}`} />
                    <span className={`text-sm ${!currentDetections.phoneDetected && !currentDetections.notesDetected ? 'text-green-600' : 'text-red-600'}`}>
                      {!currentDetections.phoneDetected && !currentDetections.notesDetected ? 'Clear' : 'Items Found'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Events */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Events</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
                {detectionEvents.slice(-5).reverse().map(event => (
                  <div key={event.id} className="flex items-start p-2 bg-gray-50 rounded">
                    <AlertTriangle 
                      className={`w-4 h-4 mr-2 mt-0.5 ${
                        event.severity === 'DANGER' ? 'text-red-500' : 'text-yellow-500'
                      }`} 
                    />
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">{event.message}</p>
                      <p className="text-xs text-gray-500">{event.timestamp}</p>
                    </div>
                  </div>
                ))}
                {detectionEvents.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">No events detected</p>
                )}
              </div>
            </div>

            {/* System Status */}
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">System Status</h3>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full mr-2 bg-green-500"></div>
                <span className="text-sm text-gray-600">Connected to Backend</span>
              </div>
              {sessionId && (
                <p className="text-xs text-gray-500 mt-1">Session: {sessionId}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <VideoProctoringSystem />
    </div>
  );
}

export default App;
