import { Link } from 'react-router-dom';
import { PEERWISE_LOGO_URL } from '../constants/brand';

/**
 * Professional split auth shell (similar to global EdTech / SaaS sign-in patterns).
 */
function AuthLayout({ children, eyebrow = 'PeerWise', panelTitle, panelSubtitle, contentClassName = '' }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 antialiased">
      <aside
        className="relative lg:w-[42%] xl:w-[40%] min-h-[220px] lg:min-h-screen flex flex-col justify-between px-8 py-10 sm:px-10 lg:px-14 lg:py-16 bg-gradient-to-br from-peerwise-midnight via-peerwise-navy to-peerwise-midnight text-white overflow-hidden"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative z-10 max-w-lg">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 rounded-lg hover:opacity-95 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-peerwise-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-peerwise-midnight"
          >
            <img
              src={PEERWISE_LOGO_URL}
              alt={eyebrow}
              className="h-9 sm:h-10 w-auto max-w-[200px] object-contain drop-shadow-[0_0_12px_rgba(255,255,255,0.35)]"
            />
          </Link>

          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-market-lime/90">
            Global peer tutoring
          </p>

          <h1 className="mt-8 text-3xl sm:text-4xl xl:text-[2.5rem] font-extrabold leading-[1.15] tracking-tight">
            {panelTitle}
          </h1>
          <p className="mt-5 text-sm sm:text-base text-white/78 leading-relaxed max-w-md">
            {panelSubtitle}
          </p>

          <ul className="mt-10 space-y-3 text-sm text-white/85 max-w-sm">
            {[
              'Secure sessions & encrypted sign-in',
              'Trusted by students and tutors worldwide',
              'Book lessons and track progress in one place',
            ].map(line => (
              <li key={line} className="flex gap-3 items-start">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-market-orange shrink-0" aria-hidden />
                {line}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-[11px] text-white/35 mt-10 lg:mt-0">
          © {new Date().getFullYear()} PeerWise. All rights reserved.
        </p>
      </aside>

      <main className="flex-1 flex flex-col justify-center px-4 py-10 sm:px-8 lg:px-12 xl:px-16">
        <div className={`w-full max-w-md mx-auto lg:max-w-lg ${contentClassName}`.trim()}>{children}</div>
      </main>
    </div>
  );
}

export default AuthLayout;
