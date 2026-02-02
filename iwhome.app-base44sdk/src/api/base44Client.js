// Mock client to replace removed SDK
export const base44 = {
  auth: {
    me: async () => ({ email: 'mock@user.com', full_name: 'Mock User' }),
    updateMe: async () => { },
    redirectToLogin: () => console.log('Redirect to login called'),
  },
  entities: {
    Appointment: { filter: async () => [], create: async () => { } },
    Quote: { filter: async () => [], update: async () => { } },
    Notification: { filter: async () => [], create: async () => { } },
    Document: { filter: async () => [] },
    Conversation: { filter: async () => [] },
    Query: {},
  },
  appLogs: {
    logUserInApp: async (page) => {
      console.log(`[Mock] Logged navigation to: ${page}`);
    }
  }
};
