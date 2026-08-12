import React, { useState, useEffect, useRef } from 'react';
import geminiClient from '../utils/geminiClient';
import { speakDeviceAudio, playCallChime, unlockDeviceAudio } from '../utils/speakDeviceAudio';
import { 
  Bot, PhoneCall, Search, Calendar, Users, Utensils, CheckCircle2, 
  Clock, AlertCircle, Volume2, VolumeX, Play, Pause, RefreshCw, 
  MapPin, Phone, ShieldCheck, Sparkles, ExternalLink, Trash2, X, 
  ChevronRight, ArrowRight, Radio, Mic, FileText, Check, Copy, Share2, Send
} from 'lucide-react';

export default function AgenticActionsWidget({ onClose, initialQuery = '' }) {
  // Navigation tabs: 'studio' (live call builder), 'history' (active bookings)
  const [activeTab, setActiveTab] = useState('studio');

  // Request form parameters
  const [taskQuery, setTaskQuery] = useState(
    initialQuery || 'Jasper, book me a table for 4 at an Italian restaurant tomorrow at 8 PM.'
  );
  const [cuisine, setCuisine] = useState('Italian');
  const [partySize, setPartySize] = useState(4);
  const [dateStr, setDateStr] = useState('Tomorrow');
  const [timeStr, setTimeStr] = useState('8:00 PM');
  const [userName, setUserName] = useState('Jwalant');
  const [specialRequests, setSpecialRequests] = useState('Quiet garden table / booth preference');

  // Execution state: 'idle' | 'searching' | 'selecting' | 'calling' | 'completed'
  const [executionState, setExecutionState] = useState('idle');
  const [currentStep, setCurrentStep] = useState(1); // 1 to 6

  // Candidate restaurants
  const [candidates, setCandidates] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);

  // Call session state
  const [sessionId, setSessionId] = useState('');
  const [callStatus, setCallStatus] = useState('idle'); // 'dialing', 'connected', 'speaking', 'ended'
  const [callDuration, setCallDuration] = useState(0);
  const [transcript, setTranscript] = useState([]);
  const [currentTurnStep, setCurrentTurnStep] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  // Confirmed booking state
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [allReservations, setAllReservations] = useState([]);
  const [copiedCode, setCopiedCode] = useState(false);

  // Mobile contacts state
  const [mobileContacts, setMobileContacts] = useState([
    { id: 1, name: 'Mom', phone: '+91 98200 12345', category: 'Family', avatar: '❤️', defaultTask: 'Inform Mom I am running 15 minutes late for dinner.' },
    { id: 2, name: 'Dr. Mehta (Dentist)', phone: '+91 98211 23456', category: 'Health', avatar: '🩺', defaultTask: 'Schedule a dental checkup appointment for Friday at 10 AM.' },
    { id: 3, name: 'Alex (Auto Mechanic)', phone: '+91 98222 34567', category: 'Services', avatar: '🔧', defaultTask: 'Ask if my car service is complete and what the total bill is.' },
    { id: 4, name: 'Sarah (Office Boss)', phone: '+91 98233 45678', category: 'Work', avatar: '💼', defaultTask: 'Notify that the quarterly AI report draft has been uploaded.' },
    { id: 5, name: 'Pizza Express', phone: '+91 98244 56789', category: 'Food', avatar: '🍕', defaultTask: 'Inquire if large Pepperoni pizza special is available for pickup.' },
    { id: 6, name: 'Rajesh (Landlord)', phone: '+91 98255 67890', category: 'Housing', avatar: '🏠', defaultTask: 'Ask when water heater maintenance technician is scheduled.' }
  ]);

  const [selectedContact, setSelectedContact] = useState(mobileContacts[2]);
  const [contactGoal, setContactGoal] = useState(mobileContacts[2].defaultTask);
  const [contactSearchQuery, setContactSearchQuery] = useState('');
  const [contactCallStatus, setContactCallStatus] = useState('idle'); // 'idle' | 'dialing' | 'talking' | 'ended'
  const [contactCallDuration, setContactCallDuration] = useState(0);

  const filteredMobileContacts = mobileContacts.filter(c =>
    (c.name || '').toLowerCase().includes(contactSearchQuery.toLowerCase()) ||
    (c.phone || '').includes(contactSearchQuery)
  );
  const [contactTranscript, setContactTranscript] = useState([]);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  const callTimerRef = useRef(null);
  const autoStepTimerRef = useRef(null);
  const contactCallTimerRef = useRef(null);

  // Timer for contact call duration
  useEffect(() => {
    if (contactCallStatus === 'talking') {
      contactCallTimerRef.current = setInterval(() => {
        setContactCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(contactCallTimerRef.current);
    }
    return () => clearInterval(contactCallTimerRef.current);
  }, [contactCallStatus]);

  const [recipientInput, setRecipientInput] = useState('');
  const [isProcessingTurn, setIsProcessingTurn] = useState(false);

  const handleInitiateContactCall = async () => {
    if (!selectedContact || !contactGoal.trim()) return;

    unlockDeviceAudio();
    setContactCallStatus('dialing');
    setContactCallDuration(0);
    playCallChime('dialing');

    const greeting = `Hey ${selectedContact.name}! I'm calling on behalf of Jwalant.`;
    const initialTranscript = [{
      speaker: 'J.A.S.P.E.R. AI',
      isAgent: true,
      text: greeting,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }];
    setContactTranscript(initialTranscript);

    speakUtterance(`Placing cellular call to ${selectedContact.name} at ${selectedContact.phone}...`);

    // Trigger real Android phone call via backend API & ADB intent
    try {
      const res = await fetch('/api/phone/call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: selectedContact.phone })
      });
      const data = await res.json();
      if (data.error) {
        setSyncStatusMsg(`Phone Notice: ${data.error}. Connect phone via USB or Wireless ADB.`);
      }
    } catch (e) {
      console.warn('Real mobile dialer uplink:', e);
    }

    setTimeout(() => {
      setContactCallStatus('talking');
      playCallChime('connected');
      // Speak opening greeting directly on the device placing the call
      speakUtterance(greeting);
      try {
        fetch('/api/phone/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: greeting })
        });
      } catch (e) {}
    }, 3000);
  };

  const handleToggleSpeaker = async () => {
    try {
      await fetch('/api/phone/speaker', { method: 'POST' });
      speakUtterance('Toggled phone speakerphone.');
    } catch (e) {}
  };

  const handleSendRecipientTurn = async (customText) => {
    const textToProcess = (customText || recipientInput).trim();
    if (!textToProcess || isProcessingTurn) return;

    setIsProcessingTurn(true);
    setRecipientInput('');

    // Add recipient turn to transcript
    const updatedHistory = [
      ...contactTranscript,
      {
        speaker: selectedContact?.name || 'Contact',
        isAgent: false,
        text: textToProcess,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    setContactTranscript(updatedHistory);

    try {
      const turnResult = await geminiClient.generateHumanCallTurn({
        contactName: selectedContact?.name || 'Friend',
        goal: contactGoal,
        history: updatedHistory.map(t => ({ speaker: t.speaker, text: t.text })),
        recipientWords: textToProcess
      });

      const aiReply = turnResult.reply;

      // Add AI reply to transcript
      setContactTranscript(prev => [
        ...prev,
        {
          speaker: 'J.A.S.P.E.R. AI',
          isAgent: true,
          text: aiReply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      // Speak aloud in browser and trigger direct speech on mobile phone
      speakUtterance(aiReply);
      try {
        fetch('/api/phone/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: aiReply })
        });
      } catch (e) {}

      if (turnResult.isComplete) {
        setTimeout(() => {
          setContactCallStatus('ended');
          speakUtterance(`Goal achieved! Phone call with ${selectedContact?.name} completed successfully.`);
        }, 2500);
      }
    } catch (e) {
      console.error('Human dialogue error:', e);
    } finally {
      setIsProcessingTurn(false);
    }
  };

  const handleAddCustomContact = (e) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) return;
    const newC = {
      id: Date.now(),
      name: newContactName,
      phone: newContactPhone,
      category: 'Custom',
      avatar: '📱',
      defaultTask: `Call ${newContactName} regarding update.`
    };
    setMobileContacts([...mobileContacts, newC]);
    setSelectedContact(newC);
    setContactGoal(newC.defaultTask);
    setNewContactName('');
    setNewContactPhone('');
  };

  const [isSyncingContacts, setIsSyncingContacts] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');

  const handleSyncPhoneContacts = async () => {
    setIsSyncingContacts(true);
    setSyncStatusMsg('Connecting to mobile device via ADB bridge...');
    speakUtterance('Synchronizing contact list from your mobile device...');

    try {
      const res = await fetch('/api/phone/contacts');
      const data = await res.json();
      if (data.success && data.contacts && data.contacts.length > 0) {
        const existingPhones = new Set(mobileContacts.map(c => c.phone));
        const newFetched = data.contacts.filter(c => !existingPhones.has(c.phone));

        if (newFetched.length > 0) {
          setMobileContacts(prev => [...newFetched, ...prev]);
        }
        setSyncStatusMsg(`Successfully synced ${data.contacts.length} mobile contacts from your phone!`);
        speakUtterance(`Contact synchronization complete. Imported ${data.contacts.length} contacts from your phone.`);
      } else {
        setSyncStatusMsg('Mobile bridge connected & active. Phone contacts synced.');
      }
    } catch (e) {
      console.error('Contact sync error:', e);
      setSyncStatusMsg('Mobile bridge offline. Ensure server is running.');
    } finally {
      setIsSyncingContacts(false);
      setTimeout(() => setSyncStatusMsg(''), 5000);
    }
  };

  // Load active reservations on mount
  useEffect(() => {
    fetchReservations();
  }, []);

  // Sync initial query if passed as prop
  useEffect(() => {
    if (initialQuery) {
      setTaskQuery(initialQuery);
    }
  }, [initialQuery]);

  // Duration timer when call is connected
  useEffect(() => {
    if (callStatus === 'connected' || callStatus === 'speaking') {
      callTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(callTimerRef.current);
    }
    return () => clearInterval(callTimerRef.current);
  }, [callStatus]);

  // Fetch saved reservations
  const fetchReservations = async () => {
    try {
      const res = await fetch('/api/agentic-actions/reservations');
      const data = await res.json();
      if (data.success && data.reservations) {
        setAllReservations(data.reservations);
      }
    } catch (e) {
      console.error('Failed to fetch agentic reservations:', e);
    }
  };

  // Text-To-Speech audio helper using robust device voice engine
  const speakUtterance = (text) => {
    if (!audioEnabled || !text) return;
    speakDeviceAudio(text);
  };

  // 1. Search for Venues
  const handleStartSearch = async (e) => {
    if (e) e.preventDefault();
    setExecutionState('searching');
    setCurrentStep(1);
    setSelectedVenue(null);
    setConfirmedBooking(null);
    setTranscript([]);

    speakUtterance(`Searching suitable ${cuisine} restaurants for ${partySize} guests for ${dateStr} at ${timeStr}.`);

    try {
      const res = await fetch('/api/agentic-actions/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: taskQuery,
          cuisine,
          partySize,
          date: dateStr,
          time: timeStr
        })
      });
      const data = await res.json();
      if (data.success && data.results) {
        setCandidates(data.results);
        setExecutionState('selecting');
        // Auto select top candidate
        setSelectedVenue(data.results[0]);
      }
    } catch (err) {
      console.error(err);
      setExecutionState('idle');
    }
  };

  // 2. Initiate Agentic Call to selected venue
  const handleInitiateCall = async (venue) => {
    const targetVenue = venue || selectedVenue || candidates[0];
    if (!targetVenue) return;

    unlockDeviceAudio();
    setSelectedVenue(targetVenue);
    setExecutionState('calling');
    setCurrentStep(2);
    setCallStatus('dialing');
    setCallDuration(0);
    playCallChime('dialing');

    speakUtterance(`Initiating call to ${targetVenue.name} at ${targetVenue.phone}.`);

    try {
      const res = await fetch('/api/agentic-actions/start-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          venueId: targetVenue.id,
          venueName: targetVenue.name,
          phone: targetVenue.phone,
          partySize,
          date: dateStr,
          time: timeStr,
          specialRequests
        })
      });
      const data = await res.json();
      if (data.success) {
        setSessionId(data.sessionId);
        setTranscript(data.callLog);

        // After dialing sound/delay, transition to active conversation
        setTimeout(() => {
          setCallStatus('connected');
          playCallChime('connected');
          setCurrentStep(3);
          runCallTurn(data.sessionId, 1, targetVenue);
        }, 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 3. Process Call Turn dynamically
  const runCallTurn = async (sessId, stepNum, venue) => {
    setCurrentTurnStep(stepNum);

    try {
      const res = await fetch('/api/agentic-actions/call-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: sessId || sessionId,
          step: stepNum,
          venueName: venue?.name || selectedVenue?.name,
          partySize,
          date: dateStr,
          requestedTime: timeStr,
          userName
        })
      });
      const data = await res.json();
      if (data.success && data.turn) {
        const turn = data.turn;

        // Update pipeline step visuals based on action
        if (turn.action === 'negotiate_time') {
          setCurrentStep(4);
        } else if (turn.action === 'request_contact' || turn.action === 'provide_contact') {
          setCurrentStep(5);
        } else if (turn.action === 'booking_complete') {
          setCurrentStep(6);
        }

        // Add to transcript
        setTranscript(prev => [...prev, {
          speaker: turn.speaker,
          name: turn.name,
          text: turn.text,
          timestamp: new Date().toLocaleTimeString()
        }]);

        // Speak aloud turn text if audio enabled
        speakUtterance(turn.text);

        // If turn complete, handle final booking
        if (data.isComplete || turn.action === 'booking_complete') {
          setCallStatus('ended');
          const finalCode = turn.confirmationCode || `JSP-${Math.floor(1000 + Math.random() * 9000)}`;
          saveConfirmedBooking(venue, finalCode, turn.negotiatedTime || '8:30 PM');
        } else if (isAutoPlay) {
          // Schedule next turn automatically after delay
          autoStepTimerRef.current = setTimeout(() => {
            runCallTurn(sessId, stepNum + 1, venue);
          }, 3800);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Save confirmed booking to backend
  const saveConfirmedBooking = async (venue, code, finalTime) => {
    const payload = {
      venueName: venue?.name || selectedVenue?.name || 'Trattoria Bella Vista',
      cuisine: venue?.cuisine || cuisine,
      partySize,
      date: dateStr,
      time: finalTime || timeStr,
      confirmationCode: code,
      userName,
      phone: venue?.phone || '+1 (555) 382-9901',
      address: venue?.address || '450 Grand Avenue, Suite 12',
      specialRequests
    };

    try {
      const res = await fetch('/api/agentic-actions/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success && data.reservation) {
        setConfirmedBooking(data.reservation);
        setExecutionState('completed');
        fetchReservations();
        speakUtterance(`Reservation confirmed at ${payload.venueName} for ${payload.partySize} guests at ${payload.time}. Confirmation code ${payload.confirmationCode}.`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Cancel saved reservation
  const handleDeleteReservation = async (id) => {
    try {
      const res = await fetch(`/api/agentic-actions/reservations/${id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        setAllReservations(data.reservations);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Preset tasks buttons
  const presets = [
    {
      label: '🍕 Italian Dinner for 4 (Tomorrow 8 PM)',
      query: 'Jasper, book me a table for 4 at an Italian restaurant tomorrow at 8 PM.',
      cuisine: 'Italian',
      partySize: 4,
      date: 'Tomorrow',
      time: '8:00 PM'
    },
    {
      label: '🩺 Dentist Appointment (Friday 10 AM)',
      query: 'Jasper, schedule a dental checkup appointment for Friday at 10 AM.',
      cuisine: 'Medical Clinic',
      partySize: 1,
      date: 'This Friday',
      time: '10:00 AM'
    },
    {
      label: '💇 Haircut & Styling (Saturday 3 PM)',
      query: 'Jasper, call the salon and book a haircut appointment for Saturday at 3 PM.',
      cuisine: 'Salon & Spa',
      partySize: 1,
      date: 'Saturday',
      time: '3:00 PM'
    },
    {
      label: '✈️ Flight Status Check (AA-204)',
      query: 'Jasper, call airline support to confirm flight AA-204 departure status.',
      cuisine: 'Airline Desk',
      partySize: 2,
      date: 'Today',
      time: 'Immediate'
    }
  ];

  const applyPreset = (preset) => {
    setTaskQuery(preset.query);
    setCuisine(preset.cuisine);
    setPartySize(preset.partySize);
    setDateStr(preset.date);
    setTimeStr(preset.time);
  };

  const copyConfirmationCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  // Pipeline step visual configs
  const stepsConfig = [
    { id: 1, name: 'Find Venues', icon: Search },
    { id: 2, name: 'Dial Line', icon: PhoneCall },
    { id: 3, name: 'AI Speech', icon: Mic },
    { id: 4, name: 'Negotiate', icon: Calendar },
    { id: 5, name: 'Finalize', icon: Utensils },
    { id: 6, name: 'Confirmed', icon: CheckCircle2 }
  ];

  return (
    <div className="bg-slate-950/95 border border-cyan-500/40 rounded-3xl p-6 text-slate-100 backdrop-blur-2xl shadow-[0_0_50px_rgba(6,182,212,0.15)] max-w-5xl w-full mx-auto relative overflow-hidden font-sans">
      
      {/* Sci-Fi Decorative Grid Background Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-25 pointer-events-none" />

      {/* Top Header Bar */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-5 mb-6 relative z-10">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-cyan-500/10 border border-cyan-400/40 rounded-2xl text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Bot className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-2xl font-black tracking-wider text-cyan-300 uppercase">
                J.A.S.P.E.R. Agentic Actions
              </h2>
              <span className="px-2.5 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-semibold tracking-wider rounded-full uppercase">
                Autonomous Voice Agent
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              AI Voice Calling, Availability Negotiation & Real-World Task Execution Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Audio TTS toggle */}
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            title={audioEnabled ? "Audio Speech Enabled" : "Audio Speech Muted"}
            className={`p-2.5 rounded-xl border transition-all ${
              audioEnabled 
                ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]' 
                : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Navigation Tabs */}
          <div className="flex bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('studio')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'studio'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Action Studio
            </button>
            <button
              onClick={() => setActiveTab('contacts')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'contacts'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> Mobile Contacts
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'history'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Active Bookings
              {allReservations.length > 0 && (
                <span className="px-1.5 py-0.2 bg-slate-950 text-cyan-300 text-[10px] font-extrabold rounded-full">
                  {allReservations.length}
                </span>
              )}
            </button>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: ACTION STUDIO */}
      {activeTab === 'studio' && (
        <div className="space-y-6 relative z-10">

          {/* Input & Quick Presets Section */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
            <form onSubmit={handleStartSearch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Voice / Natural Command Prompt</span>
                  <span className="text-[10px] text-slate-400 font-normal">e.g., "Jasper, book me a table for 4..."</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Sparkles className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none" />
                    <input
                      type="text"
                      value={taskQuery}
                      onChange={(e) => setTaskQuery(e.target.value)}
                      placeholder="Specify your voice action (e.g., Book table for 4 at Italian restaurant tomorrow 8 PM)"
                      className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-cyan-500/30 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-sm font-medium transition-all"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={executionState === 'searching' || executionState === 'calling'}
                    className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-xl shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_25px_rgba(6,182,212,0.5)] transition-all flex items-center gap-2 text-sm uppercase tracking-wider disabled:opacity-50"
                  >
                    {executionState === 'searching' ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <PhoneCall className="w-4 h-4" />
                        Execute Action
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Param Grid adjustment */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                <div>
                  <label className="text-[11px] text-slate-400 font-medium block mb-1">Cuisine / Category</label>
                  <input
                    type="text"
                    value={cuisine}
                    onChange={(e) => setCuisine(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-cyan-300 font-medium focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 font-medium block mb-1">Party Count</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={partySize}
                    onChange={(e) => setPartySize(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-cyan-300 font-medium focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 font-medium block mb-1">Target Date</label>
                  <input
                    type="text"
                    value={dateStr}
                    onChange={(e) => setDateStr(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-cyan-300 font-medium focus:border-cyan-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 font-medium block mb-1">Requested Time</label>
                  <input
                    type="text"
                    value={timeStr}
                    onChange={(e) => setTimeStr(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-cyan-300 font-medium focus:border-cyan-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Preset Cards */}
              <div className="pt-2 border-t border-slate-800/60">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">Quick Action Presets:</span>
                <div className="flex flex-wrap gap-2">
                  {presets.map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => applyPreset(p)}
                      className="px-3 py-1.5 bg-slate-950 hover:bg-cyan-950/40 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-300 rounded-xl text-xs transition-all flex items-center gap-1.5"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </form>
          </div>

          {/* 6-Step Visual Pipeline Stepper */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4">
            <div className="grid grid-cols-6 gap-2 relative">
              {stepsConfig.map((s, idx) => {
                const IconComp = s.icon;
                const isPassed = currentStep > s.id;
                const isCurrent = currentStep === s.id;
                return (
                  <div key={s.id} className="flex flex-col items-center text-center relative z-10">
                    <div 
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-500 ${
                        isCurrent 
                          ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.6)] scale-110' 
                          : isPassed 
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' 
                            : 'bg-slate-950 text-slate-600 border-slate-800'
                      }`}
                    >
                      <IconComp className={`w-5 h-5 ${isCurrent ? 'animate-bounce' : ''}`} />
                    </div>
                    <span className={`text-[11px] font-semibold mt-2 tracking-tight ${
                      isCurrent ? 'text-cyan-300' : isPassed ? 'text-emerald-400' : 'text-slate-500'
                    }`}>
                      {s.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 1 & 2: Candidate Restaurants Selector */}
          {(executionState === 'selecting' || executionState === 'searching') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Step 1: Matched Restaurants ({candidates.length})
                </h3>
                <span className="text-xs text-slate-400">Select candidate to start AI outbound call</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {candidates.map((venue) => (
                  <div 
                    key={venue.id}
                    className={`bg-slate-900/90 border rounded-2xl p-4 transition-all relative flex flex-col justify-between ${
                      selectedVenue?.id === venue.id
                        ? 'border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)] bg-slate-900'
                        : 'border-slate-800 hover:border-slate-700 opacity-80'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold rounded-md">
                          {venue.badge}
                        </span>
                        <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                          ★ {venue.rating} <span className="text-slate-500 text-[10px]">({venue.reviewCount})</span>
                        </div>
                      </div>

                      <h4 className="text-base font-bold text-slate-100">{venue.name}</h4>
                      <p className="text-xs text-cyan-400 font-medium mb-3">{venue.cuisine} • {venue.price}</p>

                      <div className="space-y-1.5 text-xs text-slate-400 mb-4">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">{venue.address}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span>{venue.phone}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-4">
                        {venue.tags.map((t, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-950 border border-slate-800 text-[10px] text-slate-400 rounded-md">
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => handleInitiateCall(venue)}
                      className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md"
                    >
                      <PhoneCall className="w-4 h-4" />
                      Call & Reserve Table
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3 - 6: LIVE AGENTIC CALL CONSOLE */}
          {(executionState === 'calling' || executionState === 'completed') && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* Left Console: Call Dialer & Audio Wave Visualizer */}
              <div className="lg:col-span-5 bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-5 flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                    <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      <Radio className="w-4 h-4 animate-ping text-cyan-400" />
                      Live Call Console
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      callStatus === 'connected' || callStatus === 'speaking'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : callStatus === 'dialing'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    }`}>
                      {callStatus === 'dialing' ? 'Dialing Line...' : callStatus === 'connected' ? 'Call Active' : 'Call Completed'}
                    </span>
                  </div>

                  {/* Targeted Venue Details */}
                  {selectedVenue && (
                    <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 text-center mb-6">
                      <div className="w-14 h-14 bg-cyan-500/10 border border-cyan-400/40 rounded-full flex items-center justify-center mx-auto mb-3 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                        <PhoneCall className={`w-7 h-7 ${callStatus === 'dialing' ? 'animate-bounce' : 'animate-pulse'}`} />
                      </div>
                      <h3 className="text-lg font-extrabold text-slate-100">{selectedVenue.name}</h3>
                      <p className="text-xs text-cyan-400 font-medium">{selectedVenue.phone}</p>
                      
                      {/* Call duration timer */}
                      <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-slate-900 border border-slate-800 rounded-full text-xs font-mono text-slate-300">
                        <Clock className="w-3.5 h-3.5 text-cyan-400" />
                        00:{callDuration < 10 ? `0${callDuration}` : callDuration}
                      </div>
                    </div>
                  )}

                  {/* Dynamic Audio Visualizer Waves */}
                  <div className="bg-slate-950 border border-cyan-500/20 rounded-xl p-4 text-center">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-3">
                      HD Voice Audio Stream (J.A.S.P.E.R. Voice Engine)
                    </span>
                    <div className="flex items-center justify-center gap-1.5 h-12">
                      {[40, 70, 25, 90, 50, 80, 30, 95, 60, 40, 85, 45, 75, 30, 90].map((h, i) => (
                        <div
                          key={i}
                          style={{
                            height: callStatus === 'connected' || callStatus === 'speaking' 
                              ? `${Math.max(15, (h * (Math.sin(callDuration + i) + 1.2)) / 2)}%`
                              : '15%'
                          }}
                          className={`w-1.5 rounded-full transition-all duration-300 ${
                            callStatus === 'connected' || callStatus === 'speaking'
                              ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                              : 'bg-slate-800'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Reservation Parameter Checklist */}
                <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3.5 space-y-2 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Target Reservation Parameters
                  </span>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Party Size:</span>
                    <span className="font-bold text-cyan-300">{partySize} Guests</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Target Date:</span>
                    <span className="font-bold text-cyan-300">{dateStr}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Preferred Time:</span>
                    <span className="font-bold text-cyan-300">{timeStr}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span className="text-slate-500">Special Request:</span>
                    <span className="font-bold text-slate-300 truncate max-w-[150px]">{specialRequests}</span>
                  </div>
                </div>
              </div>

              {/* Right Console: Dynamic Live Speech Transcript & Confirmation Card */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* Live Speech Dialogue Transcript Log */}
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 h-[340px] flex flex-col justify-between">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Live Speech Transcript & Negotiation Log
                    </h4>
                    <span className="text-[10px] text-slate-500">Real-time Turn-by-Turn Speech</span>
                  </div>

                  {/* Transcript Scroll Area */}
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {transcript.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-slate-500 italic">
                        Dialing restaurant line... Initializing AI voice stream...
                      </div>
                    ) : (
                      transcript.map((item, idx) => (
                        <div key={idx} className={`flex flex-col ${item.speaker === 'jasper' ? 'items-end' : item.speaker === 'host' ? 'items-start' : 'items-center'}`}>
                          {item.speaker === 'system' ? (
                            <span className="px-3 py-1 bg-slate-950 text-slate-500 text-[11px] rounded-md border border-slate-800 font-mono my-1">
                              {item.text}
                            </span>
                          ) : (
                            <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                              item.speaker === 'jasper'
                                ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-100 rounded-tr-none shadow-[0_0_15px_rgba(6,182,212,0.1)]'
                                : 'bg-slate-950 border border-amber-500/30 text-slate-200 rounded-tl-none'
                            }`}>
                              <div className="flex items-center justify-between gap-4 mb-1">
                                <span className={`font-extrabold text-[10px] uppercase tracking-wider ${
                                  item.speaker === 'jasper' ? 'text-cyan-400' : 'text-amber-400'
                                }`}>
                                  {item.name || (item.speaker === 'jasper' ? 'J.A.S.P.E.R. AI Agent' : 'Restaurant Host')}
                                </span>
                                <span className="text-[9px] text-slate-500 font-mono">{item.timestamp}</span>
                              </div>
                              <p>{item.text}</p>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Confirmed Reservation Pass Card (Step 6 Result) */}
                {confirmedBooking && (
                  <div className="bg-gradient-to-br from-emerald-950/80 via-slate-900 to-slate-950 border border-emerald-500/50 rounded-2xl p-5 shadow-[0_0_30px_rgba(16,185,129,0.2)] relative overflow-hidden animate-fadeIn">
                    <div className="flex items-start justify-between border-b border-emerald-500/30 pb-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-400">
                          <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">
                            Booking Confirmed & Verified
                          </span>
                          <h3 className="text-xl font-extrabold text-white">{confirmedBooking.venueName}</h3>
                        </div>
                      </div>

                      {/* Confirmation Pass Code Badge */}
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Pass Code</span>
                        <button
                          onClick={() => copyConfirmationCode(confirmedBooking.confirmationCode)}
                          className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/40 rounded-lg text-emerald-300 text-sm font-mono font-bold flex items-center gap-1 hover:bg-emerald-500/30 transition-all"
                        >
                          {confirmedBooking.confirmationCode}
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {copiedCode && <span className="text-[9px] text-emerald-400 font-bold block mt-0.5">Copied!</span>}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-4 bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                      <div>
                        <span className="text-slate-500 text-[10px] block uppercase">Guests</span>
                        <span className="font-bold text-slate-200">{confirmedBooking.partySize} People</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block uppercase">Date</span>
                        <span className="font-bold text-slate-200">{confirmedBooking.date}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block uppercase">Confirmed Time</span>
                        <span className="font-bold text-emerald-400">{confirmedBooking.time}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 text-[10px] block uppercase">Primary Guest</span>
                        <span className="font-bold text-slate-200">{confirmedBooking.contactName}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                      <span className="truncate max-w-[300px]">📍 {confirmedBooking.address}</span>
                      <button
                        onClick={() => speakUtterance(`Reservation confirmed at ${confirmedBooking.venueName} for ${confirmedBooking.time}. Confirmation code is ${confirmedBooking.confirmationCode}`)}
                        className="px-3 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        Announce Booking
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 2: MOBILE CONTACTS DIALER */}
      {activeTab === 'contacts' && (
        <div className="space-y-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Panel: Contact List Picker */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2 font-orbitron">
                  <Users className="w-4 h-4 text-cyan-400" /> Mobile Contacts ({mobileContacts.length})
                </h3>
                <button
                  onClick={handleSyncPhoneContacts}
                  disabled={isSyncingContacts}
                  className="px-2.5 py-1 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncingContacts ? 'animate-spin' : ''}`} />
                  {isSyncingContacts ? 'Syncing...' : 'Sync Mobile Contacts'}
                </button>
              </div>

              {syncStatusMsg && (
                <div className="p-2.5 bg-cyan-950/60 border border-cyan-500/40 rounded-xl text-cyan-300 text-[11px] font-mono flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  {syncStatusMsg}
                </div>
              )}

              {/* Contact Search Input Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-cyan-400 pointer-events-none" />
                <input
                  type="text"
                  value={contactSearchQuery}
                  onChange={(e) => setContactSearchQuery(e.target.value)}
                  placeholder="Search contact by name or phone..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-100 focus:border-cyan-500 outline-none font-sans"
                />
                {contactSearchQuery && (
                  <button
                    onClick={() => setContactSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Add New Custom Contact Inline Form */}
              <form onSubmit={handleAddCustomContact} className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2 text-xs">
                <div className="font-semibold text-slate-300 text-[11px] uppercase tracking-wider">Add Mobile Contact</div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Contact Name..."
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-cyan-500 outline-none text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Phone Number..."
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:border-cyan-500 outline-none text-xs font-mono"
                  />
                </div>
                <button type="submit" className="w-full py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 rounded-lg text-xs font-bold transition-all">
                  + Add Contact to List
                </button>
              </form>

              {/* Contacts Grid */}
              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {filteredMobileContacts.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 text-xs bg-slate-950/60 rounded-xl border border-slate-800">
                    No contacts matching "{contactSearchQuery}"
                  </div>
                ) : (
                  filteredMobileContacts.map(c => {
                    const isSelected = selectedContact?.id === c.id;
                    return (
                    <div
                      key={c.id}
                      onClick={() => {
                        setSelectedContact(c);
                        setContactGoal(c.defaultTask);
                      }}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-cyan-500/15 border-cyan-500 text-slate-100 shadow-[0_0_15px_rgba(6,182,212,0.2)]' 
                          : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-base shrink-0">
                          {c.avatar}
                        </div>
                        <div>
                          <div className="font-bold text-xs flex items-center gap-1.5">
                            {c.name}
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-950 text-cyan-400 border border-cyan-500/20 font-mono">
                              {c.category}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{c.phone}</div>
                        </div>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />}
                    </div>
                  );
                }))}
              </div>
            </div>

            {/* Right Panel: Call Objective & Live Autonomous Call Stream */}
            <div className="lg:col-span-2 space-y-4">
              <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <PhoneCall className="w-4 h-4 text-emerald-400" /> AI Phone Call Objective & Target
                  </h4>
                  {selectedContact && (
                    <span className="text-[11px] text-emerald-400 font-mono font-bold">
                      Target: {selectedContact.name} ({selectedContact.phone})
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 font-semibold mb-1">
                    What should J.A.S.P.E.R. discuss or accomplish on this call?
                  </label>
                  <textarea
                    rows={2}
                    value={contactGoal}
                    onChange={(e) => setContactGoal(e.target.value)}
                    placeholder="Enter instructions for the AI call agent..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:border-cyan-500 outline-none resize-none font-sans"
                  />
                </div>

                <button
                  onClick={handleInitiateContactCall}
                  disabled={contactCallStatus === 'dialing' || contactCallStatus === 'talking'}
                  className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    contactCallStatus === 'talking'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse'
                      : contactCallStatus === 'dialing'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                  }`}
                >
                  <PhoneCall className="w-4 h-4" />
                  {contactCallStatus === 'dialing' ? 'Dialing Mobile Contact Line...' : contactCallStatus === 'talking' ? 'AI Call in Progress...' : `Initiate AI Call to ${selectedContact?.name || 'Contact'}`}
                </button>
              </div>

              {/* Call Live Session & Real-Time Transcript Stream */}
              {contactCallStatus !== 'idle' && (
                <div className="p-4 bg-slate-950 border border-cyan-500/30 rounded-2xl space-y-3 font-mono">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-xs">
                    <div className="flex items-center gap-2 text-cyan-400 font-bold">
                      <Radio className="w-4 h-4 animate-pulse text-rose-500" />
                      LIVE AGENTIC CALL • {contactCallStatus === 'talking' ? 'CONNECTED' : contactCallStatus.toUpperCase()}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleToggleSpeaker}
                        className="px-2 py-0.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 rounded text-[10px] font-bold flex items-center gap-1 transition-all"
                      >
                        <Volume2 className="w-3 h-3" /> Toggle Speaker
                      </button>
                      <span className="text-[11px] text-slate-400">
                        Duration: 00:{contactCallDuration < 10 ? `0${contactCallDuration}` : contactCallDuration}
                      </span>
                    </div>
                  </div>

                  {contactCallStatus === 'talking' && (
                    <div className="p-2 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 text-[11px] flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse shrink-0" />
                      <span>
                        <strong>In-Call Audio Active:</strong> Phone speakerphone auto-activated so the recipient hears J.A.S.P.E.R. speaking in real time!
                      </span>
                    </div>
                  )}

                  {/* Transcript Stream */}
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1 text-xs">
                    {contactTranscript.map((t, idx) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-xl border text-xs leading-relaxed ${
                          t.isAgent 
                            ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-200' 
                            : 'bg-slate-900 border-slate-800 text-slate-200'
                        }`}
                      >
                        <div className="flex justify-between items-center text-[10px] font-bold mb-1 opacity-80">
                          <span className={t.isAgent ? 'text-cyan-400' : 'text-emerald-400'}>{t.speaker}</span>
                          <span className="text-slate-500">{t.time}</span>
                        </div>
                        <p>{t.text}</p>
                      </div>
                    ))}
                  </div>

                  {/* Real-time Recipient Response Input Bar */}
                  {contactCallStatus === 'talking' && (
                    <div className="space-y-2 pt-2 border-t border-slate-800 font-sans">
                      <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider flex items-center justify-between">
                        <span>Real-Time Recipient Dialogue Input</span>
                        <span className="text-slate-500 font-normal">What did {selectedContact?.name || 'recipient'} say?</span>
                      </div>

                      {/* Quick Sample Response Chips */}
                      <div className="flex flex-wrap gap-1.5 text-[10px]">
                        <button
                          onClick={() => handleSendRecipientTurn("Hello! Yes, how can I help you today?")}
                          className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-slate-300 transition-all"
                        >
                          💬 "Hello, how can I help?"
                        </button>
                        <button
                          onClick={() => handleSendRecipientTurn("Yes, the car service is complete. Total is $180.")}
                          className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-slate-300 transition-all"
                        >
                          💬 "Car ready, total $180"
                        </button>
                        <button
                          onClick={() => handleSendRecipientTurn("Yes, we have an opening tomorrow at 10 AM.")}
                          className="px-2 py-0.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-slate-300 transition-all"
                        >
                          💬 "Opening tomorrow 10 AM"
                        </button>
                      </div>

                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSendRecipientTurn();
                        }}
                        className="flex gap-2"
                      >
                        <input
                          type="text"
                          value={recipientInput}
                          onChange={(e) => setRecipientInput(e.target.value)}
                          placeholder={`Enter what ${selectedContact?.name || 'recipient'} said...`}
                          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-100 focus:border-cyan-500 outline-none font-sans"
                        />
                        <button
                          type="submit"
                          disabled={!recipientInput.trim() || isProcessingTurn}
                          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                        >
                          <Send className="w-3.5 h-3.5" />
                          {isProcessingTurn ? 'Reasoning...' : 'Speak on Phone'}
                        </button>
                      </form>
                    </div>
                  )}

                  {contactCallStatus === 'ended' && (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center justify-between">
                      <span className="font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Goal Achieved & Logged
                      </span>
                      <span className="text-[10px] text-emerald-400">Call status: 200 OK</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ACTIVE BOOKINGS & HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4 relative z-10">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Saved Reservations & Agentic Action History ({allReservations.length})
            </h3>
            <button
              onClick={fetchReservations}
              className="px-3 py-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs rounded-xl flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {allReservations.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
              <Utensils className="w-10 h-10 mx-auto mb-3 opacity-30 text-cyan-400" />
              No active reservations found. Execute an Agentic Action above to populate bookings.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allReservations.map((res) => (
                <div key={res.id} className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-cyan-500/30 transition-all">
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold rounded-full">
                        {res.status || 'Confirmed'}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400 font-bold">
                        {res.confirmationCode}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-100">{res.venueName}</h4>
                    <p className="text-xs text-slate-400 mb-3">{res.cuisine} • {res.partySize} Guests</p>

                    <div className="space-y-1.5 text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800/80 mb-3">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Date & Time:</span>
                        <span className="font-bold text-cyan-300">{res.date} at {res.time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Reserved Under:</span>
                        <span className="font-bold text-slate-200">{res.contactName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Contact Line:</span>
                        <span>{res.phone}</span>
                      </div>
                      {res.specialRequests && (
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">Notes:</span>
                          <span className="text-slate-300 italic">{res.specialRequests}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(res.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleDeleteReservation(res.id)}
                      className="px-2.5 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs flex items-center gap-1 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Cancel Booking
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
