import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  MapPin,
  Send,
  Trash2,
  X,
  ExternalLink,
  Navigation,
  Bot,
  User,
  Zap,
  Cpu,
  Layers,
  Check,
  Compass,
  ArrowUpRight,
  Maximize2,
  Minimize2,
  RefreshCw,
  Quote,
  Copy
} from 'lucide-react';
import confetti from 'canvas-confetti';

export type AIRoleId = 'consultant' | 'places' | 'fast' | 'architect';

export interface GroundedPlace {
  title: string;
  uri: string;
  reviewSnippets: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  modelUsed?: string;
  roleId?: AIRoleId;
  groundingMetadata?: any;
  extractedPlaces?: GroundedPlace[];
  isError?: boolean;
}

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyPlaceToQR?: (place: { title: string; uri: string; lat?: number; lng?: number }) => void;
  initialRole?: AIRoleId;
  initialQuery?: string;
}

const ROLES: Array<{
  id: AIRoleId;
  name: string;
  model: string;
  icon: any;
  badge: string;
  tagline: string;
  color: string;
}> = [
  {
    id: 'consultant',
    name: 'QR Consultant',
    model: 'gemini-3.5-flash',
    icon: Sparkles,
    badge: 'General & Design',
    tagline: 'Advice on QR types, scannability, color contrast, and marketing CTAs',
    color: 'indigo',
  },
  {
    id: 'places',
    name: 'Maps & Places',
    model: 'gemini-3.5-flash',
    icon: MapPin,
    badge: 'Google Maps Grounded',
    tagline: 'Find real venues, restaurants, and addresses with live Google Maps links',
    color: 'emerald',
  },
  {
    id: 'fast',
    name: 'Fast Slogans',
    model: 'gemini-3.1-flash-lite',
    icon: Zap,
    badge: 'Ultra Fast',
    tagline: 'Rapid CTA phrases, frame titles, and punchy promotional lines',
    color: 'amber',
  },
  {
    id: 'architect',
    name: 'Deep Architect',
    model: 'gemini-3.1-pro-preview',
    icon: Cpu,
    badge: 'Technical & Math',
    tagline: 'Reed-Solomon error correction, ISO standards, and high-density encoding',
    color: 'purple',
  },
];

const PROMPT_SUGGESTIONS: Record<AIRoleId, string[]> = {
  consultant: [
    'What QR code type should I use for a restaurant menu?',
    'How can I ensure high scannability on a billboard?',
    'Recommend a high-contrast color scheme for an eco-brand',
    'What is the difference between static and dynamic QR codes?',
  ],
  places: [
    'Find popular coffee shops in Seattle for a QR location tag',
    'Give me the Google Maps link and details for the Louvre Museum',
    'Find top Italian restaurants in Chicago with great reviews',
    'Find the exact address and location for Central Park Zoo NYC',
  ],
  fast: [
    'Give me 5 catchy 3-word frame titles (e.g. SCAN TO TASTE)',
    'Generate 4 short subtitles for a 20% discount QR code',
    'Generate 5 Wi-Fi QR call-to-actions for hotel guests',
    'Snappy slogan for an indie musician link-in-bio QR',
  ],
  architect: [
    'Explain the Reed-Solomon math behind QR Error Correction Level H (30%)',
    'What is the optimal print size formula based on scanning distance?',
    'Explain the byte encoding vs alphanumeric encoding data limits',
    'What are the mandatory quiet zone specifications in ISO/IEC 18004?',
  ],
};

