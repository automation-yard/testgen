import { OrderService } from "./service";
import { calculateDiscount, sendOrderConfirmation } from "./utils";
import { Product, Order, Customer } from "./models";

describe("OrderService.createOrder", () => {
  let orderService: OrderService;
  const mockProducts: Product[] = [
    { id: 1, name: "Product 1", price: 10 },
    { id: 2, name: "Product 2", price: 20 },
  ];
  const mockCustomer: Customer = {
    id: 1,
    name: "Test Customer",
    email: "test@test.com",
    loyaltyPoints: 100,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mock("./utils");
    (calculateDiscount as jest.Mock).mockReturnValue(5);
    (sendOrderConfirmation as jest.Mock).mockImplementation(() => {});

    orderService = new OrderService(mockCustomer);
    orderService["products"] = mockProducts;
    orderService["customer"] = mockCustomer;
  });

  describe("Happy Path Tests", () => {
    it("should create valid order with single item", () => {
      const orderItems = [{ productId: 1, quantity: 2 }];

      const result = orderService.createOrder(orderItems);

      expect(result).toEqual({
        id: "1",
        status: "completed",
        items: [
          {
            product: mockProducts[0],
            quantity: 2,
            total: 20,
          },
        ],
        subtotal: 20,
        discount: 5,
        total: 15,
        customer: mockCustomer,
      });
      expect(calculateDiscount).toHaveBeenCalledWith(20, mockCustomer);
      expect(sendOrderConfirmation).toHaveBeenCalledWith(result);
    });

    it("should create valid order with multiple items", () => {
      const orderItems = [
        { productId: 1, quantity: 2 },
        { productId: 2, quantity: 1 },
      ];

      const result = orderService.createOrder(orderItems);

      expect(result.items).toHaveLength(2);
      expect(result.subtotal).toBe(40);
      expect(result.total).toBe(35);
    });

    it("should apply correct discount", () => {
      const orderItems = [{ productId: 1, quantity: 1 }];
      (calculateDiscount as jest.Mock).mockReturnValue(2);

      const result = orderService.createOrder(orderItems);

      expect(result.discount).toBe(2);
      expect(result.total).toBe(8);
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero quantity items", () => {
      const orderItems = [{ productId: 1, quantity: 0 }];

      const result = orderService.createOrder(orderItems);

      expect(result.subtotal).toBe(0);
      expect(result.total).toBe(-5);
    });

    it("should handle large quantities", () => {
      const orderItems = [{ productId: 1, quantity: 1000000 }];

      const result = orderService.createOrder(orderItems);

      expect(result.subtotal).toBe(10000000);
    });

    it("should handle decimal prices", () => {
      orderService["products"] = [{ id: 1, name: "Product 1", price: 10.99 }];
      const orderItems = [{ productId: 1, quantity: 2 }];

      const result = orderService.createOrder(orderItems);

      expect(result.subtotal).toBeCloseTo(21.98);
    });
  });

  describe("Error Cases", () => {
    it("should throw error for invalid product ID", () => {
      const orderItems = [{ productId: 999, quantity: 1 }];

      expect(() => orderService.createOrder(orderItems)).toThrow(
        "Product with ID 999 not found."
      );
    });

    it("should handle empty order items array", () => {
      const orderItems: { productId: number; quantity: number }[] = [];

      const result = orderService.createOrder(orderItems);

      expect(result.items).toHaveLength(0);
      expect(result.subtotal).toBe(0);
    });

    it("should handle sendOrderConfirmation failure", () => {
      const orderItems = [{ productId: 1, quantity: 1 }];
      (sendOrderConfirmation as jest.Mock).mockImplementation(() => {
        throw new Error("Network error");
      });

      expect(() => orderService.createOrder(orderItems)).toThrow(
        "Network error"
      );
    });
  });

  describe("Data Integrity", () => {
    it("should maintain price integrity through calculations", () => {
      const orderItems = [{ productId: 1, quantity: 3 }];

      const result = orderService.createOrder(orderItems);

      expect(result.subtotal).toBe(30);
      expect(result.total).toBe(25);
    });

    it("should not modify original product data", () => {
      const originalProducts = [...mockProducts];
      const orderItems = [{ productId: 1, quantity: 1 }];

      orderService.createOrder(orderItems);

      expect(orderService["products"]).toEqual(originalProducts);
    });
  });

  describe("Type Validation", () => {
    it("should return order with all required properties", () => {
      const orderItems = [{ productId: 1, quantity: 1 }];

      const result = orderService.createOrder(orderItems);

      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("status");
      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("subtotal");
      expect(result).toHaveProperty("discount");
      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("customer");
    });
  });
});
