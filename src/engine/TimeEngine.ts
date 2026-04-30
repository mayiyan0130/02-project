import type { GameTime, TimeSlot } from '../types/game';
import { MONTHS_PER_YEAR, TIME_SLOTS, TIME_SLOTS_PER_XUN, XUNS_PER_MONTH } from '../config/constants';

export const createInitialGameTime = (): GameTime => ({
  year: 1,
  month: 1,
  xun: 1,
  slotIndex: 0,
  slot: TIME_SLOTS[0],
});

export const advanceTime = (current: GameTime, steps = 1): GameTime => {
  const absoluteIndex =
    (((current.month - 1) * XUNS_PER_MONTH + (current.xun - 1)) * TIME_SLOTS_PER_XUN + current.slotIndex) + steps;
  const totalSlotsPerYear = MONTHS_PER_YEAR * XUNS_PER_MONTH * TIME_SLOTS_PER_XUN;
  const safeIndex = ((absoluteIndex % totalSlotsPerYear) + totalSlotsPerYear) % totalSlotsPerYear;

  const month = Math.floor(safeIndex / (XUNS_PER_MONTH * TIME_SLOTS_PER_XUN)) + 1;
  const xun = Math.floor((safeIndex % (XUNS_PER_MONTH * TIME_SLOTS_PER_XUN)) / TIME_SLOTS_PER_XUN) + 1;
  const slotIndex = safeIndex % TIME_SLOTS_PER_XUN;

  return {
    year: current.year + Math.floor(absoluteIndex / totalSlotsPerYear),
    month,
    xun,
    slotIndex,
    slot: TIME_SLOTS[slotIndex],
  };
};

export const isSpecialSlot = (slot: TimeSlot): boolean => slot === '深夜';
