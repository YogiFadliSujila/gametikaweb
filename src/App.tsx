import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bridge2TodoHud } from './components/Bridge2TodoHud';
import { Bridge2TurnInModal } from './components/Bridge2TurnInModal';
import { BridgeMinigameModal } from './components/BridgeMinigameModal';
import { CharacterInfoPopup } from './components/CharacterInfoPopup';
import { NpcDialogModal } from './components/NpcDialogModal';
import { ISLAND_NPCS, WORLD_PAPERS } from './data/bridge2Quest';
import { DEFAULT_BRIDGE_PUZZLE } from './data/bridgePuzzles';
import { ALL_CHARACTERS, PLAYER_DATA } from './data/characters';
import { WorldCanvas } from './engine/WorldCanvas';
import {
  CharacterData,
  CompanionSummary,
  IslandNpcData,
  WorldPaperItem,
} from './types/game';
import {
  playNpcTalkTone,
  playPaperPickupTone,
  playQuestStartTone,
} from './utils/soundFx';

export const App: React.FC = () => {
  const [activeCharacter, setActiveCharacter] = useState<CharacterData | null>(null);
  const [popupAnchor, setPopupAnchor] = useState<{ x: number; y: number } | null>(null);
  const [companions, setCompanions] = useState<CompanionSummary[]>([]);

  // Bridge 1 state
  const [bridgeUnlocked, setBridgeUnlocked] = useState(false);
  const [bridgePuzzleOpen, setBridgePuzzleOpen] = useState(false);

  // Bridge 2 state (To-Do List, 3 Papers, 3 Island NPCs, Turn-in Confirmation Modal)
  const [bridge2QuestStarted, setBridge2QuestStarted] = useState(false);
  const [bridge2Unlocked, setBridge2Unlocked] = useState(false);
  const [collectedPaperIds, setCollectedPaperIds] = useState<string[]>([]);
  const [talkedNpcIds, setTalkedNpcIds] = useState<string[]>([]);
  const [activeNpcDialog, setActiveNpcDialog] = useState<IslandNpcData | null>(null);
  const [bridge2TurnInOpen, setBridge2TurnInOpen] = useState(false);

  const [statusNotice, setStatusNotice] = useState<{
    tone: 'success' | 'info';
    message: string;
  } | null>(null);

  const noticeTimerRef = useRef<number | null>(null);
  const commandRef = useRef<{ toggleCompanion: (id: string) => void } | null>(null);

  const showNotice = useCallback((tone: 'success' | 'info', message: string) => {
    if (noticeTimerRef.current !== null) {
      window.clearTimeout(noticeTimerRef.current);
    }
    setStatusNotice({ tone, message });
    noticeTimerRef.current = window.setTimeout(() => {
      setStatusNotice(null);
      noticeTimerRef.current = null;
    }, 3800);
  }, []);

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current !== null) {
        window.clearTimeout(noticeTimerRef.current);
      }
    };
  }, []);

  const openCharacterInfo = useCallback(
    (data: CharacterData, anchor: { x: number; y: number } | null) => {
      setActiveCharacter(data);
      setPopupAnchor(anchor);
    },
    []
  );

  const closeCharacterInfo = useCallback(() => {
    setActiveCharacter(null);
    setPopupAnchor(null);
  }, []);

  const openBridgePuzzle = useCallback(() => {
    setActiveCharacter(null);
    setPopupAnchor(null);
    setBridgePuzzleOpen(true);
  }, []);

  const handleBridgeSolved = useCallback(() => {
    setBridgeUnlocked(true);
    setBridgePuzzleOpen(false);
    showNotice('success', '✓ Gerbang jembatan pertama terbuka! Jelajahi pulau kanan untuk tantangan berikutnya.');
  }, [showNotice]);

  const handleInteractBridge2Gate = useCallback(() => {
    setActiveCharacter(null);
    setPopupAnchor(null);
    if (!bridge2QuestStarted) {
      setBridge2QuestStarted(true);
      playQuestStartTone();
      showNotice(
        'info',
        '! To-Do List Jembatan 2 aktif: kumpulkan 3 kertas dan temui 3 NPC di pulau kanan.'
      );
      return;
    }
    setBridge2TurnInOpen(true);
  }, [bridge2QuestStarted, showNotice]);

  const handleCollectPaper = useCallback(
    (paper: WorldPaperItem) => {
      setCollectedPaperIds((prev) => {
        if (prev.includes(paper.id)) return prev;
        const next = [...prev, paper.id];
        playPaperPickupTone();
        showNotice(
          'info',
          `✓ ${paper.title} diambil (${next.length}/${WORLD_PAPERS.length} kertas)`
        );
        return next;
      });
    },
    [showNotice]
  );

  const handleTalkIslandNpc = useCallback((npc: IslandNpcData) => {
    setActiveCharacter(null);
    setPopupAnchor(null);
    playNpcTalkTone();
    setActiveNpcDialog(npc);
  }, []);

  const handleCloseNpcDialog = useCallback(() => {
    if (activeNpcDialog) {
      const npc = activeNpcDialog;
      setTalkedNpcIds((prev) => {
        if (prev.includes(npc.id)) return prev;
        const next = [...prev, npc.id];
        showNotice(
          'info',
          `✓ Selesai berbincang dengan ${npc.name} (${next.length}/${ISLAND_NPCS.length} NPC)`
        );
        return next;
      });
    }
    setActiveNpcDialog(null);
  }, [activeNpcDialog, showNotice]);

  const handleUnlockBridge2 = useCallback(() => {
    setBridge2Unlocked(true);
    setBridge2TurnInOpen(false);
    showNotice('success', '✓ Kertas diterima! Gerbang jembatan kedua kini terbuka permanen.');
  }, [showNotice]);

  const isAnyModalOpen =
    activeCharacter !== null ||
    bridgePuzzleOpen ||
    activeNpcDialog !== null ||
    bridge2TurnInOpen;

  // Matches world.gd toggle_char_info ('I' key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.code === 'KeyI' &&
        !bridgePuzzleOpen &&
        !bridge2TurnInOpen &&
        !activeNpcDialog
      ) {
        e.preventDefault();
        setActiveCharacter((prev) => {
          if (prev) {
            setPopupAnchor(null);
            return null;
          }
          setPopupAnchor(null);
          return PLAYER_DATA;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [bridgePuzzleOpen, bridge2TurnInOpen, activeNpcDialog]);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#182c36]">
      <WorldCanvas
        onOpenCharacterInfo={(data, pos) => openCharacterInfo(data, pos)}
        onCompanionsUpdate={setCompanions}
        onOpenBridgePuzzle={openBridgePuzzle}
        onInteractBridge2Gate={handleInteractBridge2Gate}
        onCollectPaper={handleCollectPaper}
        onTalkIslandNpc={handleTalkIslandNpc}
        bridgeUnlocked={bridgeUnlocked}
        bridge2Unlocked={bridge2Unlocked}
        collectedPaperIds={collectedPaperIds}
        talkedNpcIds={talkedNpcIds}
        commandRef={commandRef}
        isPopupOpen={isAnyModalOpen}
      />

      {/* Minimalist Pixel HUD: Party Portraits (click to inspect) + Companion Controls */}
      <div className="pointer-events-none fixed top-3 left-3 z-20 flex flex-col gap-2">
        <div className="pointer-events-auto flex items-center gap-2 rounded-lg border-2 border-[#4d3221] bg-[#2a1d17]/90 px-2.5 py-2 shadow-lg">
          {ALL_CHARACTERS.map((char) => {
            const comp = companions.find((c) => c.id === char.id);
            const isFollowing = comp?.state === 'FOLLOW';
            return (
              <div key={char.id} className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => openCharacterInfo(char, null)}
                  title={`Lihat Info ${char.displayName} (Klik kanan karakter atau tekan I)`}
                  className="group relative flex items-center gap-1.5 rounded border border-[#7c563a] bg-[#3f2c22] hover:bg-[#52392c] px-2 py-1 text-left transition-colors cursor-pointer"
                >
                  <img
                    src={char.portrait}
                    alt={char.displayName}
                    className="w-7 h-7 object-contain pixelated"
                  />
                  <div className="flex flex-col leading-tight">
                    <span className="text-xs font-bold text-[#fff7df]">
                      {char.displayName}
                    </span>
                    <span className="text-[10px] text-[#d8c79e]">
                      {comp ? (isFollowing ? 'Mengikuti' : 'Menunggu') : 'Pemain'}
                    </span>
                  </div>
                </button>

                {comp && (
                  <button
                    type="button"
                    onClick={() => commandRef.current?.toggleCompanion(comp.id)}
                    title={isFollowing ? `Suruh ${comp.name} tunggu` : `Ajak ${comp.name}`}
                    className={`px-2 py-1 rounded border text-[11px] font-bold cursor-pointer transition-colors ${
                      isFollowing
                        ? 'bg-[#c84b31] border-[#6b2416] text-[#fff7df] hover:bg-[#d95b40]'
                        : 'bg-[#2f7d6d] border-[#1b4b41] text-[#fff7df] hover:bg-[#3a9683]'
                    }`}
                  >
                    {isFollowing ? 'Tunggu' : 'Ajak'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bridge 2 To-Do List HUD (appears after interacting with Bridge 2 gate) */}
      <Bridge2TodoHud
        visible={bridge2QuestStarted}
        collectedPaperIds={collectedPaperIds}
        talkedNpcIds={talkedNpcIds}
        bridge2Unlocked={bridge2Unlocked}
        onOpenTurnInModal={() => setBridge2TurnInOpen(true)}
      />

      {/* Bridge Status + Controls legend */}
      <div className="pointer-events-none fixed bottom-3 left-3 z-20 rounded-md border border-[#4d3221] bg-[#1e1511]/85 px-3 py-1.5 text-xs text-[#f1e6c8] shadow flex flex-wrap items-center gap-x-2 gap-y-1">
        <span>
          <span className="font-bold text-[#f3cf7a]">WASD / Panah</span> Gerak
        </span>
        <span aria-hidden="true">·</span>
        <span>
          <span className="font-bold text-[#f3cf7a]">E / Spasi</span> Interaksi
        </span>
        <span aria-hidden="true">·</span>
        <span>
          <span className="font-bold text-[#f3cf7a]">I / Klik Kanan</span> Info Karakter
        </span>
        <span aria-hidden="true">·</span>
        <span className={bridgeUnlocked ? 'font-bold text-[#6ee7b7]' : 'font-bold text-[#fbbf24]'}>
          {bridgeUnlocked ? '✓ Jembatan 1 Terbuka' : '🔒 Jembatan 1 Terkunci'}
        </span>
        <span aria-hidden="true">·</span>
        <span className={bridge2Unlocked ? 'font-bold text-[#6ee7b7]' : 'font-bold text-[#fbbf24]'}>
          {bridge2Unlocked ? '✓ Jembatan 2 Terbuka' : '🔒 Jembatan 2 Terkunci'}
        </span>
      </div>

      {statusNotice && (
        <div
          role="status"
          className={`pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 z-30 rounded-lg border-2 px-4 py-2 text-sm font-bold text-[#fff7df] shadow-xl ${
            statusNotice.tone === 'success'
              ? 'border-[#34d399] bg-[#194b40]/95'
              : 'border-[#f3cf7a] bg-[#2a1d17]/95'
          }`}
        >
          {statusNotice.message}
        </div>
      )}

      <CharacterInfoPopup
        character={activeCharacter}
        anchor={popupAnchor}
        onClose={closeCharacterInfo}
      />

      <BridgeMinigameModal
        isOpen={bridgePuzzleOpen}
        puzzle={DEFAULT_BRIDGE_PUZZLE}
        onClose={() => setBridgePuzzleOpen(false)}
        onSolved={handleBridgeSolved}
      />

      <NpcDialogModal
        npc={activeNpcDialog}
        alreadyTalked={activeNpcDialog ? talkedNpcIds.includes(activeNpcDialog.id) : false}
        onClose={handleCloseNpcDialog}
      />

      <Bridge2TurnInModal
        isOpen={bridge2TurnInOpen}
        collectedPaperIds={collectedPaperIds}
        talkedNpcIds={talkedNpcIds}
        onClose={() => setBridge2TurnInOpen(false)}
        onUnlockBridge2={handleUnlockBridge2}
      />
    </div>
  );
};

export default App;
