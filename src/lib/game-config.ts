import type { FoodItem, PuzzleQuestion } from '@/types/database';

export const FOOD_CATALOG: FoodItem[] = [
  { id: 'f1', name: 'Samosa', category: 'Indian', description: 'Crispy pastry filled with spiced potatoes.', emoji: '🥟', calories: 120, rarity: 'common' },
  { id: 'f2', name: 'Biryani', category: 'Indian', description: 'Fragrant rice cooked with spices and meat.', emoji: '🍛', calories: 280, rarity: 'rare' },
  { id: 'f3', name: 'Burger', category: 'Snacks', description: 'Juicy patty with fresh veggies and sauce.', emoji: '🍔', calories: 250, rarity: 'common' },
  { id: 'f4', name: 'Pizza', category: 'Snacks', description: 'Cheesy, crispy, and perfectly baked.', emoji: '🍕', calories: 300, rarity: 'common' },
  { id: 'f5', name: 'Gulab Jamun', category: 'Sweets', description: 'Soft milk dumplings soaked in syrup.', emoji: '🍩', calories: 180, rarity: 'epic' },
  { id: 'f6', name: 'Mango Shake', category: 'Drinks', description: 'Creamy and refreshing tropical blend.', emoji: '🥤', calories: 150, rarity: 'common' },
  { id: 'f7', name: 'Apple', category: 'Healthy', description: 'Crisp, juicy, and naturally sweet.', emoji: '🍎', calories: 60, rarity: 'common' },
  { id: 'f8', name: 'Fruit Bowl', category: 'Healthy', description: 'Colorful mix of seasonal fresh fruits.', emoji: '🥗', calories: 90, rarity: 'rare' },
];

export const PUZZLE_BANK: PuzzleQuestion[] = [
  { id: 'q1', category: 'General', difficulty: 'easy', question: 'Which planet is known as the Red Planet?', options: ['Venus', 'Mars', 'Jupiter', 'Saturn'], correct_answer: 'Mars', explanation: 'Mars appears red due to iron oxide on its surface.', xp_reward: 10, calorie_reward: 25 },
  { id: 'q2', category: 'Math', difficulty: 'easy', question: 'What is 12 x 8?', options: ['84', '96', '88', '104'], correct_answer: '96', explanation: '12 multiplied by 8 equals 96.', xp_reward: 10, calorie_reward: 25 },
  { id: 'q3', category: 'Food', difficulty: 'medium', question: 'Which ingredient is essential for making traditional Paneer?', options: ['Milk', 'Yogurt', 'Cheese', 'Cream'], correct_answer: 'Milk', explanation: 'Paneer is made by curdling fresh milk.', xp_reward: 20, calorie_reward: 50 },
  { id: 'q4', category: 'Logic', difficulty: 'hard', question: 'If all Bloops are Razzies and all Razzies are Lazzies, are all Bloops definitely Lazzies?', options: ['Yes', 'No', 'Maybe', 'Cannot be determined'], correct_answer: 'Yes', explanation: 'Transitive property: A⊆B and B⊆C implies A⊆C.', xp_reward: 30, calorie_reward: 100 },
  { id: 'q5', category: 'Emoji', difficulty: 'medium', question: '🌧️ + ☔ = ?', options: ['Raincoat', 'Umbrella', 'Cloud', 'Storm'], correct_answer: 'Umbrella', explanation: 'Rain and an umbrella go together.', xp_reward: 20, calorie_reward: 50 },
];

export const ACHIEVEMENTS = [
  { id: 'a1', name: 'First Bite', description: 'Eat your first virtual snack.', requirement: 'eat_count >= 1' },
  { id: 'a2', name: 'Puzzle Starter', description: 'Solve your first puzzle correctly.', requirement: 'puzzle_correct >= 1' },
  { id: 'a3', name: 'Snack Scientist', description: 'Try 3 different food categories.', requirement: 'categories_tried >= 3' },
  { id: 'a4', name: 'Brain Power', description: 'Solve 5 puzzles correctly.', requirement: 'puzzle_correct >= 5' },
];

export const GAME_RULES = {
  CALORIE_FLOOR: 0,
  XP_PER_SESSION: 5,
  LEVEL_THRESHOLD: 100,
};