/**
 * Domain types aligned with Laravel models/fields.
 * Customer mobile auth uses Sanctum under /api/v1.
 */

export type UserRole = 'customer' | 'professional';

/** Mirrors professionals.status enum on the website. */
export type ProfessionalStatus = 'pending' | 'accepted' | 'rejected';

export type ProfessionalSummary = {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  status: ProfessionalStatus;
  active?: boolean;
};

/** Website registration document fields — deferred on mobile until upload audit. */
export type ProfessionalDocumentFields = {
  id_proof_document: string;
  qualification_document: string;
  profile_photo?: string | null;
  gallery?: string | null;
  gst_certificate?: string | null;
};
