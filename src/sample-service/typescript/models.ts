// src/sampleService/models.ts
export interface Product {
  id: number;
  name: string;
  price: number;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  loyaltyPoints: number;
}

export interface OrderItem {
  product: Product;
  quantity: number;
  total: number;
}

export interface Order {
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  customer: Customer;
}
