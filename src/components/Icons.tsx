import { Pizza, Utensils, Sandwich, Coffee, IceCream, Leaf } from 'lucide-react';

export const Icons = {
  Pizza: () => <Pizza className="w-10 h-10" />,
  Pasta: () => <Leaf className="w-10 h-10" />, // Using Leaf for Salads
  Burger: () => <Sandwich className="w-10 h-10" />, // Using Sandwich for Paninis/Sandwiches
  Fries: () => <Utensils className="w-10 h-10" />,
  Dessert: () => <IceCream className="w-10 h-10" />,
  Drink: () => <Coffee className="w-10 h-10" />
};
