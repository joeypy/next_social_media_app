export const NAME_AUTH_SESSION = "bugbook-app";

export type SessionPayload = {
  userId: string;
  tokenSession: string;
  tokenRefresh: string;
};
