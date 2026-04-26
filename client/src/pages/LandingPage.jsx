import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/wyzant.css';
import { PEERWISE_LOGO_URL } from '../constants/brand';

const TRENDING = [
  'IT1010', 'IT1020', 'IT2010', 'IT3010',
  'IT3040', 'IT3050', 'IT4010', 'IT4020',
];

const HERO_IMAGES = {
  leftLarge: 'https://images.unsplash.com/photo-1503676260728-1c56d1e8e8f0?auto=format&fit=crop&w=400&q=80',
  leftSmall: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=280&q=80',
  rightLarge: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80',
  rightSmall: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&w=280&q=80',
};

function DiamondFrame({ src, alt, className = '', size = 'md' }) {
  const sz = size === 'lg' ? 'w-44 h-44 sm:w-52 sm:h-52' : 'w-28 h-28 sm:w-36 sm:h-36';
  return (
    <div
      className={`${sz} ${className} shrink-0 mx-auto shadow-lg`}
      style={{ transform: 'rotate(45deg)', borderRadius: '4px', overflow: 'hidden' }}
    >
      <div className="w-full h-full" style={{ transform: 'rotate(-45deg) scale(1.42)' }}>
        <img src={src} alt={alt} className="w-full h-full object-cover" loading="lazy" />
      </div>
    </div>
  );
}

function MarketLogo() {
  return (
    <img
      src={PEERWISE_LOGO_URL}
      alt="PeerWise"
      className="h-9 sm:h-10 w-auto max-w-[200px] object-contain drop-shadow-[0_0_10px_rgba(255,255,255,0.25)]"
    />
  );
}

