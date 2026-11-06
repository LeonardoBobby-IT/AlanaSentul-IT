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
    name: 'Muchammed Aditya',
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

const STORAGE_AUTH_KEY = 'it_checklist_auth_user_v2';

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

  // Return logged-in user or null if not yet authenticated
  getCurrentUser(): AuthorizedUser | null {
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
            email: parsed.email.trim().toLowerCase(),
            isSuperuser: false,
          };
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored auth user', e);
    }
    return null;
  },

  setCurrentUser(user: AuthorizedUser | null): void {
    if (user) {
      localStorage.setItem(STORAGE_AUTH_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_AUTH_KEY);
    }
  },

  loginWithEmail(rawEmail: string): AuthorizedUser {
    const email = rawEmail.trim().toLowerCase();
    const matched = SUPERUSERS.find((su) => su.email.toLowerCase() === email);
    if (matched) {
      this.setCurrentUser(matched);
      return matched;
    }

    // Default viewer name formatted from email address
    const namePart = email.split('@')[0] || 'Auditor';
    const formattedName = namePart
      .split(/[._-]/)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' ');

    const viewerUser: AuthorizedUser = {
      name: `${formattedName} (Viewer)`,
      role: 'Viewer / Read-Only',
      email,
      isSuperuser: false,
    };
    this.setCurrentUser(viewerUser);
    return viewerUser;
  },

  logout(): void {
    localStorage.removeItem(STORAGE_AUTH_KEY);
  },

  switchUserByEmail(email: string): AuthorizedUser {
    return this.loginWithEmail(email);
  },
};

