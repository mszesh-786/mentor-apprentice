export type ApprenticeProfile = {
  id: string;
  userId: string;
  shortBio: string | null;
  generalLocation: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateApprenticeProfileInput = {
  userId: string;
  shortBio?: string;
  generalLocation?: string;
};

export type UpdateApprenticeProfileInput = {
  shortBio?: string | null;
  generalLocation?: string | null;
};
