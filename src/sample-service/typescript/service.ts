import { calculateDiscount, sendOrderConfirmation } from "./utils";
import { Product, Order, Customer } from "./models";

export class OrderService {
  constructor(private products: Product[], private customer: Customer) {}

  public createOrder(
    orderItems: { productId: number; quantity: number }[]
  ): Order {
    const items = orderItems.map((item) => {
      const product = this.products.find((p) => p.id === item.productId);
      if (!product) {
        throw new Error(`Product with ID ${item.productId} not found.`);
      }
      return {
        product,
        quantity: item.quantity,
        total: product.price * item.quantity,
      };
    });

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const discount = calculateDiscount(subtotal, this.customer);
    const total = subtotal - discount;

    const order: Order = {
      items,
      subtotal,
      discount,
      total,
      customer: this.customer,
    };
    sendOrderConfirmation(order);
    return order;
  }
}
