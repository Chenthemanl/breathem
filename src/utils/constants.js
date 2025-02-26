// In utils/constants.js

export const EMOTIONAL_STATES = {
  NORMAL: 'normal',
  MEDITATING: 'meditating',
  BREATHING: 'breathing',
  ANGRY: 'angry',
  HAPPY: 'happy'
};

export const STATE_THEMES = {
  [EMOTIONAL_STATES.NORMAL]: {
    backgroundColor: '#FFFFFF',
    borderColor: '#8F8F8F',
    eyeColor: '#8F8F8F',
    mouthColor: '#8F8F8F'
  },
  [EMOTIONAL_STATES.ANGRY]: {
    backgroundColor: '#FFFFFF',
    borderColor: '#8F8F8F',
    eyeColor: '#8F8F8F',
    mouthColor: '#8F8F8F'
  }
  // ... other states remain the same 6
};

export const TRIGGER_PHRASES = {
  STRESS: {
    HIGH: {
      WORDS: ['unlock', 'huge', 'biggest', 'terrible', 'idiot', 'hook', 'killer', 'esl', 'exciting'],
      PHRASES: [
        'beat the chef',
        'end to end',
        'the only',
        'industry standard',
        'trojan horse',
        'this is terrible'
      ]
    },
    MEDIUM: {
      WORDS: ['worried', 'anxiety', 'stress', 'pressure', 'mad'],
      PHRASES: [
        'i am stressed',
        'this is frustrating',
        'i feel overwhelmed',
        'this is annoying'
      ]
    },
    LOW: {
      WORDS: ['busy', 'tired', 'overwhelmed', 'milan'],
      PHRASES: [
        'i need a break',
        'this is difficult',
        'i dont like this'
      ]
    }
  },
  CALM: {
    HIGH: {
      WORDS: ['peaceful', 'relax', 'calm', 'tranquil'],
      PHRASES: [
        'i feel better',
        'this is nice',
        'i am calm now',
        'thank you for helping'
      ]
    },
    MEDIUM: {
      WORDS: ['breathe', 'rest', 'quiet', 'gentle'],
      PHRASES: [
        'lets take a break',
        'i need to rest',
        'time to relax'
      ]
    },
    LOW: {
      WORDS: ['happy', 'smile', 'good', 'perfect'],
      PHRASES: [
        'this is good',
        'im feeling okay',
        'getting better'
      ]
    }
  }
};