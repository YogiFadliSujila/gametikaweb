import React from 'react';
import { ISLAND_NPCS, PAPER_ITEM_ASSET, WORLD_PAPERS } from '../data/bridge2Quest';

interface Bridge2TodoHudProps {
  visible: boolean;
  collectedPaperIds: string[];
  talkedNpcIds: string[];
  bridge2Unlocked: boolean;
  onOpenTurnInModal: () => void;
}

export const Bridge2TodoHud: React.FC<Bridge2TodoHudProps> = ({
  visible,
  collectedPaperIds,
  talkedNpcIds,
  bridge2Unlocked,
  onOpenTurnInModal,
}) => {
  if (!visible) return null;

  const papersDone = collectedPaperIds.length;
  const npcsDone = talkedNpcIds.length;
  const allReady = papersDone >= WORLD_PAPERS.length && npcsDone >= ISLAND_NPCS.length;

  return (
    <aside
      aria-label="To-Do List Jembatan Kedua"
      className="pointer-events-auto fixed top-3 right-3 z-20 w-[276px] rounded-lg border-2 border-[#4d3221] bg-[#2a1d17]/92 px-3.5 py-3 text-[#fff7df] shadow-lg transition-all duration-150"
    >
      <div className="flex items-baseline justify-between gap-2 border-b border-[#5b3d2b] pb-2">
        <h2 className="text-xs font-extrabold tracking-wide text-[#f3cf7a]">
          To-Do List Jembatan 2
        </h2>
        <span
          className={`text-[11px] font-bold whitespace-nowrap ${
            bridge2Unlocked
              ? 'text-[#6ee7b7]'
              : allReady
              ? 'text-[#34d399]'
              : 'text-[#d8c79e]'
          }`}
        >
          {bridge2Unlocked ? '✓ Terbuka' : allReady ? '✓ Siap Setor' : 'Berlangsung'}
        </span>
      </div>

      <div className="mt-2.5 flex flex-col gap-2.5 text-xs">
        {/* Task 1: 3 Kertas */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={PAPER_ITEM_ASSET}
                alt="Ikon Kertas"
                referrerPolicy="no-referrer"
                className="w-4 h-5 object-contain pixelated shrink-0"
              />
              <span
                className={`font-bold truncate ${
                  papersDone >= WORLD_PAPERS.length ? 'text-[#6ee7b7]' : 'text-[#fff7df]'
                }`}
              >
                Kumpulkan 3 Kertas
              </span>
            </div>
            <span className="font-bold tabular-nums text-[#f3cf7a] shrink-0">
              {papersDone}/{WORLD_PAPERS.length}
            </span>
          </div>
          <ul className="pl-6 flex flex-col gap-0.5 text-[11px] text-[#d8c79e]">
            {WORLD_PAPERS.map((paper) => {
              const done = collectedPaperIds.includes(paper.id);
              return (
                <li
                  key={paper.id}
                  className={`flex items-center gap-1.5 ${
                    done ? 'text-[#a7f3d0] line-through opacity-85' : 'text-[#e9dcc0]'
                  }`}
                >
                  <span aria-hidden="true" className="font-bold w-3 shrink-0">
                    {done ? '✓' : '○'}
                  </span>
                  <span className="truncate">{paper.title}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="border-t border-[#4d3221]" />

        {/* Task 2: 3 NPC Lain */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span
                aria-hidden="true"
                className="w-4 text-center text-xs font-extrabold text-[#f3cf7a] shrink-0"
              >
                !
              </span>
              <span
                className={`font-bold truncate ${
                  npcsDone >= ISLAND_NPCS.length ? 'text-[#6ee7b7]' : 'text-[#fff7df]'
                }`}
              >
                Interaksi 3 NPC Pulau
              </span>
            </div>
            <span className="font-bold tabular-nums text-[#f3cf7a] shrink-0">
              {npcsDone}/{ISLAND_NPCS.length}
            </span>
          </div>
          <ul className="pl-6 flex flex-col gap-0.5 text-[11px] text-[#d8c79e]">
            {ISLAND_NPCS.map((npc) => {
              const done = talkedNpcIds.includes(npc.id);
              return (
                <li
                  key={npc.id}
                  className={`flex items-center gap-1.5 ${
                    done ? 'text-[#a7f3d0] line-through opacity-85' : 'text-[#e9dcc0]'
                  }`}
                >
                  <span aria-hidden="true" className="font-bold w-3 shrink-0">
                    {done ? '✓' : '○'}
                  </span>
                  <span className="truncate">
                    {npc.name} · {npc.role}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {!bridge2Unlocked && (
        <div className="mt-3 pt-2 border-t border-[#5b3d2b] flex items-center justify-between gap-2">
          <span className="text-[11px] leading-tight text-[#d8c79e]">
            {allReady
              ? 'Semua siap! Setorkan di gerbang jembatan kedua.'
              : 'Jelajahi pulau kanan sebelum jembatan kedua.'}
          </span>
          {allReady && (
            <button
              type="button"
              onClick={onOpenTurnInModal}
              className="px-2.5 py-1 rounded border border-[#1b4b41] bg-[#2f7d6d] hover:bg-[#3a9683] text-[11px] font-bold text-[#fff7df] whitespace-nowrap shrink-0 cursor-pointer transition-colors"
            >
              Setor
            </button>
          )}
        </div>
      )}
    </aside>
  );
};
