// Mock client to replace removed SDK
export const base44 = {
  auth: {
    me: async () => ({ email: 'mock@user.com', full_name: 'Mock User' }),
    updateMe: async () => { },
    redirectToLogin: () => console.log('Redirect to login called'),
  },
  entities: {
    Appointment: { filter: async (args) => [], create: async (data) => { } },
    Quote: { filter: async (args) => [], update: async (id, data) => { } },
    Notification: { filter: async (args) => [], create: async (data) => { } },
    Document: { filter: async (args) => [] },
    Conversation: { filter: async (args) => [] },
    WorkflowPreventivo: {
      filter: async (args) => [],
      create: async (data) => { },
      update: async (id, data) => { }
    },
    Fatturato: {
      filter: async (args) => [],
      create: async (data) => { },
      update: async (id, data) => { },
      delete: async (id) => { }
    },
    Cantiere: { filter: async (args) => [] },
    Query: {},
  },
  appLogs: {
    logUserInApp: async (page) => {
      console.log(`[Mock] Logged navigation to: ${page}`);
    }
  }
};
