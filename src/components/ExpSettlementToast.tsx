import React, { useEffect, useState } from 'react';
import { ExpSettlement } from '@/types/skill';
import { getLevelTitle } from '@/types/skill';
import { Sparkles, Award, TrendingUp } from 'lucide-react';

interface ExpSettlementToastProps {
  settlement: ExpSettlement;
  onClose: () => void;
}

const ExpSettlementToast: React.FC<ExpSettlementToastProps> = ({ settlement, onClose }) => {
  const [showBadges, setShowBadges] = useState(false);
  const [badgeIndex, setBadgeIndex] = useState(0);

  useEffect(() => {
    if (settlement.unlockedBadges.length > 0) {
      const timer = setTimeout(() => setShowBadges(true), 800);
      return () => clearTimeout(timer);
    }
  }, [settlement.unlockedBadges.length]);

  useEffect(() => {
    if (showBadges && badgeIndex < settlement.unlockedBadges.length - 1) {
      const timer = setTimeout(() => setBadgeIndex((i) => i + 1), 1500);
      return () => clearTimeout(timer);
    }
  }, [showBadges, badgeIndex, settlement.unlockedBadges.length]);

  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-4 right-4 z-[100] animate-slide-in-right">
      <div className="bg-white rounded-2xl shadow-2xl border-2 border-pink-300 p-4 max-w-xs">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-lg leading-none"
        >
          ×
        </button>

        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-yellow-500" />
          <span className="font-bold text-pink-700 text-sm">经验结算</span>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-4 h-4 text-green-500" />
          <span className="text-sm text-gray-700">
            获得 <span className="font-bold text-green-600">+{settlement.expGained}</span> 经验
          </span>
        </div>

        {settlement.leveledUp && (
          <div className="bg-gradient-to-r from-yellow-100 to-orange-100 rounded-xl p-2 mb-2 border border-yellow-300">
            <div className="flex items-center gap-2">
              <span className="text-xl">🎉</span>
              <div>
                <p className="text-xs font-bold text-yellow-700">升级了！</p>
                <p className="text-xs text-yellow-600">
                  Lv.{settlement.newLevel} {getLevelTitle(settlement.newLevel)}
                </p>
              </div>
            </div>
          </div>
        )}

        {showBadges && settlement.unlockedBadges.length > 0 && badgeIndex < settlement.unlockedBadges.length && (
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-xl p-3 border border-purple-300 animate-bounce-in">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-600" />
              <span className="font-bold text-purple-700 text-xs">徽章解锁！</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-3xl">{settlement.unlockedBadges[badgeIndex].badge.icon}</span>
              <div>
                <p className="font-bold text-purple-800 text-sm">
                  {settlement.unlockedBadges[badgeIndex].badge.name}
                </p>
                <p className="text-xs text-purple-600">
                  {settlement.unlockedBadges[badgeIndex].badge.description}
                </p>
              </div>
            </div>
            {settlement.unlockedBadges.length > 1 && (
              <p className="text-xs text-purple-500 mt-1 text-right">
                {badgeIndex + 1}/{settlement.unlockedBadges.length}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpSettlementToast;
