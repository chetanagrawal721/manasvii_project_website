/**
 * ============================================================
 *  ROMANTIC WEBSITE — PERSONALIZATION CONFIG
 *  Edit this file to customize the experience for your recipient.
 * ============================================================
 */

const CONFIG = {

  // ── PASSCODE ──────────────────────────────────────────────
  // The 4-digit code the recipient must enter to unlock the site.
  passcode: "2516",

  // ── RECIPIENT ─────────────────────────────────────────────
  recipientName: "Mansvii",

  // ── LOVE LETTER ───────────────────────────────────────────
  // The handwritten letter text shown in the Love Letter scene.
  letterText: [
    "My dearest Mansvii,",
    "",
    "I know I can't be there with you today, and that feels like the hardest thing in the world. But I want you to know that every single moment I've spent with you has been the most beautiful chapter of my life.",
    "",
    "You make ordinary days feel like fairy tales. Your laugh is my favourite sound, your eyes are my favourite view, and your presence is my favourite place to be.",
    "",
    "Distance is just a word — my heart has been with you all along.",
    "",
    "With all my love, always 🌸"
  ],

  // ── REASONS I LOVE YOU ────────────────────────────────────
  // Heart chips shown inside the jar — add or remove freely.
  reasons: [
    "your eyes",
    "your smile",
    "your voice",
    "your hugs",
    "how you care",
    "your gestures",
    "how you listen",
    "your laugh",
    "your kindness",
    "just you ♡"
  ],

  // ── PHOTOS (Scrapbook Memories) ───────────────────────────
  photos: [
    {
      src: "assets/images/IMG_0774.JPG.jpeg",
      alt: "Our first trip",
      caption: "That perfect day ☀️",
      date: "May 14, 2025",
      note: "I couldn't stop looking at you. Everything about this day was magic.",
      frameType: "polaroid", // Options: polaroid, vintage, film
      rotation: -3
    },
    {
      src: "assets/images/IMG_0792.PNG",
      alt: "Silly moment",
      caption: "Always making me laugh",
      date: "August 2, 2025",
      note: "You have the most beautiful smile in the entire world. Seeing you happy is my favorite thing, and I'll always try my best to keep that smile on your face.",
      frameType: "vintage",
      rotation: 4
    },
    {
      src: "assets/images/IMG_0840.PNG",
      alt: "Beautiful memory",
      caption: "You & Me ❤️",
      date: "October 18, 2025",
      note: "I knew right then that I wanted to spend every moment with you. You make every place feel like home.",
      frameType: "polaroid",
      rotation: -5
    },
    {
      src: "assets/images/IMG_9436.JPG.jpeg",
      alt: "Recent adventure",
      caption: "My favorite person",
      date: "December 31, 2025",
      note: "Cheers to this beautiful life with you. I love you endlessly, and I can't wait to make a million more memories by your side.",
      frameType: "film",
      rotation: 2
    }
  ],

  // ── LETTER PHOTO ──────────────────────────────────────────
  // Single photo shown in the Polaroid frame on the Love Letter page
  letterPhoto: "assets/images/IMG_9442.JPG.jpeg",

  // ── SONG ──────────────────────────────────────────────────
  song: {
    title: "O Meri Laila",
    artist: "Atif Aslam",
    audioSrc: "assets/audio/Video Project 11.m4a",
    coverSrc: "assets/audio/IMG_9442.JPG (1).jpeg"
  },

  // ── AWARD ───────────────────────────────────────────────
  award: {
    title: "BEST GIRLFRIEND IN THE WORLD",
    subtitle: "Official Certificate of Love & Appreciation",
    presentedTo: "Manasvii",
    date: "July 31, 2025",
    certId: "GF-2025-♥-001",
    signature: "With all my heart, Chetan",
    message: "For being the brightest part of my life, filling every ordinary day with extraordinary happiness, making every smile more meaningful, every moment unforgettable, and every dream worth chasing together.\n\nYour kindness, laughter, patience, support, and endless love make you the most beautiful person in my world.\n\nThank you for choosing me every single day.\n\nYou will always be my favorite hello and my hardest goodbye.",
    closingMessage: "No trophy, certificate, or award could ever truly express how much you mean to me. This is just a tiny reminder that, in my eyes, you’ll always be my favorite person and the greatest blessing in my life. ❤️",
    bottomQuote: "Every love story is beautiful, but ours is my favorite."
  },

  // Legacy (kept for compatibility)
  awardMessage: "For being the most caring, beautiful, and wonderful person in my world."
};
