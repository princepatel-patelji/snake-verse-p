import React from 'react';
import { motion } from 'motion/react';
import type { FoodItem } from '@/types/database';

interface FoodCardProps {
  food: FoodItem;
  onClick: () => void;
}

export default function FoodCard({ food, onClick }: FoodCardProps) {
  const rarityColors = { common: 'bg-gray-200 text-gray-700', rare: 'bg-blue-100 text-blue-700', epic: 'bg-purple-100 text-purple-700', legendary: 'bg-yellow-100 text-yellow-800' };

  return (
    <motion.div whileHover={{ scale: 1.04, rotate: 1 }} whileTap={{ scale: 0.97 }} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="cursor-pointer" onClick={onClick}>
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-clay border border-white/60 hover:shadow-glass transition-all">
        <div className="w-20 h-20 mx-auto mb-3 bg-gradient-to-br from-pv-peach/30 to-pv-butter/30 rounded-xl flex items-center justify-center shadow-inner text-4xl">{food.emoji}</div>
        <h3 className="font-poppins font-semibold text-pv-plum text-center truncate">{food.name}</h3>
        <div className="flex items-center justify-center gap-2 mt-1 mb-2">
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${rarityColors[food.rarity]}`}>{food.rarity}</span>
          <span className="text-sm font-bold text-pv-pink">{food.calories} cal</span>
        </div>
        <p className="text-xs text-gray-600 text-center line-clamp-2">{food.description}</p>
      </div>
    </motion.div>
  );
}