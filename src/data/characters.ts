import { CharacterData } from '../types/game';

export const PLAYER_DATA: CharacterData = {
  id: 'player',
  displayName: 'Kesatria',
  ribbon: 'TEAL',
  portrait: '/assets/UI/Human Avatars/Avatars_01.png',
  stats: {
    HP: 100,
    ATK: 10,
    DEF: 5,
    SPD: 8,
  },
  abilities: [
    {
      displayName: 'Tebasan Cepat',
      icon: '/assets/UI/Icons/Icon_05.png',
      cooldown: 2,
      cost: 0,
      description: 'Serangan pedang cepat ke arah hadap untuk membuka jalan dan menghalau musuh di dekatmu.',
    },
    {
      displayName: 'Perisai Teguh',
      icon: '/assets/UI/Icons/Icon_06.png',
      cooldown: 5,
      cost: 10,
      description: 'Mengangkat perisai pelindung yang mengurangi kerusakan masuk dan menjaga barisan rekan.',
    },
  ],
};

export const COMPANION_1_DATA: CharacterData = {
  id: 'teman1',
  displayName: 'Teman 1',
  ribbon: 'RED',
  portrait: '/assets/UI/Human Avatars/Avatars_02.png',
  stats: {
    HP: 95,
    ATK: 9,
    DEF: 6,
    SPD: 8,
  },
  abilities: [
    {
      displayName: 'Hantaman Tombak',
      icon: '/assets/UI/Icons/Icon_05.png',
      cooldown: 3,
      cost: 5,
      description: 'Menusuk ke depan dengan jangkauan lebih panjang sambil menjaga jarak aman dari tepi air.',
    },
    {
      displayName: 'Semangat Rekan',
      icon: '/assets/UI/Icons/Icon_07.png',
      cooldown: 6,
      cost: 12,
      description: 'Meningkatkan kecepatan gerak dan memulihkan stamina rekan satu barisan.',
    },
  ],
};

export const COMPANION_2_DATA: CharacterData = {
  id: 'teman2',
  displayName: 'Teman 2',
  ribbon: 'YELLOW',
  portrait: '/assets/UI/Human Avatars/Avatars_03.png',
  stats: {
    HP: 90,
    ATK: 11,
    DEF: 4,
    SPD: 9,
  },
  abilities: [
    {
      displayName: 'Langkah Gesit',
      icon: '/assets/UI/Icons/Icon_07.png',
      cooldown: 4,
      cost: 8,
      description: 'Bergerak lincah mengikuti jejak barisan di depannya tanpa tertinggal saat menyeberangi jembatan.',
    },
    {
      displayName: 'Jaga Belakang',
      icon: '/assets/UI/Icons/Icon_06.png',
      cooldown: 5,
      cost: 10,
      description: 'Melindungi bagian belakang formasi dari serangan mendadak saat menjelajah pulau.',
    },
  ],
};

export const ALL_CHARACTERS: CharacterData[] = [
  PLAYER_DATA,
  COMPANION_1_DATA,
  COMPANION_2_DATA,
];
