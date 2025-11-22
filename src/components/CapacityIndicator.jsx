import React from 'react';

const CapacityIndicator = ({ current, max, showWarning = false }) => {
   const percentage = (current / max) * 100;
  const isOverCapacity = current > max;
  const isNearCapacity = percentage >= 80;

  return (
    <div className="flex items-center space-x-2">
      <div className="w-16 bg-gray-200 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${
            isOverCapacity ? 'bg-red-500' : 
            isNearCapacity ? 'bg-yellow-500' : 'bg-green-500'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
      <span className={`text-xs font-medium ${
        isOverCapacity ? 'text-red-600' : 
        isNearCapacity ? 'text-yellow-600' : 'text-gray-600'
      }`}>
        {current}/{max}
      </span>
      {showWarning && isOverCapacity && (
        <span className="text-xs text-red-500">⚠️ Over</span>
      )}
    </div>
  );
};

export default CapacityIndicator;