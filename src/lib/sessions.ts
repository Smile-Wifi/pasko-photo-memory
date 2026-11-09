export const SESSION_PACKAGES = {
  mini: { name: "Mini Session", price: 1499 },
  family: { name: "Family Session", price: 2999 },
  barkada: { name: "Barkada Session", price: 1999 },
} as const;
export type SessionPackageId = keyof typeof SESSION_PACKAGES;

export const BANK_DETAILS = {
  bankName: "[ELON LAB CORPORATION BANK NAME]",
  accountName: "ELON LAB CORPORATION",
  accountNumber: "[ELON LAB CORPORATION ACCOUNT NUMBER]",
};
export const GCASH_DETAILS = {
  accountName: "ELON LAB CORPORATION",
  number: "[ELON LAB GCASH NUMBER]",
  qrUrl: null as string | null, // set once the GCash QR image is uploaded
};
