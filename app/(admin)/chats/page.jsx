"use client";

import { useState, useEffect, useRef } from "react";
import { PageHeader, PageSection } from "../../../components/admin/Sections";

export default function ChatsPage() {
  const [sessions, setSessions] = useState([]);
  const [activeUserId, setActiveUserId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);
  const sessionsIntervalRef = useRef(null);
  const messagesIntervalRef = useRef(null);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch all chat sessions
  const fetchSessions = async (silent = false) => {
    if (!silent) setLoadingSessions(true);
    try {
      const res = await fetch("/api/chat/sessions");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setSessions(data.sessions);
        }
      }
    } catch (err) {
      console.error("Error fetching chat sessions:", err);
    } finally {
      if (!silent) setLoadingSessions(false);
    }
  };

  // Fetch messages for active user
  const fetchMessages = async (userId, silent = false) => {
    if (!userId) return;
    if (!silent) setLoadingMessages(true);
    try {
      const res = await fetch(`/api/chat/messages?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMessages(data.messages);
          // If we successfully fetched and marked as read, let's update sessions locally to clear unread count
          setSessions((prev) =>
            prev.map((s) =>
              s.userId === userId ? { ...s, unreadCount: 0 } : s
            )
          );
        }
      }
    } catch (err) {
      console.error("Error fetching chat messages:", err);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  // Poll sessions list
  useEffect(() => {
    fetchSessions();
    sessionsIntervalRef.current = setInterval(() => {
      fetchSessions(true);
    }, 5000);

    return () => {
      if (sessionsIntervalRef.current) clearInterval(sessionsIntervalRef.current);
    };
  }, []);

  // Poll messages for active session
  useEffect(() => {
    if (!activeUserId) {
      setMessages([]);
      return;
    }

    fetchMessages(activeUserId);

    messagesIntervalRef.current = setInterval(() => {
      fetchMessages(activeUserId, true);
    }, 3000);

    return () => {
      if (messagesIntervalRef.current) clearInterval(messagesIntervalRef.current);
    };
  }, [activeUserId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send message from admin
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeUserId || sending) return;

    const textToSend = inputText.trim();
    setInputText("");
    setSending(true);

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: activeUserId,
          message: textToSend,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMessages((prev) => [...prev, data.message]);
          // Update the session list's latest message immediately
          setSessions((prev) =>
            prev.map((s) =>
              s.userId === activeUserId
                ? {
                  ...s,
                  latestMessage: textToSend,
                  latestTimestamp: new Date().toISOString(),
                }
                : s
            )
          );
          scrollToBottom();
        }
      }
    } catch (err) {
      console.error("Error sending admin message:", err);
    } finally {
      setSending(false);
    }
  };

  // Filter sessions based on search query
  const filteredSessions = sessions.filter(
    (s) =>
      (s.userName && s.userName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.userEmail && s.userEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.latestMessage && s.latestMessage.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Get active session details
  const activeSession = sessions.find((s) => s.userId === activeUserId);

  // Format time helper
  const formatTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      <PageHeader
        eyebrow="Support"
        title="Customer Chats"
        description="Interact directly with your shop customers in real-time. Answer inquiries, resolve issues, and provide support."
      />

      <PageSection>
        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] h-[600px] bg-fjord-panel border border-fjord-soft-line rounded-[28px] overflow-hidden shadow-fjord-soft">

          {/* Left Column: Sessions List */}
          <div className={`border-r border-fjord-soft-line flex flex-col min-h-0 bg-fjord-panel-strong/10 ${activeUserId ? "hidden lg:flex" : "flex"}`}>
            {/* Search */}
            <div className="p-4 border-b border-fjord-soft-line bg-fjord-panel flex-shrink-0">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-fjord-panel-strong/40 text-fjord-ink placeholder:text-fjord-ink/40 border border-fjord-soft-line rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-fjord-accent transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-fjord-ink/40 hover:text-fjord-ink text-xs cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Sessions Scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-1">
              {loadingSessions && sessions.length === 0 ? (
                <div className="h-full flex items-center justify-center p-4">
                  <span className="text-xs text-fjord-muted">Loading conversations...</span>
                </div>
              ) : filteredSessions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                  <span className="text-xs text-fjord-muted font-semibold">No chats found</span>
                  <p className="text-[10px] text-fjord-muted/60 mt-1 max-w-[180px]">
                    {searchQuery ? "Try refining your search query." : "Incoming customer messages will appear here."}
                  </p>
                </div>
              ) : (
                filteredSessions.map((s) => {
                  const isActive = s.userId === activeUserId;
                  return (
                    <button
                      key={s.userId}
                      onClick={() => setActiveUserId(s.userId)}
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all flex flex-col gap-1.5 cursor-pointer ${isActive
                          ? "bg-fjord-accent border-transparent text-fjord-bg shadow-md shadow-fjord-accent/10"
                          : "bg-fjord-panel-strong/20 border-transparent text-fjord-ink hover:bg-fjord-panel-strong/40 hover:border-fjord-soft-line/60"
                        }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold truncate leading-none">
                          {s.userName}
                        </span>
                        <span
                          className={`text-[9px] font-semibold tracking-wider uppercase leading-none ${isActive ? "text-fjord-bg/60" : "text-fjord-muted"
                            }`}
                        >
                          {formatTime(s.latestTimestamp)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <p
                          className={`text-[11px] truncate m-0 flex-grow ${isActive ? "text-fjord-bg/85" : "text-fjord-muted"
                            }`}
                        >
                          {s.latestMessage}
                        </p>
                        {s.unreadCount > 0 && !isActive && (
                          <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                            {s.unreadCount}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Chat Window */}
          <div className={`flex flex-col min-h-0 bg-fjord-panel ${activeUserId ? "flex" : "hidden lg:flex"}`}>
            {activeUserId ? (
              <>
                {/* Active Chat Header */}
                <div className="p-4 border-b border-fjord-soft-line bg-fjord-panel flex items-center gap-3 flex-shrink-0">
                  {/* Back button – visible only on mobile */}
                  <button
                    onClick={() => setActiveUserId(null)}
                    className="lg:hidden flex items-center justify-center w-8 h-8 rounded-xl bg-fjord-panel-strong/30 border border-fjord-soft-line text-fjord-ink hover:bg-fjord-panel-strong/50 transition-colors cursor-pointer flex-shrink-0"
                    aria-label="Back to conversations"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <div className="flex flex-col flex-grow">
                    <span className="text-xs font-bold text-fjord-ink leading-none">
                      {activeSession?.userName || "Loading..."}
                    </span>
                    <span className="text-[10px] text-fjord-muted mt-1 leading-none">
                      {activeSession?.userEmail || ""}
                    </span>
                  </div>
                </div>

                {/* Messages Body */}
                <div className="flex-1 min-h-0 p-4 overflow-y-auto space-y-4 scrollbar-thin bg-fjord-panel-strong/5">
                  {loadingMessages && messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <span className="text-xs text-fjord-muted">Loading messages...</span>
                    </div>
                  ) : (
                    <>
                      {messages.map((msg) => {
                        const isAdmin = msg.sender === "admin";
                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${isAdmin ? "items-end" : "items-start"
                              }`}
                          >
                            <div className="max-w-[70%] space-y-1">
                              <div
                                className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${isAdmin
                                    ? "bg-fjord-accent text-fjord-bg rounded-tr-none shadow-sm"
                                    : "bg-fjord-panel-strong/60 border border-fjord-soft-line text-fjord-ink rounded-tl-none"
                                  }`}
                              >
                                <p className="m-0 break-words whitespace-pre-wrap">{msg.message}</p>
                              </div>
                              <span className="block text-[9px] text-fjord-muted px-1 text-right">
                                {formatTime(msg.timestamp)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                {/* Message Input Footer */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 bg-fjord-panel border-t border-fjord-soft-line flex gap-2 items-center flex-shrink-0"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={`Reply to ${activeSession?.userName || "customer"}...`}
                    disabled={sending}
                    className="flex-grow bg-fjord-panel-strong/40 text-fjord-ink placeholder:text-fjord-ink/40 border border-fjord-soft-line rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-fjord-accent transition-colors disabled:opacity-75"
                  />
                  <button
                    type="submit"
                    disabled={!inputText.trim() || sending}
                    className="h-[36px] px-4 rounded-xl bg-fjord-accent text-fjord-bg flex items-center justify-center hover:opacity-90 active:scale-95 transition-all cursor-pointer text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
                  >
                    {sending ? "Sending..." : "Send"}
                  </button>
                </form>
              </>
            ) : (
              // Empty State
              <div className="h-full flex flex-col items-center justify-center text-center p-8 gap-4">
                <div className="w-14 h-14 rounded-full bg-fjord-panel-strong/20 border border-fjord-soft-line flex items-center justify-center text-fjord-muted">
                  <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-fjord-ink">No conversation selected</h4>
                  <p className="text-[11px] text-fjord-muted mt-1 max-w-[240px] mx-auto">
                    Select a customer from the conversation list on the left to start a real-time support chat.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </PageSection>
    </>
  );
}
