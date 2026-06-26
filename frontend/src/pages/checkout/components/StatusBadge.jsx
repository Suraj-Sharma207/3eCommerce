import React from 'react';

const StatusBadge = ({ status, type }) => {
  let badgeStyles = "bg-gray-100 text-gray-700";
  
  if (type === 'payment') {
    if (status === 'PAID') badgeStyles = "bg-success-100 text-success-700";
    else if (status === 'PENDING') badgeStyles = "bg-warning text-white";
    else if (status === 'FAILED') badgeStyles = "bg-danger text-white";
  } else if (type === 'order') {
    const s = status?.toUpperCase() || '';
    if (s === 'DELIVERED') badgeStyles = "bg-success-100 text-success-700";
    else if (s === 'SHIPPED') badgeStyles = "bg-indigo-100 text-indigo-700";
    else if (s === 'PROCESSING' || s === 'CONFIRMED') badgeStyles = "bg-blue-100 text-blue-700";
    else if (s === 'CANCELLED') badgeStyles = "bg-danger-100 text-danger-700";
    else badgeStyles = "bg-warning-100 text-warning-800";
  }

  return (
    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold tracking-wide ${badgeStyles}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
