import React, { useEffect, useState } from 'react';
import { ISLAND_NPCS, PAPER_ITEM_ASSET, WORLD_PAPERS } from '../data/bridge2Quest';
import { playErrorTone, playSuccessChime } from '../utils/soundFx';

interface Bridge2TurnInModalProps {
  isOpen: boolean;
  collectedPaperIds: string[];
  talkedNpcIds: string[];
  onClose: () => void;
  onUnlockBridge2: () => void;
}

export const Bridge2TurnInModal: React.FC<Bridge2TurnInModalProps> = ({
  isOpen,
  collectedPaperIds,
  talkedNpcIds,
  onClose,
  onUnlockBridge2,
}) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIsCompleting(false);
      setErrorMsg(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isCompleting) {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isCompleting, onClose]);

  if (!isOpen) return null;

  const papersCollectedCount = collectedPaperIds.length;
  const npcsTalkedCount = talkedNpcIds.length;
  const allPapersCollected = papersCollectedCount >= WORLD_PAPERS.length;
  const allNpcsTalked = npcsTalkedCount >= ISLAND_NPCS.length;
  const canSubmit = allPapersCollected && allNpcsTalked;

  const handleConfirm = () => {
    if (isCompleting) return;
    if (!canSubmit) {
      playErrorTone();
      const missingParts: string[] = [];
      if (!allPapersCollected) {
        missingParts.push(`${WORLD_PAPERS.length - papersCollectedCount} kertas lagi`);
      }
      if (!allNpcsTalked) {
        missingParts.push(`${ISLAND_NPCS.length - npcsTalkedCount} NPC pulau lagi`);
      }
      setErrorMsg(`Syarat belum lengkap: kamu masih perlu ${missingParts.join(' dan ')}.`);
      return;
    }

    setErrorMsg(null);
    setIsCompleting(true);
    playSuccessChime();
    window.setTimeout(() => {
      onUnlockBridge2();
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !isCompleting) onClose();
      }}
    >
      <div
        className="absolute inset-0 bg-black/55 transition-opacity duration-150"
        onMouseDown={() => {
          if (!isCompleting) onClose();
        }}
      />

      <div
        className="relative w-full max-w-[540px] transition-transform duration-150"
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Ribbon Header */}
        <div
          className="relative mx-auto -mb-9 z-20 flex items-center justify-center pointer-events-none pixelated"
          style={{
            width: '259px',
            height: '103px',
            backgroundImage: "url('/ui/popup/download14.png')",
            backgroundPosition: '0px -206px',
            backgroundSize: '259px 515px',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <span
            className="text-base font-extrabold tracking-wide text-[#fff7df] -mt-2"
            style={{
              textShadow:
                '-2px -2px 0 #3b2a20, 2px -2px 0 #3b2a20, -2px 2px 0 #3b2a20, 2px 2px 0 #3b2a20, 0 2px 0 #3b2a20',
            }}
          >
            Setor Kertas Jembatan 2
          </span>
        </div>

        {/* Wood Frame */}
        <div
          className="relative z-10 pixelated"
          style={{
            borderStyle: 'solid',
            borderWidth: '22px 22px 28px 22px',
            borderImageSource: "url('/ui/popup/download11.png')",
            borderImageSlice: '40 40 52 40 fill',
            borderImageRepeat: 'stretch',
            boxShadow: '0 18px 44px rgba(0,0,0,0.6)',
          }}
        >
          <div className="flex flex-col gap-3 pt-7">
            {/* Parchment Instruction */}
            <div
              className="pixelated"
              style={{
                borderStyle: 'solid',
                borderWidth: '14px 20px 14px 20px',
                borderImageSource: "url('/ui/popup/download15.png')",
                borderImageSlice: '48 56 48 56 fill',
                borderImageRepeat: 'stretch',
              }}
            >
              <p className="text-sm font-bold text-[#3b2a20] leading-snug">
                Konfirmasi Penyetoran Kertas Izin Jembatan Kedua
              </p>
              <p className="mt-1 text-xs font-medium text-[#6b5646]">
                Setorkan 3 lembar kertas yang terkumpul setelah berbincang dengan 3 warga pulau kanan.
              </p>
            </div>

            {/* Dark Slate Turn-in Summary */}
            <div
              className="pixelated flex flex-col gap-3"
              style={{
                borderStyle: 'solid',
                borderWidth: '14px',
                borderImageSource: "url('/ui/popup/download13.png')",
                borderImageSlice: '20 20 20 20 fill',
                borderImageRepeat: 'stretch',
              }}
            >
              {/* 3 Papers */}
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-[#d8c79e] mb-2">
                  <span>Lembar Kertas Terkumpul</span>
                  <span className="tabular-nums text-[#f3cf7a]">
                    {papersCollectedCount}/{WORLD_PAPERS.length}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {WORLD_PAPERS.map((paper) => {
                    const collected = collectedPaperIds.includes(paper.id);
                    return (
                      <div
                        key={paper.id}
                        className={`rounded-md border-2 px-2 py-2.5 flex flex-col items-center text-center gap-1.5 ${
                          collected
                            ? 'bg-[#f3e6c4] border-[#34d399] text-[#3b2a20]'
                            : 'bg-[#2a313b] border-dashed border-[#6b7280] text-[#9ca3af]'
                        }`}
                      >
                        <img
                          src={PAPER_ITEM_ASSET}
                          alt={paper.title}
                          referrerPolicy="no-referrer"
                          className={`w-9 h-11 object-contain pixelated ${
                            collected ? 'opacity-100' : 'opacity-30 grayscale'
                          }`}
                        />
                        <span className="text-[11px] font-bold leading-tight">
                          {paper.title}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold ${
                            collected ? 'text-[#1b5e4f]' : 'text-[#cbd5e1]'
                          }`}
                        >
                          {collected ? '✓ Terkumpul' : '○ Belum ada'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3 NPC Confirmations */}
              <div className="border-t border-[#4b5563] pt-2.5">
                <div className="flex items-center justify-between text-xs font-semibold text-[#d8c79e] mb-2">
                  <span>Kesaksian Warga Pulau</span>
                  <span className="tabular-nums text-[#f3cf7a]">
                    {npcsTalkedCount}/{ISLAND_NPCS.length}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {ISLAND_NPCS.map((npc) => {
                    const talked = talkedNpcIds.includes(npc.id);
                    return (
                      <div
                        key={npc.id}
                        className={`rounded-md border px-2 py-1.5 flex items-center gap-2 ${
                          talked
                            ? 'bg-[#194b40]/85 border-[#34d399] text-[#d4f4e4]'
                            : 'bg-[#2a313b] border-[#4b5563] text-[#cbd5e1]'
                        }`}
                      >
                        <img
                          src={npc.portrait}
                          alt={npc.name}
                          referrerPolicy="no-referrer"
                          className={`w-7 h-7 object-contain pixelated shrink-0 ${
                            talked ? '' : 'opacity-50 grayscale'
                          }`}
                        />
                        <div className="min-w-0 flex flex-col leading-tight">
                          <span className="text-[11px] font-bold truncate">{npc.name}</span>
                          <span className="text-[10px] truncate">
                            {talked ? '✓ Ditemui' : '○ Belum'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Status Feedback */}
            {(errorMsg || isCompleting || canSubmit) && (
              <div
                role="status"
                className={`rounded-md border-2 px-3 py-2 text-xs font-bold flex items-center gap-2 ${
                  isCompleting
                    ? 'bg-[#194b40] border-[#34d399] text-[#d4f4e4]'
                    : errorMsg
                    ? 'bg-[#5d2017] border-[#f87171] text-[#fde2dc]'
                    : 'bg-[#194b40]/90 border-[#34d399] text-[#d4f4e4]'
                }`}
              >
                <span>{errorMsg ? '✕' : '✓'}</span>
                <span>
                  {isCompleting
                    ? 'Kertas disetorkan! Gerbang jembatan kedua terbuka.'
                    : errorMsg
                    ? errorMsg
                    : 'Semua kertas dan interaksi warga lengkap. Siap disetorkan!'}
                </span>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2 pt-0.5">
              <button
                type="button"
                onClick={onClose}
                disabled={isCompleting}
                className="px-4 py-2 rounded border-2 border-[#3d2314] bg-[#5a4234] hover:bg-[#705342] disabled:opacity-50 text-xs font-bold text-[#fff7df] whitespace-nowrap shrink-0 cursor-pointer transition-colors"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isCompleting}
                className={`px-5 py-2 rounded border-2 text-xs font-bold shadow whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                  canSubmit
                    ? 'border-[#1b4b41] bg-[#2f7d6d] hover:bg-[#3a9683] text-[#fff7df]'
                    : 'border-[#4b382a] bg-[#665042] hover:bg-[#765d4d] text-[#e5d8bc]'
                }`}
              >
                Setor Kertas &amp; Buka Jembatan
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
