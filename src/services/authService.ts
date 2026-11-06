export interface AuthorizedUser {
  name: string;
  role: string;
  email: string;
  isSuperuser: boolean;
}

export const SUPERUSERS: AuthorizedUser[] = [
  {
    name: 'Leonardo Bobby',
    role: 'Cluster IT Manager',
    email: 'sentulitm@alanahotels.com',
    isSuperuser: true,
  },
  {
    name: 'Muchammed Adity',
    role: 'IT Coordinator',
    email: 'sentulitc@alanahotels.com',
    isSuperuser: true,
  },
];

export const READ_ONLY_ROLE = {
  name: 'Guest Viewer',
  role: 'Viewer / Read-Only',
  email: 'viewer@alanahotels.com',
  isSuperuser: false,
};

const STORAGE_AUTH_KEY = 'it_checklist_auth_user_v1';

export const authService = {
  getSuperusers(): AuthorizedUser[] {
    return SUPERUSERS;
  },

  // Check if given email string qualifies as superuser
  isSuperuserEmail(email: string): boolean {
    if (!email) return false;
    const normalized = email.trim().toLowerCase();
    return SUPERUSERS.some((u) => u.email.toLowerCase() === normalized);
  },

  getCurrentUser(): AuthorizedUser {
    try {
      const stored = localStorage.getItem(STORAGE_AUTH_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.email) {
          // Re-verify superuser status against current list
          const matchedSuperuser = SUPERUSERS.find(
            (su) => su.email.toLowerCase() === parsed.email.trim().toLowerCase()
          );
          if (matchedSuperuser) {
            return matchedSuperuser;
          }
          return {
            name: parsed.name || 'Viewer',
            role: 'Viewer / Read-Only',
            email: parsed.email,
            isSuperuser: false,
          };
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored auth user', e);
    }

    // Default to Leonardo Bobby (first superuser) for the session owner
    const defaultUser = SUPERUSERS[0];
    localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(defaultUser));
    return defaultUser;
  },

  setCurrentUser(user: AuthorizedUser): void {
    localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(user));
  },

  switchUserByEmail(email: string): AuthorizedUser {
    const matched = SUPERUSERS.find(
      (su) => su.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (matched) {
      this.setCurrentUser(matched);
      return matched;
    }

    const viewerUser: AuthorizedUser = {
      name: email.split('@')[0] || 'Hotel Auditor',
      role: 'Viewer / Read-Only',
      email: email.trim().toLowerCase(),
      isSuperuser: false,
    };
    this.setCurrentUser(viewerUser);
    return viewerUser;
  },
};
