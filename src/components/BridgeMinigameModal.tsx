import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BridgePuzzle } from '../data/bridgePuzzles';
import {
  playConnectTone,
  playDisconnectTone,
  playErrorTone,
  playSelectTone,
  playSuccessChime,
} from '../utils/soundFx';

interface BridgeMinigameModalProps {
  isOpen: boolean;
  puzzle: BridgePuzzle;
  onClose: () => void;
  onSolved: () => void;
}

interface LineCoords {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  status: 'idle' | 'correct' | 'wrong';
}

type ValidationState = Record<string, 'correct' | 'wrong'>;

export const BridgeMinigameModal: React.FC<BridgeMinigameModalProps> = ({
  isOpen,
  puzzle,
  onClose,
  onSolved,
}) => {
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [selectedCodomain, setSelectedCodomain] = useState<string | null>(null);
  const [draggedValue, setDraggedValue] = useState<string | null>(null);
  const [dragOverDomain, setDragOverDomain] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationState>({});
  const [feedback, setFeedback] = useState<{
    type: 'info' | 'error' | 'success';
    message: string;
  } | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [lines, setLines] = useState<LineCoords[]>([]);

  const arenaRef = useRef<HTMLDivElement | null>(null);
  const domainAnchorRefs = useRef<Record<string, HTMLSpanElement | null>>({});
  const codomainAnchorRefs = useRef<Record<string, HTMLSpanElement | null>>({});

  // Reset modal state whenever opened or puzzle changes
  useEffect(() => {
    if (isOpen) {
      setAssignments({});
      setSelectedDomain(null);
      setSelectedCodomain(null);
      setDraggedValue(null);
      setDragOverDomain(null);
      setValidation({});
      setFeedback(null);
      setIsCompleting(false);
    }
  }, [isOpen, puzzle.id]);

  // Close on Escape
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

  const computeLines = useCallback(() => {
    const arena = arenaRef.current;
    if (!arena) return;
    const arenaRect = arena.getBoundingClientRect();
    const nextLines: LineCoords[] = [];

    for (const [domItem, codItem] of Object.entries(assignments)) {
      const startEl = domainAnchorRefs.current[domItem];
      const endEl = codomainAnchorRefs.current[codItem];
      if (!startEl || !endEl) continue;
      const r1 = startEl.getBoundingClientRect();
      const r2 = endEl.getBoundingClientRect();
      nextLines.push({
        key: `${domItem}->${codItem}`,
        x1: r1.left + r1.width * 0.5 - arenaRect.left,
        y1: r1.top + r1.height * 0.5 - arenaRect.top,
        x2: r2.left + r2.width * 0.5 - arenaRect.left,
        y2: r2.top + r2.height * 0.5 - arenaRect.top,
        status: validation[domItem] ?? 'idle',
      });
    }
    setLines(nextLines);
  }, [assignments, validation]);

  useLayoutEffect(() => {
    if (!isOpen) return;
    computeLines();
    const arena = arenaRef.current;
    if (!arena || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => computeLines());
    ro.observe(arena);
    window.addEventListener('resize', computeLines);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', computeLines);
    };
  }, [isOpen, computeLines]);

  if (!isOpen) return null;

  const findDomainByCodomain = (codVal: string): string | undefined =>
    Object.keys(assignments).find((k) => assignments[k] === codVal);

  const assignPair = (domItem: string, codItem: string) => {
    if (isCompleting) return;
    setAssignments((prev) => {
      const next = { ...prev };
      // Enforce one-to-one mapping: remove previous owner of codItem
      for (const existingDom of Object.keys(next)) {
        if (next[existingDom] === codItem) {
          delete next[existingDom];
        }
      }
      next[domItem] = codItem;
      return next;
    });
    setValidation((prev) => {
      if (!prev[domItem]) return prev;
      const next = { ...prev };
      delete next[domItem];
      return next;
    });
    setFeedback(null);
    setSelectedDomain(null);
    setSelectedCodomain(null);
    playConnectTone();
  };

  const unassignDomain = (domItem: string) => {
    if (isCompleting) return;
    setAssignments((prev) => {
      if (!(domItem in prev)) return prev;
      const next = { ...prev };
      delete next[domItem];
      return next;
    });
    setValidation((prev) => {
      const next = { ...prev };
      delete next[domItem];
      return next;
    });
    setFeedback(null);
    playDisconnectTone();
  };

  const handleDomainClick = (domItem: string) => {
    if (isCompleting) return;
    if (selectedCodomain) {
      assignPair(domItem, selectedCodomain);
      return;
    }
    if (selectedDomain === domItem) {
      setSelectedDomain(null);
      return;
    }
    if (selectedDomain === null && assignments[domItem]) {
      // Clicking an already paired domain node without an active selection unpairs it
      unassignDomain(domItem);
      return;
    }
    setSelectedDomain(domItem);
    playSelectTone();
  };

  const handleCodomainClick = (codItem: string) => {
    if (isCompleting) return;
    if (selectedDomain) {
      assignPair(selectedDomain, codItem);
      return;
    }
    if (selectedCodomain === codItem) {
      setSelectedCodomain(null);
      return;
    }
    const existingOwner = findDomainByCodomain(codItem);
    if (selectedCodomain === null && existingOwner) {
      unassignDomain(existingOwner);
      return;
    }
    setSelectedCodomain(codItem);
    playSelectTone();
  };

  const handleReset = () => {
    if (isCompleting) return;
    setAssignments({});
    setSelectedDomain(null);
    setSelectedCodomain(null);
    setValidation({});
    setFeedback(null);
    playDisconnectTone();
  };

  const handleCheck = () => {
    if (isCompleting) return;
    const totalCount = puzzle.domain.length;
    const assignedCount = Object.keys(assignments).length;

    if (assignedCount < totalCount) {
      playErrorTone();
      setFeedback({
        type: 'info',
        message: `Hubungkan semua huruf terlebih dahulu (${assignedCount}/${totalCount} terpasang).`,
      });
      return;
    }

    const nextValidation: ValidationState = {};
    let wrongCount = 0;
    for (const domItem of puzzle.domain) {
      const expected = puzzle.solution[domItem];
      if (assignments[domItem] === expected) {
        nextValidation[domItem] = 'correct';
      } else {
        nextValidation[domItem] = 'wrong';
        wrongCount++;
      }
    }
    setValidation(nextValidation);

    if (wrongCount === 0) {
      setIsCompleting(true);
      setFeedback({
        type: 'success',
        message: 'Tepat sekali! Gerbang jembatan terbuka.',
      });
      playSuccessChime();
      window.setTimeout(() => {
        onSolved();
      }, 650);
    } else {
      playErrorTone();
      setFeedback({
        type: 'error',
        message: `${wrongCount} pasangan belum tepat. Periksa kembali nilai hurufnya.`,
      });
    }
  };

  const assignedCount = Object.keys(assignments).length;

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
        {/* Ribbon Header (TEAL slice from download14.png) */}
        <div
          className="relative mx-auto -mb-9 z-20 flex items-center justify-center pointer-events-none pixelated"
          style={{
            width: '259px',
            height: '103px',
            backgroundImage: "url('/ui/popup/download14.png')",
            backgroundPosition: '0px 0px',
            backgroundSize: '259px 515px',
            backgroundRepeat: 'no-repeat',
          }}
        >
          <span
            className="text-base font-extrabold tracking-wide text-[#fff7df] -mt-2"
            style={{
              textShadow:
                '-2px -2px 0 #00006c, 2px -2px 0 #00006c, -2px 2px 0 #00006c, 2px 2px 0 #00006c, 0 2px 0 #00006c',
            }}
          >
            {puzzle.title}
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
            {/* Parchment Instruction Banner */}
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
                {puzzle.instruction}
              </p>
              <p className="mt-1 text-xs font-medium text-[#6b5646]">
                {puzzle.ruleHint} · Klik pasangan atau seret angka ke huruf.
              </p>
            </div>

            {/* Dark Slate Matching Arena */}
            <div
              ref={arenaRef}
              className="relative pixelated"
              style={{
                borderStyle: 'solid',
                borderWidth: '14px',
                borderImageSource: "url('/ui/popup/download13.png')",
                borderImageSlice: '20 20 20 20 fill',
                borderImageRepeat: 'stretch',
              }}
            >
              {/* SVG Connection Layer */}
              <svg
                className="pointer-events-none absolute inset-0 w-full h-full z-10 overflow-visible"
                aria-hidden="true"
              >
                {lines.map((line) => {
                  const dx = Math.abs(line.x2 - line.x1) * 0.48;
                  const pathD = `M ${line.x1} ${line.y1} C ${line.x1 + dx} ${line.y1}, ${
                    line.x2 - dx
                  } ${line.y2}, ${line.x2} ${line.y2}`;
                  const strokeColor =
                    line.status === 'correct'
                      ? '#34d399'
                      : line.status === 'wrong'
                      ? '#f87171'
                      : '#f3cf7a';
                  return (
                    <g key={line.key}>
                      <path
                        d={pathD}
                        fill="none"
                        stroke="rgba(0,0,0,0.55)"
                        strokeWidth={6}
                        strokeLinecap="round"
                      />
                      <path
                        d={pathD}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={3.5}
                        strokeLinecap="round"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Column Headers + Progress */}
              <div className="relative z-20 flex items-center justify-between text-xs font-semibold text-[#d8c79e] mb-3 px-1">
                <span>Domain (Huruf)</span>
                <span className="tabular-nums text-[#f3cf7a]">
                  Terpasang: {assignedCount}/{puzzle.domain.length}
                </span>
                <span>Kodomain (Angka)</span>
              </div>

              {/* Matching Grid */}
              <div className="relative z-20 grid grid-cols-2 gap-14 sm:gap-20 items-center">
                {/* Left Column: Domain Huruf */}
                <div className="flex flex-col gap-3">
                  {puzzle.domain.map((domItem) => {
                    const pairedVal = assignments[domItem];
                    const status = validation[domItem];
                    const isSelected = selectedDomain === domItem;
                    const isDropTarget = dragOverDomain === domItem;

                    let cardClasses =
                      'bg-[#f3e6c4] border-[#8b633c] text-[#3b2a20] hover:bg-[#faf0d7]';
                    if (status === 'correct') {
                      cardClasses = 'bg-[#d4f4e4] border-[#2f7d6d] text-[#14473b]';
                    } else if (status === 'wrong') {
                      cardClasses = 'bg-[#fde2dc] border-[#c84b31] text-[#6b1d10]';
                    } else if (isSelected || isDropTarget) {
                      cardClasses =
                        'bg-[#fff5d6] border-[#f3cf7a] text-[#3b2a20] ring-2 ring-[#f3cf7a]';
                    }

                    return (
                      <div key={domItem} className="relative flex items-center">
                        <button
                          type="button"
                          onClick={() => handleDomainClick(domItem)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            if (dragOverDomain !== domItem) setDragOverDomain(domItem);
                          }}
                          onDragLeave={() => {
                            if (dragOverDomain === domItem) setDragOverDomain(null);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            setDragOverDomain(null);
                            const val =
                              e.dataTransfer.getData('text/plain') || draggedValue;
                            if (val && puzzle.codomain.includes(val)) {
                              assignPair(domItem, val);
                            }
                            setDraggedValue(null);
                          }}
                          className={`w-full min-h-[52px] px-3 py-2 rounded-md border-2 flex items-center justify-between gap-2 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3cf7a] ${cardClasses}`}
                          aria-label={`Domain ${domItem}${
                            pairedVal ? `, terhubung ke ${pairedVal}` : ''
                          }`}
                        >
                          <span className="text-xl font-extrabold tabular-nums">
                            {domItem}
                          </span>
                          <span className="text-xs font-bold whitespace-nowrap">
                            {status === 'correct' && (
                              <span className="text-[#1b5e4f]">✓ Cocok ({pairedVal})</span>
                            )}
                            {status === 'wrong' && (
                              <span className="text-[#9e2b18]">✕ Salah ({pairedVal})</span>
                            )}
                            {!status && pairedVal && (
                              <span className="text-[#6b4d2e]">→ {pairedVal}</span>
                            )}
                            {!status && !pairedVal && (
                              <span className="text-[#8a7560]">
                                {isDropTarget ? 'Lepas di sini' : 'Pilih / Taruh'}
                              </span>
                            )}
                          </span>
                        </button>

                        {/* Anchor dot right */}
                        <span
                          ref={(el) => {
                            domainAnchorRefs.current[domItem] = el;
                          }}
                          className={`-ml-2 z-30 w-4 h-4 rounded-full border-2 shrink-0 ${
                            pairedVal
                              ? 'bg-[#f3cf7a] border-[#3d2314]'
                              : 'bg-[#5c6472] border-[#1f242c]'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>

                {/* Right Column: Codomain Angka */}
                <div className="flex flex-col gap-3">
                  {puzzle.codomain.map((codItem) => {
                    const ownerDomain = findDomainByCodomain(codItem);
                    const ownerStatus = ownerDomain ? validation[ownerDomain] : undefined;
                    const isSelected = selectedCodomain === codItem;

                    let cardClasses =
                      'bg-[#f3e6c4] border-[#8b633c] text-[#3b2a20] hover:bg-[#faf0d7]';
                    if (ownerStatus === 'correct') {
                      cardClasses = 'bg-[#d4f4e4] border-[#2f7d6d] text-[#14473b]';
                    } else if (ownerStatus === 'wrong') {
                      cardClasses = 'bg-[#fde2dc] border-[#c84b31] text-[#6b1d10]';
                    } else if (isSelected) {
                      cardClasses =
                        'bg-[#fff5d6] border-[#f3cf7a] text-[#3b2a20] ring-2 ring-[#f3cf7a]';
                    } else if (ownerDomain) {
                      cardClasses = 'bg-[#e8d5a8] border-[#6b4d2e] text-[#3b2a20]';
                    }

                    return (
                      <div key={codItem} className="relative flex items-center">
                        {/* Anchor dot left */}
                        <span
                          ref={(el) => {
                            codomainAnchorRefs.current[codItem] = el;
                          }}
                          className={`-mr-2 z-30 w-4 h-4 rounded-full border-2 shrink-0 ${
                            ownerDomain
                              ? 'bg-[#f3cf7a] border-[#3d2314]'
                              : 'bg-[#5c6472] border-[#1f242c]'
                          }`}
                        />

                        <button
                          type="button"
                          draggable={!isCompleting}
                          onDragStart={(e) => {
                            setDraggedValue(codItem);
                            e.dataTransfer.setData('text/plain', codItem);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onDragEnd={() => {
                            setDraggedValue(null);
                            setDragOverDomain(null);
                          }}
                          onClick={() => handleCodomainClick(codItem)}
                          className={`w-full min-h-[52px] px-3 py-2 rounded-md border-2 flex items-center justify-between gap-2 transition-colors cursor-grab active:cursor-grabbing focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f3cf7a] ${cardClasses}`}
                          aria-label={`Angka ${codItem}${
                            ownerDomain ? `, dipasangkan dengan ${ownerDomain}` : ''
                          }`}
                        >
                          <span className="text-xs font-semibold text-[#6b5646] whitespace-nowrap">
                            {ownerDomain ? `${ownerDomain} →` : 'Seret / Klik'}
                          </span>
                          <span className="text-xl font-extrabold tabular-nums">
                            {codItem}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Feedback Banner (explicit text + icon, never hue-only) */}
            {feedback && (
              <div
                role="status"
                className={`rounded-md border-2 px-3 py-2 text-xs font-bold flex items-center gap-2 ${
                  feedback.type === 'success'
                    ? 'bg-[#194b40] border-[#34d399] text-[#d4f4e4]'
                    : feedback.type === 'error'
                    ? 'bg-[#5d2017] border-[#f87171] text-[#fde2dc]'
                    : 'bg-[#3c2d23] border-[#f3cf7a] text-[#fff7df]'
                }`}
              >
                <span>
                  {feedback.type === 'success'
                    ? '✓'
                    : feedback.type === 'error'
                    ? '✕'
                    : '!'}
                </span>
                <span>{feedback.message}</span>
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <button
                type="button"
                onClick={handleReset}
                disabled={isCompleting || assignedCount === 0}
                className="px-4 py-2 rounded border-2 border-[#3d2314] bg-[#7d5238] hover:bg-[#936243] disabled:opacity-50 disabled:cursor-not-allowed text-xs font-bold text-[#fff7df] whitespace-nowrap shrink-0 cursor-pointer transition-colors"
              >
                Reset
              </button>

              <div className="flex items-center gap-2">
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
                  onClick={handleCheck}
                  disabled={isCompleting}
                  className="px-5 py-2 rounded border-2 border-[#1b4b41] bg-[#2f7d6d] hover:bg-[#3a9683] disabled:opacity-60 text-xs font-bold text-[#fff7df] shadow whitespace-nowrap shrink-0 cursor-pointer transition-colors"
                >
                  Periksa
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