function LandingPage() {
  const navigate = useNavigate();
  const [highlightSubject, setHighlightSubject] = useState('IT1010');
  const [heroSearch, setHeroSearch] = useState('');

  const handleHeroSearch = e => {
    e.preventDefault();
    const q = heroSearch.trim();
    const params = new URLSearchParams();
    if (q) params.set('search', q);
    navigate(`/tutors${params.toString() ? `?${params}` : ''}`);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-market-cream text-market-ink">
      <header className="sticky top-0 z-50 bg-market-nav shadow-md">
        <div className="max-w-7xl mx-auto min-h-[56px] px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 py-2">
          <button type="button" onClick={() => navigate('/home')} className="flex items-center gap-2 min-w-0">
            <MarketLogo />
          </button>

          <nav className="hidden lg:flex items-center gap-6 text-[13px] font-semibold text-white/95 uppercase tracking-wide">
            <button type="button" onClick={() => navigate('/home')} className="hover:text-market-lime transition-colors">
              Dashboard
            </button>
            <button type="button" onClick={() => navigate('/tutors')} className="hover:text-market-lime transition-colors">
              Find a tutor
            </button>
            <button type="button" onClick={() => navigate('/register')} className="hover:text-market-lime transition-colors">
              Become a tutor
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-white/90 text-sm font-semibold px-3 py-1.5 rounded hover:bg-white/10 transition-colors"
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="text-market-orange text-sm font-bold uppercase tracking-wide px-3 py-1.5 rounded hover:text-market-lime transition-colors"
            >
              Sign up
            </button>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-black/5 bg-market-cream flex-1">
        <div className="absolute inset-0 bg-gradient-to-b from-[#ebe8e3] to-market-cream pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-10 pb-14 lg:pt-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-4 items-center">
            <div className="hidden lg:flex lg:col-span-3 flex-col items-center gap-6 pl-2">
              <DiamondFrame src={HERO_IMAGES.leftLarge} alt="Tutor" size="lg" className="ring-4 ring-white/80" />
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-market-orange opacity-90" style={{ transform: 'rotate(45deg)', borderRadius: 2 }} />
                <DiamondFrame src={HERO_IMAGES.leftSmall} alt="Tutor session" size="md" className="ring-2 ring-white/80" />
              </div>
              <div className="w-8 h-8 bg-market-lime opacity-90" style={{ transform: 'rotate(45deg)', borderRadius: 2 }} />
            </div>

            <div className="lg:col-span-6 text-center px-2">
              <h1 className="text-3xl sm:text-4xl lg:text-[2.65rem] font-bold text-market-ink leading-tight tracking-tight">
                Trust the nation&apos;s largest network for{' '}
                <span className="relative inline-block px-1">
                  <span className="relative z-10 px-2 py-0.5 bg-market-lime/90 text-market-ink rounded-sm text-2xl sm:text-3xl lg:text-4xl">
                    {highlightSubject}
                  </span>
                </span>{' '}
                tutors
              </h1>

              <div className="flex flex-wrap justify-center gap-2 mt-3 mb-2">
                {['IT1010', 'IT1020', 'IT3010', 'IT3040', 'IT2010'].map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setHighlightSubject(s)}
                    className={`text-xs font-semibold px-2 py-1 rounded-full border border-gray-300/80 bg-white/80 text-gray-700 hover:border-market-orange transition-colors ${
                      highlightSubject === s ? 'border-market-orange text-market-orange' : ''
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <form onSubmit={handleHeroSearch} className="mt-8 max-w-2xl mx-auto">
                <div className="flex rounded-lg shadow-lg overflow-hidden bg-white border border-gray-200/80">
                  <input
                    value={heroSearch}
                    onChange={e => setHeroSearch(e.target.value)}
                    placeholder="What would you like to learn?"
                    className="flex-1 min-w-0 px-5 py-4 text-base text-gray-800 placeholder-gray-400 outline-none"
                    aria-label="Search subjects"
                  />
                  <button
                    type="submit"
                    className="shrink-0 w-16 sm:w-[4.5rem] bg-market-orange hover:bg-market-orange-hover flex items-center justify-center transition-colors"
                  >
                    <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                </div> 
              </form>

              <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm">
                <span className="text-gray-500 font-medium">Trending:</span>
                {TRENDING.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => { setHeroSearch(tag); setHighlightSubject(tag); }}
                    className="px-3 py-1 rounded-full bg-gray-200/80 text-gray-700 hover:bg-market-orange/20 hover:text-market-ink transition-colors"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="hidden lg:flex lg:col-span-3 flex-col items-center gap-5 pr-2">
              <div className="w-9 h-9 bg-market-orange opacity-90" style={{ transform: 'rotate(45deg)', borderRadius: 2 }} />
              <DiamondFrame src={HERO_IMAGES.rightLarge} alt="Student learning" size="lg" className="ring-4 ring-white/80" />
              <div className="flex gap-4 items-end">
                <div className="w-8 h-8 bg-market-forest opacity-90" style={{ transform: 'rotate(45deg)', borderRadius: 2 }} />
                <DiamondFrame src={HERO_IMAGES.rightSmall} alt="Study" size="md" className="ring-2 ring-white/80" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-14 pt-10 border-t border-gray-300/40">
            {[
              {
                color: 'bg-market-lime',
                body: <>More than <strong className="text-market-ink">4 million 5-star reviews</strong></>,
              },
              {
                color: 'bg-market-orange',
                body: <><strong className="text-market-ink">65,000 expert tutors</strong> in 300+ subjects</>,
              },
              {
                color: 'bg-market-forest',
                body: <>Find a great match with our <strong className="text-white">Good Fit Guarantee</strong></>,
              },
            ].map((row, i) => (
              <div key={i} className="flex gap-4 items-start text-left sm:text-center md:text-left">
                <div className={`w-12 h-12 shrink-0 ${row.color} shadow-md`} style={{ transform: 'rotate(45deg)', borderRadius: 3 }} />
                <p className="text-sm sm:text-base text-gray-700 leading-snug pt-1">{row.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- UNIVERSITIES --- */}
      <section className="bg-white py-12 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-500 text-lg mb-8 font-serif">Tutors from top universities</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-80 grayscale hover:grayscale-0 transition-all duration-300">
            <span className="text-3xl font-bold text-red-700 tracking-tighter">MIT</span>
            <span className="text-xl font-serif text-red-900 tracking-widest uppercase">Harvard</span>
            <span className="text-lg font-serif text-blue-800 uppercase tracking-widest text-center leading-none">Columbia<br/><span className="text-[10px] tracking-normal">University</span></span>
            <span className="text-2xl font-serif text-blue-500">Juilliard</span>
            <span className="text-2xl font-bold text-orange-600">Caltech</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-5 bg-orange-500/80 skew-x-12" />
              <span className="text-lg font-serif text-black uppercase tracking-wider">Princeton</span>
            </div>
          </div>
        </div>
      </section>

      {/* --- HOW IT WORKS 3 STEPS --- */}
      <section className="bg-white py-20 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-market-ink mb-16">Finding the perfect tutor is easy</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-100 flex flex-col items-center text-center hover:-translate-y-1 transition-transform cursor-default">
              <span className="text-[#3b8c5e] font-bold text-[13px] uppercase tracking-wider mb-2">Step 1</span>
              <h3 className="text-lg tracking-wide text-gray-800 mb-8 select-none">CHOOSE YOUR TUTOR</h3>
              <div className="w-full relative h-40 bg-[#fbf9f6] rounded-xl overflow-hidden flex items-center justify-center p-4">
                <div className="w-full space-y-3">
                  <div className="h-12 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center px-4 gap-3">
                    <div className="w-6 h-6 rounded-full bg-[#52b77a]" />
                    <div className="space-y-1 flex-1">
                      <div className="h-1.5 w-full bg-market-orange rounded-full" />
                      <div className="h-1.5 w-1/2 bg-market-orange rounded-full" />
                    </div>
                    <div className="flex gap-0.5"><span className="text-yellow-400 text-xs">★★★★</span></div>
                  </div>
                  <div className="h-12 bg-white rounded-lg shadow-sm border border-gray-100 flex items-center px-4 gap-3 opacity-60">
                    <div className="w-6 h-6 rounded-full bg-gray-300" />
                    <div className="space-y-1 flex-1">
                      <div className="h-1.5 w-3/4 bg-gray-300 rounded-full" />
                      <div className="h-1.5 w-1/3 bg-gray-300 rounded-full" />
                    </div>
                    <div className="flex gap-0.5"><span className="text-yellow-400 text-xs">★★★</span></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-100 flex flex-col items-center text-center hover:-translate-y-1 transition-transform cursor-default">
              <span className="text-[#3b8c5e] font-bold text-[13px] uppercase tracking-wider mb-2">Step 2</span>
              <h3 className="text-lg tracking-wide text-gray-800 mb-8 select-none">SHARE YOUR GOALS</h3>
              <div className="w-full relative h-40 bg-[#fbf9f6] rounded-xl overflow-hidden flex flex-col justify-center p-4 gap-3">
                {/* Background generic rhombuses */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03]">
                   <div className="w-32 h-32 bg-market-orange rotate-45 transform" />
                </div>
                 <div className="relative z-10 bg-white p-3 px-4 rounded-xl rounded-br-sm shadow-sm w-[85%] border border-gray-100 flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-50 flex-shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="w-full h-1.5 rounded-full bg-gray-200" />
                      <div className="w-1/2 h-1.5 rounded-full bg-gray-200" />
                    </div>
                 </div>
                 <div className="relative z-10 bg-white p-3 px-4 rounded-xl rounded-bl-sm shadow-sm w-[85%] ml-auto border border-gray-100 flex flex-row-reverse items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-gray-100 flex-shrink-0" />
                    <div className="space-y-2 flex-1 mt-1">
                      <div className="w-full h-1.5 rounded-full bg-[#a1c4b6]" />
                      <div className="w-3/4 ml-auto h-1.5 rounded-full bg-[#a1c4b6]" />
                    </div>
                 </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-gray-100 flex flex-col items-center text-center hover:-translate-y-1 transition-transform cursor-default">
              <span className="text-[#3b8c5e] font-bold text-[13px] uppercase tracking-wider mb-2">Step 3</span>
              <h3 className="text-lg tracking-wide text-gray-800 mb-8 select-none">BOOK YOUR LESSON</h3>
              <div className="w-full relative h-40 bg-[#fbf9f6] rounded-xl overflow-hidden flex items-center justify-center p-4">
                {/* Background graphic */}
                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03]">
                   <div className="w-32 h-32 bg-[#3b8c5e] rotate-45 transform" />
                </div>
                <div className="w-full h-full bg-white border-2 border-[#e6e9ec] rounded-lg shadow-sm relative overflow-hidden z-10">
                  <div className="h-4 bg-[#759c88] w-full flex items-center px-2 gap-1 justify-end">
                    <div className="w-3 h-3 rounded-full bg-white/20" />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 top-4 flex p-2 pt-3">
                    {/* Graph drawing imitation */}
                    <div className="flex-1 border-b-2 border-l-2 border-gray-300 relative">
                       <svg className="w-full h-full text-gray-400 absolute inset-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                         <path d="M10,10 Q50,120 90,10" fill="none" stroke="currentColor" strokeWidth="3" />
                       </svg>
                       <span className="absolute top-2 left-2 text-[#f5a623] text-lg font-bold font-serif leading-none">Y</span>
                       <span className="absolute bottom-1 right-2 text-[#f5a623] text-lg font-bold font-serif leading-none">X</span>
                    </div>
                    {/* Sidebar profile imitation */}
                    <div className="w-8 ml-2 flex flex-col gap-1 items-center bg-gray-50 p-1 border border-gray-100">
                      <div className="w-5 h-5 bg-gray-200 rounded-full" />
                      <div className="w-full h-1 bg-gray-200 rounded" />
                      <div className="w-full h-1 bg-gray-200 rounded" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- GUARANTEE BANNER --- */}
      <section className="bg-market-cream py-24 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-3xl font-normal text-gray-800 mb-4 tracking-tight">The right fit, or it's free.</h2>
          <p className="text-gray-600 text-lg mb-8 max-w-2xl mx-auto">We're so confident that you'll find a great match, we guarantee your first hour with any new tutor.</p>
          <button type="button" onClick={() => navigate('/register')} className="bg-[#e47e33] hover:bg-market-orange-hover text-white font-semibold py-3.5 px-8 rounded shadow-sm transition-colors text-sm">
            Sign up now
          </button>
        </div>
      </section>

      {/* --- TESTIMONIALS (YOUR NEXT GREAT TUTOR) --- */}
      <section className="bg-market-cream py-20 pb-32 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-[#3d3b38] mb-4">Your next great tutor</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">Enjoy one-on-one instruction from the nation's biggest network of independent experts.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden relative pb-20">
               <div className="h-3 w-full bg-[#decce0]" />
               <div className="p-8 pb-0">
                  <h3 className="text-lg font-bold text-[#7d4177] mb-3 leading-tight font-serif italic tracking-wide">“The Top 1% of All Tutors I've Had”</h3>
                  <p className="text-gray-600/95 leading-relaxed text-[15px]">
                    I've had some amazing tutors, and Ethan is at the top. He has lots of time for you, even outside of tutoring time, and he explains to you the coding concepts as y'all work through it. He's worth every cent.
                  </p>
               </div>
               <div className="absolute bottom-0 left-0 w-full p-6 pb-5 flex items-center gap-4 border-t border-gray-50">
                  <img src={HERO_IMAGES.leftLarge} alt="Student" className="w-[52px] h-[52px] rounded-full object-cover border border-gray-100" />
                  <div>
                    <div className="text-[13px] text-gray-500">Mark, 6 lessons with Ethan</div>
                    <div className="text-[13px] font-bold text-[#7d4177]">SAT Prep Tutor</div>
                  </div>
               </div>
            </div>

            <div className="bg-white rounded-xl shadow-[0_2px_15px_rgba(0,0,0,0.04)] border border-gray-100 overflow-hidden relative pb-20">
               <div className="h-3 w-full bg-[#c0daef]" />
               <div className="p-8 pb-0">
                  <h3 className="text-lg font-bold text-[#316c9e] mb-3 leading-tight font-serif italic tracking-wide uppercase">“AMAZING TUTOR”</h3>
                  <p className="text-gray-600/95 leading-relaxed text-[15px]">
                    Tiffany has exceeded our expectations. She is knowledgeable, patient, and fun. All the lessons are thoughtfully prepared. Our 5 year old son enjoys every lesson with her and he is actually engaged for the whole hour. I'm highly impressed. She is the best!
                  </p>
               </div>
               <div className="absolute bottom-0 left-0 w-full p-6 pb-5 flex items-center gap-4 border-t border-gray-50">
                  <img src={HERO_IMAGES.leftSmall} alt="Instructor" className="w-[52px] h-[52px] rounded-full object-cover border border-gray-100" />
                  <div>
                    <div className="text-[13px] text-gray-500">Joanna, 16 lessons with Tiffany</div>
                    <div className="text-[13px] font-bold text-[#316c9e]">Elementary Reading Tutor</div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-300/60 bg-market-nav py-6 text-center text-sm text-white/70">
        <p>© {new Date().getFullYear()} PeerWise · Good Fit Guarantee · Learn together</p>
      </footer>
    </div>
  );
}

export default LandingPage;
