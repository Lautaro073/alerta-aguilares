export type AdminCitizenStatus = 'active' | 'blocked';

export type AdminCitizen = {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  status: AdminCitizenStatus;
  reportCount: number;
  termsAcceptedAt: string | null;
  createdAt: string | null;
  lastSeenAt: string | null;
};

export type AdminCitizensSummary = {
  total: number;
  active: number;
  blocked: number;
  newThisMonth: number;
};

export type AdminCitizensResponse = {
  data?: AdminCitizen[];
  count?: number;
  summary?: AdminCitizensSummary;
};

export type CitizenActionHandlers = {
  setCitizenStatus: (citizen: AdminCitizen, status: AdminCitizenStatus) => void;
};
