export type User = {
  id: string;
  email: string;
};

export type Session = {
  accessToken: string;
  user: User;
};

export type LoginCredentials = {
  email: string;
  password: string;
};
