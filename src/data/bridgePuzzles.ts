export interface BridgePuzzle {
  id: string;
  title: string;
  instruction: string;
  ruleHint: string;
  domain: string[];
  codomain: string[];
  solution: Record<string, string>;
}

/**
 * Helper untuk membuat soal urutan alfabet (A=1, B=2, C=3, dst.).
 * Memudahkan penambahan soal kustom di masa depan.
 */
export function createAlphabetPuzzle(
  id: string,
  title: string,
  domain: string[],
  codomain: string[]
): BridgePuzzle {
  const solution: Record<string, string> = {};
  for (const letter of domain) {
    const upper = letter.trim().toUpperCase();
    solution[letter] = String(upper.charCodeAt(0) - 64);
  }
  return {
    id,
    title,
    instruction: 'Cocokkan setiap elemen domain huruf dengan nilai angkanya untuk membuka gerbang jembatan.',
    ruleHint: 'Aturan fungsi sementara: urutan alfabet (A = 1, B = 2, C = 3, ...)',
    domain,
    codomain,
    solution,
  };
}

/**
 * Daftar soal gerbang jembatan.
 * Untuk mengganti atau menambah soal kustom (misalnya fungsi linear atau relasi bebas),
 * cukup tambahkan objek BridgePuzzle dengan properti `domain`, `codomain`, dan `solution`.
 */
export const DEFAULT_BRIDGE_PUZZLE: BridgePuzzle = createAlphabetPuzzle(
  'bridge-alpha-1',
  'Gerbang Jembatan',
  ['B', 'C', 'A'],
  ['3', '1', '2']
);
