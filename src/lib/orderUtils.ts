import { Order, OrderItem } from '../types/restaurant';

/**
 * Returns only active (non-canceled / non-voided) items for an order.
 * Also reconciles legacy orders where items were removed at the cashier before payment
 * so the displayed items always match order.subtotal.
 */
export function getActiveOrderItems(order?: Order | null): OrderItem[] {
  if (!order || !Array.isArray(order.items)) return [];

  const nonVoided = order.items.filter(
    (item) =>
      item &&
      !item.voidedAt &&
      !item.voidReason &&
      (item.status as string) !== 'VOIDED' &&
      (item.status as string) !== 'CANCELLED' &&
      (item.quantity ?? 1) > 0
  );

  const targetSubtotal = Number(order.subtotal ?? 0);
  if (targetSubtotal <= 0 || nonVoided.length <= 1) {
    return nonVoided;
  }

  const currentSum = Number(
    nonVoided
      .reduce((acc, i) => acc + Number(i.unitPrice ?? 0) * Number(i.quantity ?? 1), 0)
      .toFixed(2)
  );

  // If sum of items matches order.subtotal within 0.05 SAR, return all non-voided items
  if (Math.abs(currentSum - targetSubtotal) <= 0.05) {
    return nonVoided;
  }

  // If items sum is greater than order.subtotal (items were canceled before printing/payment),
  // find the exact subset of items whose sum equals order.subtotal (up to 15 items)
  if (currentSum > targetSubtotal + 0.05 && nonVoided.length <= 15) {
    const n = nonVoided.length;
    const totalMasks = 1 << n;
    for (let mask = 1; mask < totalMasks; mask++) {
      let sum = 0;
      for (let i = 0; i < n; i++) {
        if (mask & (1 << i)) {
          sum += Number(nonVoided[i].unitPrice ?? 0) * Number(nonVoided[i].quantity ?? 1);
        }
      }
      if (Math.abs(sum - targetSubtotal) <= 0.05) {
        return nonVoided.filter((_, i) => Boolean(mask & (1 << i)));
      }
    }
  }

  return nonVoided;
}