export const AIChatModal: React.FC<AIChatModalProps> = ({
  isOpen,
  onClose,
  onApplyPlaceToQR,
  initialRole = 'consultant',
  initialQuery = '',
}) => {
  const [currentRole, setCurrentRole] = useState<AIRoleId>(initialRole);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'welcome-1',
      role: 'model',
      content: `Hello! I am your **MakeQR Intelligent Assistant**. 

I can help you:
- **Design & Optimize QR Codes** (Colors, Contrast, Call-to-Actions, Framing)
- **Find Real Places with Google Maps Grounding** (Direct Google Maps links & review snippets)
- **Generate Rapid Slogans & Frame Titles** at lightning speed
- **Analyze Deep Technical Specs** (Error correction levels, ISO standards, print formulas)

How can I help you today? Ask a question below or pick a quick suggestion!`,
      timestamp: Date.now(),
      modelUsed: 'gemini-3.5-flash',
      roleId: 'consultant',
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);
  const [isCopiedId, setIsCopiedId] = useState<string | null>(null);
  const [appliedPlaceUri, setAppliedPlaceUri] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Sync initialRole if passed from props
  useEffect(() => {
    if (initialRole) {
      setCurrentRole(initialRole);
    }
  }, [initialRole]);

  // If initial query provided, auto-trigger
  useEffect(() => {
    if (isOpen && initialQuery && initialQuery.trim().length > 0) {
      sendMessage(initialQuery.trim());
    }
  }, [isOpen, initialQuery]);

  // Auto-scroll to bottom of messages thread
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isOpen]);

  // Request browser geolocation for Maps Grounding
  const handleGetLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocationStatus('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocationStatus('Acquiring your GPS coordinates...');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          latitude: Number(pos.coords.latitude.toFixed(5)),
          longitude: Number(pos.coords.longitude.toFixed(5)),
        };
        setUserLocation(coords);
        setIsLocating(false);
        setLocationStatus(`GPS Active (${coords.latitude}°, ${coords.longitude}°)`);
        setTimeout(() => setLocationStatus(null), 4000);
      },
      (err) => {
        setIsLocating(false);
        setLocationStatus('Could not retrieve location. You can specify city names manually.');
        setTimeout(() => setLocationStatus(null), 4000);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const sendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      role: 'user',
      content: query,
      timestamp: Date.now(),
      roleId: currentRole,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      // Map entire conversation history to backend format for multi-turn chat
      const payloadMessages = newMessages.map((m) => ({
        role: m.role === 'model' ? 'model' : 'user',
        content: m.content,
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          roleId: currentRole,
          userLocation: userLocation || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch AI response');
      }

      const modelMsg: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        role: 'model',
        content: data.reply || 'No text response received.',
        timestamp: Date.now(),
        modelUsed: data.modelUsed,
        roleId: currentRole,
        groundingMetadata: data.groundingMetadata,
        extractedPlaces: data.extractedPlaces || [],
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'model',
        content: `**Request Notice**: ${err.message || 'Unable to complete AI request.'}\n\nPlease verify that your Gemini API key is configured in the environment.`,
        timestamp: Date.now(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'model',
        content: `Conversation cleared. I am ready with **${ROLES.find((r) => r.id === currentRole)?.name}** mode active. What would you like to explore?`,
        timestamp: Date.now(),
        modelUsed: ROLES.find((r) => r.id === currentRole)?.model,
        roleId: currentRole,
      },
    ]);
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setIsCopiedId(id);
    setTimeout(() => setIsCopiedId(null), 2000);
  };

  const handleApplyPlace = (place: GroundedPlace) => {
    if (onApplyPlaceToQR) {
      onApplyPlaceToQR({
        title: place.title,
        uri: place.uri,
      });
      setAppliedPlaceUri(place.uri);
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.8 },
      });
      setTimeout(() => setAppliedPlaceUri(null), 3000);
    }
  };

  if (!isOpen) return null;

  const activeRoleConfig = ROLES.find((r) => r.id === currentRole) || ROLES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-3 sm:p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative flex h-[90vh] max-h-[820px] w-full max-w-4xl flex-col rounded-2xl border border-slate-200/80 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-6 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-md">
              <Bot className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white">
                  MakeQR AI Assistant & Places
                </h3>
                <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 dark:bg-indigo-950/80 px-2 py-0.5 text-[10px] font-bold text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  <Sparkles className="h-2.5 w-2.5" />
                  Gemini Grounded
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Multi-turn conversation with Google Maps real-time place grounding
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-2 sm:mt-0">
            {/* Clear History Button */}
            <button
              type="button"
              onClick={handleClearHistory}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Clear conversation history"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-200/70 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white transition-colors cursor-pointer"
              title="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Role Selector Bar */}
        <div className="border-b border-slate-200 bg-white px-4 py-2.5 sm:px-6 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
              Active Gemini Specialist:
            </span>
            {currentRole === 'places' && (
              <div className="flex items-center gap-2">
                {userLocation ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                    <Navigation className="h-3 w-3" />
                    GPS Connected
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={isLocating}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    <Navigation className={`h-3 w-3 ${isLocating ? 'animate-spin' : ''}`} />
                    <span>{isLocating ? 'Locating...' : 'Enable GPS Grounding'}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {locationStatus && (
            <div className="mb-2 text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              {locationStatus}
            </div>
          )}

          {/* 4 Specialized Roles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {ROLES.map((role) => {
              const Icon = role.icon;
              const isSelected = currentRole === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setCurrentRole(role.id)}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/80 dark:border-indigo-500 dark:bg-indigo-950/40 shadow-xs ring-1 ring-indigo-500'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold truncate text-slate-900 dark:text-white">
                        {role.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono block truncate">
                      {role.model}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Messages Scrollable Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 mt-1">
                    <Bot className="h-4 w-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] sm:max-w-[78%] rounded-2xl p-4 text-sm leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-indigo-600 text-white rounded-tr-xs'
                      : msg.isError
                      ? 'bg-red-50 text-red-900 border border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900 rounded-tl-xs'
                      : 'bg-slate-100/90 text-slate-900 border border-slate-200/70 dark:bg-slate-800/80 dark:text-slate-100 dark:border-slate-700/60 rounded-tl-xs'
                  }`}
                >
                  {/* Model & Timestamp Header for Model turns */}
                  {!isUser && (
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-1.5 text-[11px] text-slate-500 dark:border-slate-700/60 dark:text-slate-400">
                      <div className="flex items-center gap-1.5 font-mono">
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                          {msg.modelUsed || activeRoleConfig.model}
                        </span>
                        {msg.roleId === 'places' && (
                          <span className="inline-flex items-center gap-0.5 rounded bg-emerald-100 dark:bg-emerald-950 px-1 py-0.2 text-[9px] font-bold text-emerald-700 dark:text-emerald-300">
                            <MapPin className="h-2.5 w-2.5" />
                            Google Maps Grounded
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="flex items-center gap-1 text-[10px] hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                        title="Copy message"
                      >
                        {isCopiedId === msg.id ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-500" />
                            <span className="text-emerald-500">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Message Body with simple markdown-like rendering */}
                  <div className="whitespace-pre-wrap leading-relaxed break-words font-sans">
                    {msg.content}
                  </div>

                  {/* Google Maps Grounded Places Display (MANDATORY REQUIREMENT) */}
                  {msg.extractedPlaces && msg.extractedPlaces.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-700/80 space-y-2.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        <MapPin className="h-3.5 w-3.5 text-emerald-500" />
                        <span>Google Maps Grounding Sources ({msg.extractedPlaces.length})</span>
                      </div>

                      <div className="grid gap-2">
                        {msg.extractedPlaces.map((place, idx) => (
                          <div
                            key={idx}
                            className="rounded-xl border border-emerald-200/80 bg-white p-3 shadow-2xs dark:border-emerald-900/60 dark:bg-slate-900/90 text-slate-800 dark:text-slate-200 transition-all hover:border-emerald-300"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <MapPin className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                  {place.title}
                                </h4>
                              </div>

                              <div className="flex items-center gap-1.5">
                                {/* Mandatory clickable link to maps.uri */}
                                {place.uri && (
                                  <a
                                    href={place.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-900/80 transition-colors"
                                    title="Open directly on Google Maps"
                                  >
                                    <span>Google Maps</span>
                                    <ExternalLink className="h-3 w-3" />
                                  </a>
                                )}

                                {/* One-click Apply to QR Studio */}
                                {onApplyPlaceToQR && place.uri && (
                                  <button
                                    type="button"
                                    onClick={() => handleApplyPlace(place)}
                                    className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-2 py-1 text-[11px] font-bold text-white hover:bg-indigo-700 transition-colors shadow-2xs cursor-pointer active:scale-95"
                                  >
                                    {appliedPlaceUri === place.uri ? (
                                      <>
                                        <Check className="h-3 w-3" />
                                        <span>Applied!</span>
                                      </>
                                    ) : (
                                      <>
                                        <ArrowUpRight className="h-3 w-3" />
                                        <span>Make Place QR</span>
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Review Snippets */}
                            {place.reviewSnippets && place.reviewSnippets.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {place.reviewSnippets.map((snippet, sIdx) => (
                                  <div
                                    key={sIdx}
                                    className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800"
                                  >
                                    <Quote className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
                                    <span>"{snippet}"</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200 mt-1">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
              </div>
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-100 px-4 py-2.5 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <span className="font-semibold">{activeRoleConfig.model}</span>
                <span>is thinking...</span>
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-600 [animation-delay:-0.3s]"></span>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-600 [animation-delay:-0.15s]"></span>
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-600"></span>
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Prompt Chips */}
        <div className="border-t border-slate-200 bg-slate-50/60 px-4 py-2 sm:px-6 dark:border-slate-800 dark:bg-slate-900/50">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">
              Suggestions:
            </span>
            {(PROMPT_SUGGESTIONS[currentRole] || []).map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => sendMessage(prompt)}
                disabled={isLoading}
                className="whitespace-nowrap rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-colors dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-indigo-600 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-300 cursor-pointer disabled:opacity-50"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="border-t border-slate-200 bg-white p-3 sm:p-4 dark:border-slate-800 dark:bg-slate-900">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex items-end gap-2"
          >
            <div className="relative flex-1">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder={
                  currentRole === 'places'
                    ? 'Search real venues, cafes, landmarks for Google Maps QR (e.g. "Best bakeries in Brooklyn")...'
                    : currentRole === 'fast'
                    ? 'Ask for punchy CTAs or slogans (e.g. "5 frame titles for Wi-Fi QR")...'
                    : currentRole === 'architect'
                    ? 'Ask technical questions (e.g. "Calculate QR dimensions for 3-meter scan distance")...'
                    : 'Ask anything about QR styling, scannability, conversion, or ideas...'
                }
                rows={2}
                className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-800/90 dark:text-white dark:focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md hover:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer active:scale-95"
              title="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>
              Press <kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">Enter</kbd> to send, <kbd className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-[10px]">Shift+Enter</kbd> for new line
            </span>
            <span className="font-mono text-[10px]">
              Model: {activeRoleConfig.model}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
