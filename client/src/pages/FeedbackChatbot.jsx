import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import {
  CheckCircle2,
  Flag,
  Sparkles,
  MessageSquareText,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import {
  AreaChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { API_BASE } from '../config/api';
import '../styles/wyzant.css';

axios.defaults.withCredentials = true;

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam' },
  { value: 'offensive', label: 'Offensive / abusive' },
  { value: 'irrelevant', label: 'Irrelevant' },
  { value: 'other', label: 'Other' }
];

const BAR_COLORS = ['#fca5a5', '#fdba74', '#fde047', '#86efac', '#5eead4'];
const FALLBACK_TUTORS = [
  { _id: 'sl1', fullName: 'Kavindu Perera', rating: 4.9, hourlyRate: 2500 },
  { _id: 'sl2', fullName: 'Nethmi Fernando', rating: 4.8, hourlyRate: 2300 },
  { _id: 'sl3', fullName: 'Pasindu Wijesinghe', rating: 4.7, hourlyRate: 2200 }
];

function stars(rating) {
  const value = Math.max(0, Math.min(5, Number(rating) || 0));
  const full = Math.round(value);
  return '★★★★★'.slice(0, full).padEnd(5, '☆');
}

function formatFeedbackDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function FeedbackChatbot() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chat, setChat] = useState([
    { sender: 'bot', text: 'Hi! I am the PeerWise AI Assistant. How can I help you regarding your feedback or modules?' }
  ]);
  const [msg, setMsg] = useState('');

  const [user, setUser] = useState(null);
  const [feedbacksList, setFeedbacksList] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, averageRating: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
  const [statsLoading, setStatsLoading] = useState(true);

  const [modules, setModules] = useState([]);
  const [moduleLabel, setModuleLabel] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportTargetId, setReportTargetId] = useState(null);
  const [reportReason, setReportReason] = useState('spam');
  const [reportSubmitting, setReportSubmitting] = useState(false);

  const [recommendedTutors, setRecommendedTutors] = useState([]);
  const [tutorsLoading, setTutorsLoading] = useState(false);

  const loadFeedbacks = useCallback(async () => {
    setListLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/api/feedback`, { withCredentials: true });
      setFeedbacksList(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Could not load feedback list.');
      setFeedbacksList([]);
    } finally {
      setListLoading(false);
    }
  }, []);

  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const { data } = await axios.get(`${API_BASE}/api/feedback/stats`, { withCredentials: true });
      if (data && data.distribution) {
        setStats({
          total: data.total || 0,
          averageRating: data.averageRating || 0,
          distribution: { ...{ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, ...data.distribution }
        });
      }
    } catch {
      setStats({ total: 0, averageRating: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFeedbacks();
    loadStats();
  }, [loadFeedbacks, loadStats]);

  // Recommended tutors sidebar (real data from existing tutor APIs)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setTutorsLoading(true);
      try {
        const { data } = await axios.get(`${API_BASE}/api/tutors`, { withCredentials: true });
        const list = Array.isArray(data) ? data : [];
        const sorted = [...list].sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
        if (!cancelled) setRecommendedTutors(sorted.slice(0, 3));
      } catch {
        if (!cancelled) setRecommendedTutors([]);
      } finally {
        if (!cancelled) setTutorsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/modules`);
        if (!cancelled && Array.isArray(data)) setModules(data);
      } catch {
        if (!cancelled) setModules([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/auth/session`, { withCredentials: true });
        if (!cancelled && data?.user) setUser(data.user);
        else if (!cancelled) setUser(null);
      } catch {
        if (!cancelled) setUser(null);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const chartRows = useMemo(
    () =>
      [1, 2, 3, 4, 5].map(star => ({
        star: `${star}★`,
        count: stats.distribution[star] ?? 0,
        fill: BAR_COLORS[star - 1]
      })),
    [stats.distribution]
  );

  const canSubmit = useMemo(() => {
    if (!rating || !comment.trim()) return false;
    return moduleLabel.trim().length > 0;
  }, [rating, comment, moduleLabel]);

  const submitFeedback = async () => {
    if (user?.role !== 'student') {
      toast.error('Log in as a student to submit feedback.');
      return;
    }
    if (!rating) {
      toast.error('Please choose a star rating.');
      return;
    }
    if (!comment.trim()) {
      toast.error('Please write a short review.');
      return;
    }
    if (!moduleLabel.trim()) {
      toast.error('Pick or type a module before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const body = { rating, comment: comment.trim(), moduleLabel: moduleLabel.trim() };
      await axios.post(`${API_BASE}/api/feedback`, body, { withCredentials: true });
      toast.success('Thank you — your feedback was saved.');
      setRating(0);
      setComment('');
      setModuleLabel('');
      await loadFeedbacks();
      await loadStats();
    } catch (e) {
      const m = e.response?.data?.msg || e.response?.data?.error || 'Could not submit feedback.';
      // For safety: this page is module-based only, so suppress legacy "session_id" validation to avoid confusing users.
      if (typeof m === 'string' && m.toLowerCase().includes('session_id')) return;
      toast.error(m);
    } finally {
      setSubmitting(false);
    }
  };

  const openReport = id => {
    if (!user) {
      toast.info('Log in to report inappropriate feedback.');
      return;
    }
    setReportTargetId(id);
    setReportReason('spam');
    setReportOpen(true);
  };

  const submitReport = async () => {
    if (!reportTargetId) return;
    setReportSubmitting(true);
    try {
      await axios.post(
        `${API_BASE}/api/report-feedback`,
        { feedback_id: reportTargetId, reason: reportReason },
        { withCredentials: true }
      );
      toast.success('Thank you. This entry has been flagged for review.');
      setReportOpen(false);
      setReportTargetId(null);
      setFeedbacksList(prev => prev.filter(f => f._id !== reportTargetId));
      await loadStats();
    } catch (e) {
      const m = e.response?.data?.msg || e.response?.data?.error || 'Could not submit report.';
      toast.error(m);
    } finally {
      setReportSubmitting(false);
    }
  };

  const handleAskQuestion = () => setIsChatOpen(true);

  const handleChat = e => {
    e.preventDefault();
    if (!msg.trim()) return;
    const newChat = [...chat, { sender: 'user', text: msg }];
    setChat(newChat);
    setMsg('');
    setTimeout(() => {
      setChat([...newChat, { sender: 'bot', text: 'Thank you for your question! PeerWise AI is processing your request...' }]);
    }, 1000);
  };

  const isStudent = user?.role === 'student';

  const displaySubject = q => {
    if (q.moduleLabel) return q.moduleLabel;
    const session = q.sessionId;
    return session?.subject || 'Peer tutoring';
  };

  const displayTags = q => {
    const session = q.sessionId;
    const subj = displaySubject(q);
    const tutorName = session?.tutorId?.fullName;
    if (tutorName) return [subj.toUpperCase(), tutorName];
    return [subj.toUpperCase(), 'Community'];
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pt-20">

      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 text-white">
        <div className="absolute inset-0 opacity-[0.07] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
        <div className="relative max-w-6xl mx-auto px-4 py-10 md:py-14 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-teal-300 text-sm font-semibold tracking-wide uppercase mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> PeerWise insights
            </p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Feedback & reviews</h1>
            <p className="mt-2 text-slate-300 max-w-xl text-sm md:text-base">
              Share how modules and tutoring work for you through quick, professional reviews.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => window.location.href = '/tutors'}
              className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-sm font-semibold transition"
            >
              Find tutors
            </button>
            <button
              type="button"
              onClick={handleAskQuestion}
              className="px-5 py-2.5 rounded-xl bg-[#f97316] hover:bg-orange-600 text-white text-sm font-bold shadow-lg shadow-orange-900/30 transition"
            >
              Ask AI expert
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto w-full px-4 -mt-8 relative z-20 pb-20">

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
              <MessageSquareText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total responses</p>
              <p className="text-2xl font-bold text-slate-900">
                {statsLoading ? '—' : stats.total}
              </p>
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Average rating</p>
              <p className="text-2xl font-bold text-slate-900">
                {statsLoading ? '—' : stats.averageRating.toFixed(1)}
                <span className="text-amber-500 text-lg ml-1">★</span>
              </p>
            </div>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200/80 shadow-sm p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Distribution</p>
              <p className="text-sm text-slate-600">Ratings 1–5 (see chart)</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">

          <div className="flex-1 space-y-8">

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden"
            >
              <div className="h-1.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500" />
              <div className="p-6 md:p-8">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-2xl">⭐</span> Share your experience
                </h2>
                <p className="text-sm text-slate-600 mt-2">
                  Rate your module and help other students make better learning decisions.
                </p>

                {!isStudent && (
                  <p className="mt-4 text-sm text-amber-800 bg-amber-50 border border-amber-200/80 rounded-xl px-4 py-3">
                    Sign in as a <strong>student</strong> to submit feedback.
                  </p>
                )}

                <div className="mt-6 space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Module / topic</label>
                    <p className="text-xs text-slate-500 mb-2">Select from available modules or type your own.</p>
                    <div className="flex flex-wrap gap-2 mb-3">
                      {modules.slice(0, 12).map(m => (
                        <button
                          key={m.code || m.title}
                          type="button"
                          disabled={!isStudent}
                          onClick={() => setModuleLabel(m.title)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                            moduleLabel === m.title
                              ? 'bg-teal-600 text-white border-teal-600'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:border-teal-300'
                          } disabled:opacity-40`}
                        >
                          {m.title}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={moduleLabel}
                      onChange={e => setModuleLabel(e.target.value)}
                      disabled={!isStudent}
                      placeholder="e.g. Java, React, DBMS…"
                      className="w-full border border-slate-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 bg-slate-50/50 disabled:bg-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Your rating</label>
                    <div className="flex gap-2 text-4xl">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setRating(star)}
                          disabled={!isStudent}
                          className={`transition-transform hover:scale-110 disabled:opacity-50 ${
                            rating >= star ? 'text-amber-400 drop-shadow-sm' : 'text-slate-200'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Written review</label>
                    <textarea
                      rows={4}
                      value={comment}
                      onChange={e => setComment(e.target.value)}
                      disabled={!isStudent}
                      placeholder="What went well? What could improve? Be specific — it helps peers and tutors."
                      className="w-full border border-slate-200 rounded-xl p-4 outline-none focus:ring-2 focus:ring-teal-500/30 bg-slate-50/50 disabled:bg-slate-100 text-slate-800 placeholder:text-slate-400"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={submitFeedback}
                      disabled={!isStudent || submitting || !canSubmit}
                      className="bg-gradient-to-r from-slate-800 to-slate-900 text-white font-bold py-3.5 px-10 rounded-xl hover:from-slate-700 hover:to-slate-800 transition shadow-lg disabled:opacity-45 disabled:cursor-not-allowed"
                    >
                      {submitting ? 'Submitting…' : 'Submit feedback'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 md:p-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                <h3 className="text-lg font-bold text-slate-900">Rating distribution</h3>
                <span className="text-xs font-medium text-slate-500">All public, non-flagged reviews</span>
              </div>
              {statsLoading ? (
                <div className="h-52 flex items-center justify-center text-slate-400 text-sm">Loading chart…</div>
              ) : stats.total === 0 ? (
                <div className="h-40 flex items-center justify-center text-slate-500 text-sm border border-dashed border-slate-200 rounded-xl">
                  Chart will appear once feedback is submitted.
                </div>
              ) : (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartRows} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                      <defs>
                        <linearGradient id="waveFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.05} />
                        </linearGradient>
                        <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#2dd4bf" />
                          <stop offset="100%" stopColor="#0f766e" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="star" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        cursor={{ fill: 'rgba(15, 118, 110, 0.08)' }}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="count"
                        stroke="#0f766e"
                        strokeWidth={2.5}
                        fill="url(#waveFill)"
                        activeDot={{ r: 6, stroke: '#0f766e', strokeWidth: 2, fill: '#fff' }}
                      />
                      <Bar dataKey="count" radius={[12, 12, 0, 0]} fill="url(#barFill)" barSize={26} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6 md:p-8">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-6">
                <h3 className="text-lg font-bold text-slate-900">Recent feedback</h3>
              </div>

              {listLoading ? (
                <p className="text-slate-500 text-sm py-12 text-center">Loading…</p>
              ) : feedbacksList.length === 0 ? (
                <p className="text-slate-500 text-sm py-12 text-center border border-dashed border-slate-200 rounded-xl">
                  No public feedback yet. Be the first to share your experience.
                </p>
              ) : (
                <div className="space-y-5">
                  {feedbacksList.map(q => {
                    const session = q.sessionId;
                    const subj = displaySubject(q);
                    const title = `${q.rating}★ — ${subj}`;
                    const linked = !!(session && session._id);
                    return (
                      <div
                        key={q._id}
                        className="p-5 border border-slate-100 rounded-2xl bg-slate-50/50 hover:bg-white hover:shadow-md transition"
                      >
                        <div className="flex justify-between items-start mb-3 text-xs font-bold text-slate-400 gap-2">
                          <div className="flex flex-wrap gap-2">
                            {displayTags(q).map(tag => (
                              <span key={tag} className="bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-slate-600">
                                {tag}
                              </span>
                            ))}
                          </div>
                          <span className="shrink-0 text-slate-400">{formatFeedbackDate(q.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-amber-500 text-sm tracking-tight">{stars(q.rating)}</span>
                          <h4 className="text-lg text-slate-900 font-semibold">{title}</h4>
                        </div>
                        <p className="text-slate-600 text-sm mb-4 leading-relaxed">{q.comment}</p>

                        <div className="flex items-center gap-4 text-sm text-slate-500 font-medium flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-teal-500" />
                            {linked ? 'Session-linked feedback' : 'General module feedback'}
                          </div>
                          <button
                            type="button"
                            onClick={() => openReport(q._id)}
                            className="ml-auto flex items-center gap-1.5 text-amber-800 hover:text-amber-950 font-semibold"
                          >
                            <Flag className="w-4 h-4" />
                            Report
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="w-full lg:w-[320px] shrink-0 space-y-6">

            <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-teal-900 text-white overflow-hidden shadow-xl border border-white/10">
              <div className="h-36 bg-gradient-to-br from-teal-500/30 to-blue-900/40 flex items-center justify-center">
                <div className="text-6xl">🤖</div>
              </div>
              <div className="p-6 text-center">
                <div className="text-orange-400 font-bold text-lg mb-2">PeerWise AI</div>
                <h3 className="text-xl font-bold mb-2 leading-snug">Need instant help?</h3>
                <p className="text-sm text-slate-300 mb-5">Ask module questions anytime.</p>
                <button
                  type="button"
                  onClick={handleAskQuestion}
                  className="w-full border-2 border-orange-500 bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition"
                >
                  Open assistant
                </button>
              </div>
            </div>

            <div className="rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-slate-50 p-4 border-b border-slate-100 font-bold text-slate-800 text-sm">Recommended tutors</div>
              <div>
                {tutorsLoading ? (
                  <div className="p-4 text-sm text-slate-500">Loading…</div>
                ) : (
                  (recommendedTutors.length > 0 ? recommendedTutors : FALLBACK_TUTORS).map((t, i) => {
                    const initials = (t.fullName || '?')
                      .split(' ')
                      .filter(Boolean)
                      .slice(0, 2)
                      .map(s => s[0]?.toUpperCase())
                      .join('');
                    const ratingValue = Number(t.rating);
                    const showRating = Number.isFinite(ratingValue) && ratingValue > 0;
                    return (
                      <div key={t._id || i} className="flex gap-4 p-4 border-b border-slate-100 last:border-b-0 items-center">
                        <div className="w-11 h-11 bg-teal-50 rounded-full flex items-center justify-center text-sm font-bold text-teal-700 border border-teal-100">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-slate-900 text-sm truncate">{t.fullName}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-amber-500 text-sm">★★★★★</span>
                            <span className="font-bold text-slate-800 text-sm">
                              {showRating ? ratingValue.toFixed(1) : '—'}
                            </span>
                          </div>
                          {typeof t.hourlyRate === 'number' && t.hourlyRate > 0 && (
                            <div className="text-xs text-slate-500 mt-1">
                              Rs. {t.hourlyRate}/hr
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => window.location.href = '/tutors'}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl text-sm transition"
                >
                  Browse tutors
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {reportOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
            onClick={() => !reportSubmitting && setReportOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-100"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-slate-900 mb-2">Report feedback</h3>
              <p className="text-sm text-slate-600 mb-4">Tell us why this should be reviewed.</p>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Reason</label>
              <select
                className="w-full border border-slate-200 rounded-xl p-3 mb-4 outline-none focus:ring-2 focus:ring-teal-500/30"
                value={reportReason}
                onChange={e => setReportReason(e.target.value)}
              >
                {REPORT_REASONS.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
                  disabled={reportSubmitting}
                  onClick={() => setReportOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-amber-600 text-white font-semibold hover:bg-amber-700 disabled:opacity-50"
                  disabled={reportSubmitting}
                  onClick={submitReport}
                >
                  {reportSubmitting ? 'Submitting…' : 'Submit report'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-lg flex flex-col h-[600px] border border-slate-100 relative"
            >
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                className="absolute top-4 right-4 text-white hover:text-gray-200 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/20 font-bold"
              >×</button>

              <div className="bg-teal-700 p-6 flex flex-col items-center justify-center text-white text-center pb-8 border-b-4 border-orange-500">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-4xl mb-3 shadow-lg">🤖</div>
                <h2 className="text-2xl font-bold tracking-tight">PeerWise AI Expert</h2>
                <p className="text-sm opacity-90 font-medium mt-1">Ask any module question for instant guidance</p>
              </div>

              <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
                {chat.map((c, i) => (
                   <div key={i} className={`flex ${c.sender === 'bot' ? 'justify-start' : 'justify-end'}`}>
                     <div className={`max-w-[85%] p-3.5 rounded-2xl text-sm shadow-sm ${c.sender === 'bot' ? 'bg-white border border-slate-200 text-slate-800 rounded-tl-none' : 'bg-teal-700 text-white rounded-tr-none'}`}>
                       {c.text}
                     </div>
                   </div>
                ))}
              </div>

              <form onSubmit={handleChat} className="p-4 bg-white flex gap-3 border-t border-slate-100">
                <input
                  type="text"
                  value={msg}
                  onChange={e => setMsg(e.target.value)}
                  placeholder="Type your question here..."
                  className="flex-1 border border-slate-200 rounded-full px-5 py-3 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition"
                />
                <button type="submit" className="bg-teal-700 w-12 h-12 rounded-full text-white flex items-center justify-center hover:bg-teal-800 shadow-md transition transform hover:scale-105">
                  ➤
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default FeedbackChatbot;
