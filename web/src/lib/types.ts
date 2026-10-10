export interface PersonaMetadata {
  id: string;
  name: string;
  description: string;
  characteristics: {
    avgLength: number;
    codeSwitchRatio: number;
    emojiRate: number;
    style: string;
  };
}

export interface PersonaStats {
  n_turns: number;
  total_chars: number;
  length: {
    mean: number;
    median: number;
    p25: number;
    p50: number;
    p75: number;
    p90: number;
    max: number;
  };
  bubbles_per_turn: {
    mean: number;
    max: number;
    multi_bubble_share: number;
  };
  emoji: {
    unicode_per_turn: number;
    top_unicode: [string, number][];
    top_wechat_faces: [string, number][];
  };
  laughter_per_turn: number;
  code_switching: {
    cjk_chars: number;
    latin_words: number;
    latin_share: number;
  };
  punctuation: {
    ellipsis: number;
    exclaim: number;
    question: number;
    tilde: number;
    no_end_punct_turns: number;
  };
  top_phrases: [string, number][];
  top_openers: [string, number][];
  top_closers: [string, number][];
  active_hours_utc: Record<string, number>;
  by_contact: Record<
    string,
    {
      is_group: boolean;
      n_turns: number;
      avg_chars: number;
    }
  >;
  engine: string;
}

export interface Persona {
  metadata: PersonaMetadata;
  stats: PersonaStats;
  profile: string;
  prompt: string;
}
