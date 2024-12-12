export function calculateDiscount(amount, customer) {
  let discount = 0;
  if (amount > 500) {
    discount += amount * 0.1; // 10% discount for orders over $500
  }
  if (customer.loyaltyPoints > 1000) {
    discount += amount * 0.05; // Additional 5% discount for loyal customers
  }
  return discount;
}
