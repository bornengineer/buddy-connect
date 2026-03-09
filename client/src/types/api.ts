export type User = {
  id: number;
  uid: string;
  name: string;
  email: string;
  is_friend?: boolean;
  request_sent?: boolean;
  request_received?: boolean;
};

export type IncomingFriendRequest = {
  id: number;
  created_at: string;
  sender_id: number;
  sender_uid: string;
  sender_name: string;
  sender_email: string;
};

export type AuthResponse = {
  token: string;
  user: {
    id: number;
    uid: string;
    name: string;
    email: string;
  };
};
