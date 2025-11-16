"use client";

export const formatAddress = (address?: string | null) => {
  if (!address) return "-";
  const norm = address.toLowerCase();
  return `${norm.slice(0, 6)}…${norm.slice(-4)}`;
};

export const formatNumber = (value: bigint | number, options: Intl.NumberFormatOptions = {}) => {
  const formatter = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    notation: "compact",
    ...options,
  });
  const numeric = typeof value === "bigint" ? Number(value) : value;
  return formatter.format(numeric);
};

export const formatUsd = (value: bigint | number) =>
  `$${formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatStatusLabel = (status: number | undefined) => {
  switch (status) {
    case 0:
      return "Pending";
    case 1:
      return "Approved";
    case 2:
      return "Rejected";
    default:
      return "Unknown";
  }
};


