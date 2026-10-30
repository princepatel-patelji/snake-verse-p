export interface Profile {
  id: string;
  display_name: string;
  username: string;
  phone_number: string | null;
  avatar_url: string | null;
  bio: string | null;
  level: number;
  xp: number;
  virtual_calories: number;
  total_sessions: number;
  total_puzzles_solved: number;
  created_at: string;
  updated_at: string;
  privacy_settings: Record<string, any>;
  preferences: Record<string, any>;
}

export interface Community {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  creator_id: string;
  invite_code: string;
  requires_approval: boolean;
  created_at: string;
  updated_at: string;
}

export interface CommunityMember {
  id: string;
  community_id: string;
  user_id: string;
  role: 'member' | 'admin' | 'creator';
  status: 'active' | 'pending';
  joined_at: string;
}

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  description: string;
  emoji: string;
  calories: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface PuzzleQuestion {
  id: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
  xp_reward: number;
  calorie_reward: number;
}

export interface GameSession {
  id: string;
  user_id: string;
  session_type: 'solo' | 'friend' | 'community';
  community_id: string | null;
  total_calories_added: number;
  total_calories_removed: number;
  puzzles_attempted: number;
  puzzles_correct: number;
  xp_earned: number;
  created_at: string;
  completed_at: string | null;
}