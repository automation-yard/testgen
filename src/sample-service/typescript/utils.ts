import { Customer, Order } from './models';

export function calculateDiscount(amount: number, customer: Customer): number {
  let discount = 0;
  if (amount > 500) {
    discount += amount * 0.1; // 10% discount for orders over $500
  }
  if (customer.loyaltyPoints > 1000) {
    discount += amount * 0.05; // Additional 5% discount for loyal customers
  }
  return discount;
}

export function sendOrderConfirmation(order: Order): void {
  // Simulate sending an email
  console.log(`Order confirmation sent to ${order.customer.email}`);
}
