'use client';

import { useState, useEffect, useCallback } from 'react';

export type WeightUnit = 'kg' | 'lbs';

const KG_TO_LBS = 2.20462;
const LBS_TO_KG = 1 / KG_TO_LBS;

export function useWeightUnit() {
  const [unit, setUnit] = useState<WeightUnit>('kg');

  useEffect(() => {
    const saved = localStorage.getItem('weight_unit');
    if (saved === 'kg' || saved === 'lbs') {
      setUnit(saved);
    }
  }, []);

  const toggleUnit = useCallback(() => {
    setUnit((prev) => {
      const next = prev === 'kg' ? 'lbs' : 'kg';
      localStorage.setItem('weight_unit', next);
      return next;
    });
  }, []);

  const setUnitTo = useCallback((u: WeightUnit) => {
    setUnit(u);
    localStorage.setItem('weight_unit', u);
  }, []);

  return { unit, toggleUnit, setUnitTo };
}

/** Convert a weight value for display. Data is always stored in kg. */
export function displayWeight(kg: number | null, unit: WeightUnit): string {
  if (kg === null || kg === 0) return '0';
  if (unit === 'lbs') return (kg * KG_TO_LBS).toFixed(1);
  return kg.toString();
}

/** Convert user input back to kg for storage. */
export function inputToKg(value: string, unit: WeightUnit): string {
  if (!value) return '';
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  if (unit === 'lbs') return (num * LBS_TO_KG).toFixed(2);
  return value;
}

/** Convert kg value to display unit for pre-fill. */
export function kgToDisplay(kgValue: string, unit: WeightUnit): string {
  if (!kgValue) return '';
  const num = parseFloat(kgValue);
  if (isNaN(num)) return kgValue;
  if (unit === 'lbs') return (num * KG_TO_LBS).toFixed(1);
  return kgValue;
}
