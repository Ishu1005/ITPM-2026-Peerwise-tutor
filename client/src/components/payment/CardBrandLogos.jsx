/**
 * Stylized card network marks (educational / UI only — not official trademark artwork).
 */
function CardBrandLogos({ activeBrand = 'unknown' }) {
  const dim = (id) => (activeBrand === 'unknown' || activeBrand === id ? 'opacity-100' : 'opacity-35 grayscale');

  return (
    <div className="flex items-center justify-end gap-2 flex-wrap" aria-hidden>
      <span
        title="Visa"
        className={`inline-flex items-center justify-center h-8 px-2 rounded bg-[#1A1F71] text-white text-[10px] font-black tracking-widest transition ${dim('visa')}`}
      >
        VISA
      </span>
      <span
        title="Mastercard"
        className={`inline-flex h-8 w-11 items-center justify-center rounded overflow-hidden bg-[#EB001B] transition relative ${dim('mastercard')}`}
      >
        <span className="absolute w-5 h-5 rounded-full bg-[#EB001B] left-1.5 border border-white/30" />
        <span className="absolute w-5 h-5 rounded-full bg-[#F79E1B] right-1.5 border border-white/30" />
      </span>
      <span
        title="American Express"
        className={`inline-flex items-center justify-center h-8 px-1.5 rounded bg-[#006FCF] text-white text-[8px] font-bold leading-tight text-center transition ${dim('amex')}`}
      >
        AMEX
      </span>
      <span
        title="Discover"
        className={`inline-flex items-center justify-center h-8 px-2 rounded bg-[#FF6000] text-white text-[9px] font-bold transition ${dim('discover')}`}
      >
        DISC
      </span>
    </div>
  );
}

export default CardBrandLogos;
