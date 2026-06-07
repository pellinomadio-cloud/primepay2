export interface User {
  id: string;
  name: string;
  email: string;
  balance: number;
  isLoggedIn: boolean;
  isPrime?: boolean;
  primeCode?: string;
}

export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number;
  reward: number;
}
