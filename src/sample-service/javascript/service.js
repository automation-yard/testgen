import { calculateDiscount } from "./utils/discountCalculator.js";
const { sendOrderConfirmation } = require("./utils/notificationService.js");
import { Product, Order, Customer } from "./models/index.js";

export class OrderService {
  constructor(products, customer) {
    this.products = products;
    this.customer = customer;
  }

  createOrder(orderItems) {
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

    const order = {
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

export default OrderService;
