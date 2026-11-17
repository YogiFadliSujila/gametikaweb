import React, { useEffect, useState } from 'react';
import { CharacterData, RIBBON_INDEX } from '../types/game';

interface CharacterInfoPopupProps {
  character: CharacterData | null;
  anchor: { x: number; y: number } | null;
  onClose: () => void;
}

export const CharacterInfoPopup: React.FC<CharacterInfoPopupProps> = ({
  character,
  anchor,
  onClose,
}) => {
  const [selectedAbilityIndex, setSelectedAbilityIndex] = useState(0);

  useEffect(() => {
    setSelectedAbilityIndex(0);
  }, [character]);

  useEffect(() => {
    if (!character) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [character, onClose]);

  if (!character) return null;

  const ribbonIdx = RIBBON_INDEX[character.ribbon] ?? 0;
  const ability = character.abilities[selectedAbilityIndex] ?? null;

  // Place near anchor (like Godot _place with EDGE_MARGIN & CURSOR_OFFSET), clamped inside viewport
  const popupWidth = 480;
  const popupHeight = 320;
  const margin = 16;
  const ribbonRise = 48;

  let left = window.innerWidth * 0.5 - popupWidth * 0.5;
  let top = window.innerHeight * 0.5 - popupHeight * 0.5;

  if (anchor) {
    left = anchor.x + 16;
    top = anchor.y + 16;
    left = Math.max(margin, Math.min(left, window.innerWidth - popupWidth - margin));
    top = Math.max(
      ribbonRise + margin,
      Math.min(top, window.innerHeight - popupHeight - margin)
    );
  }

  return (
    <div
      className="fixed inset-0 z-50"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Dimmer matching Color(0, 0, 0, 0.45) */}
      <div
        className="absolute inset-0 bg-black/45 transition-opacity duration-150"
        onMouseDown={onClose}
      />

      {/* Popup Frame + Floating Ribbon */}
      <div
        className="absolute transition-opacity duration-150"
        style={{
          left: `${left}px`,
          top: `${top}px`,
          width: `${popupWidth}px`,
          maxWidth: 'calc(100vw - 32px)',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Ribbon Header (download14.png: 259x515 -> 5 slices of 259x103) */}
        <div
          className="relative mx-auto -mb-9 z-20 flex items-center justify-center pointer-events-none pixelated"
          style={{
            width: '259px',
            height: '103px',
            backgroundImage: "url('/ui/popup/download14.png')",
            backgroundPosition: `0px -${ribbonIdx * 103}px`,
            backgroundSize: '259px 515px',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <span
            className="text-lg font-extrabold tracking-wide text-[#fff7df] -mt-2"
            style={{
              textShadow:
                '-2px -2px 0 #00006c, 2px -2px 0 #00006c, -2px 2px 0 #00006c, 2px 2px 0 #00006c, 0 2px 0 #00006c',
            }}
          >
            {character.displayName}
          </span>
        </div>

        {/* Wood Outer Frame (download11.png: 232x252, 9-slice 40 40 52 40) */}
        <div
          className="relative z-10 pixelated"
          style={{
            borderStyle: 'solid',
            borderWidth: '22px 22px 28px 22px',
            borderImageSource: "url('/ui/popup/download11.png')",
            borderImageSlice: '40 40 52 40 fill',
            borderImageRepeat: 'stretch',
            boxShadow: '0 16px 40px rgba(0,0,0,0.55)',
          }}
        >
          <div className="flex flex-col gap-3 pt-7">
            {/* Row: StatsPanel + AbilityPanel */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* StatsPanel (download13.png: dark slate with gold trim) */}
              <div
                className="sm:w-[165px] shrink-0 flex flex-col items-center gap-2 p-2 pixelated"
                style={{
                  borderStyle: 'solid',
                  borderWidth: '14px',
                  borderImageSource: "url('/ui/popup/download13.png')",
                  borderImageSlice: '20 20 20 20 fill',
                  borderImageRepeat: 'stretch',
                }}
              >
                <div className="w-24 h-24 flex items-center justify-center rounded bg-black/20 p-1">
                  <img
                    src={character.portrait}
                    alt={character.displayName}
                    className="w-full h-full object-contain pixelated"
                  />
                </div>
                <div className="w-full grid grid-cols-2 gap-x-2 gap-y-0.5 text-sm font-bold text-[#f1e6c8]">
                  {Object.entries(character.stats).map(([key, val]) => (
                    <React.Fragment key={key}>
                      <span className="text-left text-[#d8c79e]">{key}</span>
                      <span className="text-right tabular-nums">{val}</span>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* AbilityPanel (download15.png: parchment scroll) */}
              <div
                className="flex-1 min-h-[175px] flex flex-col justify-start pixelated"
                style={{
                  borderStyle: 'solid',
                  borderWidth: '22px 24px 22px 24px',
                  borderImageSource: "url('/ui/popup/download15.png')",
                  borderImageSlice: '48 56 48 56 fill',
                  borderImageRepeat: 'stretch',
                }}
              >
                {ability ? (
                  <div className="flex flex-col gap-1">
                    <h3 className="text-[17px] font-extrabold text-[#3b2a20] leading-tight">
                      {ability.displayName}
                    </h3>
                    <div className="text-xs font-semibold text-[#6b5646]">
                      Cooldown {ability.cooldown} &nbsp;|&nbsp; Biaya {ability.cost}
                    </div>
                    <p className="mt-1.5 text-sm leading-snug text-[#3b2a20]">
                      {ability.description}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-[#6b5646]">Tidak ada kemampuan.</p>
                )}
              </div>
            </div>

            {/* Footer: Ability Buttons + Close Button */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <div className="flex items-center gap-2">
                {character.abilities.map((ab, idx) => {
                  const active = idx === selectedAbilityIndex;
                  return (
                    <button
                      key={ab.displayName}
                      type="button"
                      onClick={() => setSelectedAbilityIndex(idx)}
                      title={ab.displayName}
                      className={`w-10 h-10 p-1 rounded border-2 transition-transform cursor-pointer flex items-center justify-center ${
                        active
                          ? 'bg-[#e6c989] border-[#59341e] scale-105 shadow-inner'
                          : 'bg-[#7d5238] border-[#3d2314] hover:bg-[#936243]'
                      }`}
                    >
                      <img
                        src={ab.icon}
                        alt={ab.displayName}
                        className="w-7 h-7 object-contain pixelated"
                      />
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-1.5 min-w-[84px] rounded border-2 border-[#3d2314] bg-[#c84b31] hover:bg-[#d95b40] active:translate-y-0.5 text-sm font-bold text-[#fff7df] shadow cursor-pointer transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
