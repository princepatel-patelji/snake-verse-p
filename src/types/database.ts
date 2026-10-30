export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Profile {
  id: string;
  display_name: string;
  username: string;
  phone_number: string | null;
  avatar_url: string | null;
  bio: string | null;
  level: number | null;
  xp: number | null;
  virtual_calories: number | null;
  total_sessions: number | null;
  total_puzzles_solved: number | null;
  privacy_settings: Json | null;
  preferences: Json | null;
  created_at: string | null;
  updated_at: string | null;
}

export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>;

export interface Community {
  id: string;
  name: string;
  description: string | null;
  icon_url: string | null;
  creator_id: string | null;
  invite_code: string;
  requires_approval: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface CommunityMember {
  id: string;
  community_id: string | null;
  user_id: string | null;
  role: 'creator' | 'admin' | 'member' | null;
  status: 'active' | 'pending' | null;
  joined_at: string | null;
}

export interface FriendRequest {
  id: string;
  from_id: string | null;
  to_id: string | null;
  status: 'pending' | 'accepted' | 'rejected' | null;
  created_at: string | null;
}

export interface Friendship {
  id: string;
  user_id: string | null;
  friend_id: string | null;
  status: 'accepted' | 'blocked' | null;
  created_at: string | null;
}

export interface GameSession {
  id: string;
  user_id: string | null;
  session_type: 'solo' | 'friend' | 'community' | null;
  community_id: string | null;
  room_id: string | null;
  total_calories_added: number | null;
  total_calories_removed: number | null;
  puzzles_attempted: number | null;
  puzzles_correct: number | null;
  xp_earned: number | null;
  duration: number | null;
  created_at: string | null;
  completed_at: string | null;
}

export interface PuzzleAttempt {
  id: string;
  user_id: string | null;
  question_id: string;
  selected_answer: string | null;
  is_correct: boolean | null;
  xp_earned: number | null;
  time_taken: number | null;
  created_at: string | null;
}

// Food and puzzle content is currently bundled locally in src/lib/game-config.ts.
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

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          display_name: string;
          username: string;
          phone_number?: string | null;
          avatar_url?: string | null;
          bio?: string | null;
          level?: number | null;
          xp?: number | null;
          virtual_calories?: number | null;
          total_sessions?: number | null;
          total_puzzles_solved?: number | null;
          privacy_settings?: Json | null;
          preferences?: Json | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: ProfileUpdate;
        Relationships: [];
      };
      communities: {
        Row: Community;
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          icon_url?: string | null;
          creator_id?: string | null;
          invite_code: string;
          requires_approval?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Omit<Community, 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: 'communities_creator_id_fkey';
            columns: ['creator_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      community_members: {
        Row: CommunityMember;
        Insert: {
          id?: string;
          community_id: string;
          user_id: string;
          role?: CommunityMember['role'];
          status?: CommunityMember['status'];
          joined_at?: string | null;
        };
        Update: Partial<Omit<CommunityMember, 'id' | 'joined_at'>>;
        Relationships: [
          {
            foreignKeyName: 'community_members_community_id_fkey';
            columns: ['community_id'];
            isOneToOne: false;
            referencedRelation: 'communities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'community_members_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      friend_requests: {
        Row: FriendRequest;
        Insert: {
          id?: string;
          from_id: string;
          to_id: string;
          status?: FriendRequest['status'];
          created_at?: string | null;
        };
        Update: Partial<Omit<FriendRequest, 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: 'friend_requests_from_id_fkey';
            columns: ['from_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'friend_requests_to_id_fkey';
            columns: ['to_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      friendships: {
        Row: Friendship;
        Insert: {
          id?: string;
          user_id: string;
          friend_id: string;
          status?: Friendship['status'];
          created_at?: string | null;
        };
        Update: Partial<Omit<Friendship, 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: 'friendships_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'friendships_friend_id_fkey';
            columns: ['friend_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      game_sessions: {
        Row: GameSession;
        Insert: {
          id?: string;
          user_id: string;
          session_type?: GameSession['session_type'];
          community_id?: string | null;
          room_id?: string | null;
          total_calories_added?: number | null;
          total_calories_removed?: number | null;
          puzzles_attempted?: number | null;
          puzzles_correct?: number | null;
          xp_earned?: number | null;
          duration?: number | null;
          created_at?: string | null;
          completed_at?: string | null;
        };
        Update: Partial<Omit<GameSession, 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: 'game_sessions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'game_sessions_community_id_fkey';
            columns: ['community_id'];
            isOneToOne: false;
            referencedRelation: 'communities';
            referencedColumns: ['id'];
          }
        ];
      };
      puzzle_attempts: {
        Row: PuzzleAttempt;
        Insert: {
          id?: string;
          user_id: string;
          question_id: string;
          selected_answer?: string | null;
          is_correct?: boolean | null;
          xp_earned?: number | null;
          time_taken?: number | null;
          created_at?: string | null;
        };
        Update: Partial<Omit<PuzzleAttempt, 'id' | 'created_at'>>;
        Relationships: [
          {
            foreignKeyName: 'puzzle_attempts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_snackverse_username_available: { Args: { search_username: string }; Returns: boolean };
      accept_friend_request: { Args: { request_id: string }; Returns: boolean };
      send_snackverse_friend_request: { Args: { to_user_id: string }; Returns: string };
      find_profile_by_username: { Args: { search_username: string }; Returns: Array<Pick<Profile, 'id' | 'username' | 'display_name' | 'avatar_url'>> };
      get_my_friends: { Args: Record<string, never>; Returns: Array<{ id: string; friend_id: string; username: string; display_name: string; avatar_url: string | null }> };
      get_pending_friend_requests: { Args: Record<string, never>; Returns: Array<{ id: string; from_id: string; username: string; display_name: string; avatar_url: string | null; created_at: string }> };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
