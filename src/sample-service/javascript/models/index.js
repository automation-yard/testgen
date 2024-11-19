export class Product {
  constructor(id, name, price) {
    this.id = id;
    this.name = name;
    this.price = price;
  }
}

export class Customer {
  constructor(id, name, email, loyaltyPoints) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.loyaltyPoints = loyaltyPoints;
  }
}

export class Order {
  constructor(items, subtotal, discount, total, customer) {
    this.items = items;
    this.subtotal = subtotal;
    this.discount = discount;
    this.total = total;
    this.customer = customer;
  }
}