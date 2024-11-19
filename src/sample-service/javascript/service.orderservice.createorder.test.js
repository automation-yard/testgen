// service.OrderService.createOrder.spec.js

const { OrderService } = require("./service");
const { calculateDiscount } = require("./utils/discountCalculator");
const { sendOrderConfirmation } = require("./utils/notificationService");

jest.mock("./utils/discountCalculator");
jest.mock("./utils/notificationService");

describe("OrderService.createOrder", () => {
  let orderService;
  const mockProducts = [
    { id: "1", name: "Product 1", price: 100 },
    { id: "2", name: "Product 2", price: 200 },
  ];
  const mockCustomer = {
    id: "customer1",
    name: "John Doe",
    email: "john@example.com",
    loyaltyPoints: 1500,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    orderService = new OrderService();
    orderService.products = mockProducts;
    orderService.customer = mockCustomer;
    calculateDiscount.mockReturnValue(50);
    sendOrderConfirmation.mockResolvedValue(undefined);
  });

  it("should create order with correct calculations for single item", () => {
    const orderItems = [{ productId: "1", quantity: 2 }];

    const order = orderService.createOrder(orderItems);

    expect(order).toEqual({
      items: [
        {
          product: mockProducts[0],
          quantity: 2,
          total: 200,
        },
      ],
      subtotal: 200,
      discount: 50,
      total: 150,
      customer: mockCustomer,
    });
    expect(calculateDiscount).toHaveBeenCalledWith(200, mockCustomer);
    expect(sendOrderConfirmation).toHaveBeenCalledWith(order);
  });

  it("should create order with correct calculations for multiple items", () => {
    const orderItems = [
      { productId: "1", quantity: 2 },
      { productId: "2", quantity: 1 },
    ];

    const order = orderService.createOrder(orderItems);

    expect(order).toEqual({
      items: [
        { product: mockProducts[0], quantity: 2, total: 200 },
        { product: mockProducts[1], quantity: 1, total: 200 },
      ],
      subtotal: 400,
      discount: 50,
      total: 350,
      customer: mockCustomer,
    });
    expect(calculateDiscount).toHaveBeenCalledWith(400, mockCustomer);
  });

  it("should throw error for invalid product ID", () => {
    const orderItems = [{ productId: "invalid", quantity: 1 }];

    expect(() => orderService.createOrder(orderItems)).toThrow(
      "Product with ID invalid not found."
    );
  });

  it("should handle empty order items array", () => {
    const orderItems = [];

    const order = orderService.createOrder(orderItems);

    expect(order).toEqual({
      items: [],
      subtotal: 0,
      discount: 50,
      total: -50,
      customer: mockCustomer,
    });
  });

  it("should handle large quantities and totals", () => {
    const orderItems = [{ productId: "1", quantity: 1000000 }];

    const order = orderService.createOrder(orderItems);

    expect(order.subtotal).toBe(100000000);
    expect(order.items[0].total).toBe(100000000);
  });

  it("should handle multiple discount scenarios", () => {
    calculateDiscount.mockImplementation((amount, customer) => {
      let discount = 0;
      if (amount > 500) discount += amount * 0.1;
      if (customer.loyaltyPoints > 1000) discount += amount * 0.05;
      return discount;
    });

    const orderItems = [
      { productId: "1", quantity: 5 },
      { productId: "2", quantity: 1 },
    ];

    const order = orderService.createOrder(orderItems);

    expect(order.subtotal).toBe(700);
    expect(order.discount).toBe(105); // 10% volume + 5% loyalty
    expect(order.total).toBe(595);
  });

  it("should send order confirmation with correct data", () => {
    const orderItems = [{ productId: "1", quantity: 1 }];

    const order = orderService.createOrder(orderItems);

    expect(sendOrderConfirmation).toHaveBeenCalledWith({
      items: [{ product: mockProducts[0], quantity: 1, total: 100 }],
      subtotal: 100,
      discount: 50,
      total: 50,
      customer: mockCustomer,
    });
  });

  it("should handle zero quantities gracefully", () => {
    const orderItems = [{ productId: "1", quantity: 0 }];

    const order = orderService.createOrder(orderItems);

    expect(order.items[0].total).toBe(0);
    expect(order.subtotal).toBe(0);
  });
});
