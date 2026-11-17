import { IslandNpcData, WorldPaperItem } from '../types/game';

export const PAPER_ITEM_ASSET = '/assets/aistudio/tile_1_smooth_8x_d678aa8a.png';

export const WORLD_PAPERS: WorldPaperItem[] = [
  {
    id: 'kertas-barat',
    title: 'Catatan Kompas Barat',
    note: 'Lembaran perkamen tua bertanda arah mata angin dari reruntuhan barat pulau kanan.',
    x: 496,
    y: 288,
  },
  {
    id: 'kertas-selatan',
    title: 'Sketsa Arus Selatan',
    note: 'Peta kecil pasang surut yang ditemukan di tepi padang rumput selatan.',
    x: 736,
    y: 344,
  },
  {
    id: 'kertas-timur',
    title: 'Segel Tanjung Timur',
    note: 'Lembar izin penyeberangan berstempel kayu dari ujung tanjung timur.',
    x: 1312,
    y: 224,
  },
];

export const ISLAND_NPCS: IslandNpcData[] = [
  {
    id: 'warga-barat',
    name: 'Pak Raka',
    role: 'Penjaga Ladang',
    portrait: '/assets/UI/Human Avatars/Avatars_05.png',
    spriteKey: 'npc1Idle',
    hueRotateDeg: 145,
    x: 608,
    y: 168,
    facing: 'down',
    dialogLines: [
      'Selamat datang di pulau seberang, pengembara! Angin laut kemarin menerbangkan beberapa lembar kertas izin jembatan ke sekitar padang rumput.',
      'Kalau kamu mencari lembar pertama, coba periksa area rumput di sebelah barat daya di dekat pepohonan.',
    ],
  },
  {
    id: 'warga-utara',
    name: 'Bu Sari',
    role: 'Pengamat Ombak',
    portrait: '/assets/UI/Human Avatars/Avatars_08.png',
    spriteKey: 'npc2Idle',
    hueRotateDeg: 220,
    x: 1120,
    y: 8,
    facing: 'down',
    dialogLines: [
      'Dari tebing utara ini ombaknya terlihat tenang hari ini. Jangan lupa periksa ujung tanjung timur kalau kamu masih mencari kertas segel.',
      'Setelah ketiga kertas terkumpul dan kami bertiga sudah kamu temui, setorkan semuanya di gerbang jembatan kedua ya!',
    ],
  },
  {
    id: 'warga-timur',
    name: 'Kakek Bima',
    role: 'Kartografer Pulau',
    portrait: '/assets/UI/Human Avatars/Avatars_12.png',
    spriteKey: 'npc1Idle',
    hueRotateDeg: 75,
    x: 1184,
    y: 320,
    facing: 'left',
    dialogLines: [
      'Sudah lama tidak ada pendatang yang menjelajah hingga ke tanjung tenggara. Catatan peta jembatan selatan ini memang butuh tiga lembar segel kertas.',
      'Senang bisa berbincang denganmu! Pastikan seluruh daftar tugas sudah tercentang sebelum kembali ke gerbang jembatan kedua.',
    ],
  },
];
