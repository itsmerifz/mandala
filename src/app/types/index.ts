import { Permission } from "@/lib/zod"

export interface Roster extends User {
  rating: string
  certificates: {
    id: string
    code: string
    color: string
    isOnTraining: boolean
    notes?: string
    issuedAt: Date
    upgradedAt?: Date
  }[]
}

export interface User {
  name: string;
  id: string;
  email: string;
  cid: string;
  ratingId: number;
  ratingShort: string;
  ratingLong: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RosterCertsData {
  userId: string;
  certificateId: string;
  isOnTraining: boolean;
  notes: string | null;
  issuedAt: Date;
  upgradedAt: Date | null;
  id: string;
}

export interface Role {
  id: string;
  name: string;
  description: string | null ;
  color: string | null;
}

export interface Certificate {
  id: string;
  code: string;
  name: string;
  color: string;
}

export interface EditRole extends Role {
  permissions: Permission[]
}