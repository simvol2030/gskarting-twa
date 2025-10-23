export interface User {
  name: string;
  cardNumber: string;
  balance: number;
  totalPurchases: number;
  totalSaved: number;
}

export interface Product {
  id: number;
  name: string;
  price: number;
  oldPrice?: number;
  image: string;
  category: string;
}

export interface Store {
  id: number;
  name: string;
  address: string;
  status: string;
  distance: string;
  iconColor: string;
  phone: string;
  hours: string;
  features: string[];
  coords: { lat: number; lng: number };
  closed?: boolean;
}

export interface Offer {
  id: number;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  deadline: string;
  deadlineClass: string;
  details: string;
  conditions: string[];
}

export interface Transaction {
  id: number;
  title: string;
  amount: number;
  date: string;
  type: 'earn' | 'spend';
  spent: string;
  storeName?: string;
}

export interface Recommendation {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
}
