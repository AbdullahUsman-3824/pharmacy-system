export interface SystemSettings {
  id: string;
  pharmacyName: string | null;
  pharmacyAddress: string | null;
  pharmacyPhone: string | null;
  pharmacyEmail: string | null;
  pharmacyLogo: string | null;
  gstEnabled: boolean;
  gstRate: number | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export type UpdateSystemSettingsInput = Partial<
  Omit<SystemSettings, "id" | "createdAt" | "updatedAt">
>;
