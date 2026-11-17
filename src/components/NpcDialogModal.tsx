import React, { useEffect, useState } from 'react';
import { IslandNpcData } from '../types/game';
import { playSelectTone } from '../utils/soundFx';

interface NpcDialogModalProps {
  npc: IslandNpcData | null;
  alreadyTalked: boolean;
  onClose: () => void;
}

export const NpcDialogModal: React.FC<NpcDialogModalProps> = ({
  npc,
  alreadyTalked,
  onClose,
}) => {
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    setLineIndex(0);
  }, [npc?.id]);

  useEffect(() => {
    if (!npc) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      } else if (e.code === 'KeyE' || e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        if (lineIndex < npc.dialogLines.length - 1) {
          playSelectTone();
          setLineIndex((prev) => prev + 1);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [npc, lineIndex, onClose]);

  if (!npc) return null;

  const totalLines = npc.dialogLines.length;
  const isLastLine = lineIndex >= totalLines - 1;
  const currentLine = npc.dialogLines[lineIndex] ?? '';

  const handleAdvance = () => {
    if (!isLastLine) {
      playSelectTone();
      setLineIndex((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center p-4 sm:pb-8"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-[580px] pixelated transition-transform duration-150"
        style={{
          borderStyle: 'solid',
          borderWidth: '16px 18px 20px 18px',
          borderImageSource: "url('/ui/popup/download11.png')",
          borderImageSlice: '40 40 52 40 fill',
          borderImageRepeat: 'stretch',
          boxShadow: '0 14px 36px rgba(0,0,0,0.55)',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          className="pixelated flex flex-col sm:flex-row gap-3.5 items-start"
          style={{
            borderStyle: 'solid',
            borderWidth: '14px 18px 14px 18px',
            borderImageSource: "url('/ui/popup/download15.png')",
            borderImageSlice: '48 56 48 56 fill',
            borderImageRepeat: 'stretch',
          }}
        >
          <div className="w-16 h-16 rounded border-2 border-[#7c563a] bg-[#3f2c22] flex items-center justify-center shrink-0 overflow-hidden">
            <img
              src={npc.portrait}
              alt={npc.name}
              referrerPolicy="no-referrer"
              className="w-14 h-14 object-contain pixelated"
            />
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div className="flex items-baseline gap-2 text-sm text-[#3b2a20]">
                <span className="font-extrabold">{npc.name}</span>
                <span aria-hidden="true" className="text-[#8a7560]">·</span>
                <span className="text-xs font-semibold text-[#6b5646]">{npc.role}</span>
              </div>
              <span className="text-[11px] font-bold tabular-nums text-[#6b5646]">
                {alreadyTalked ? '✓ Sudah dicatat' : 'Warga Pulau'} · {lineIndex + 1}/{totalLines}
              </span>
            </div>

            <p className="text-sm font-medium text-[#3b2a20] leading-relaxed">
              {currentLine}
            </p>

            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="text-[11px] text-[#6b5646]">
                Tekan E / Spasi untuk lanjut
              </span>
              <button
                type="button"
                onClick={handleAdvance}
                className="px-4 py-1.5 rounded border-2 border-[#1b4b41] bg-[#2f7d6d] hover:bg-[#3a9683] text-xs font-bold text-[#fff7df] whitespace-nowrap shrink-0 cursor-pointer transition-colors"
              >
                {isLastLine ? 'Selesai' : 'Lanjut'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
