import { v4 as uuidv4 } from 'uuid';

export interface VerificationRequest {
  id: string;
  userId: string;
  status: 'pending' | 'approved' | 'rejected';
  documents: {
    type: string;
    url: string;
    uploadedAt: Date;
  }[];
  submittedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
  notes?: string;
}

export class VerificationService {
  private verificationRequests: Map<string, VerificationRequest> = new Map();

  async submitVerificationRequest(userId: string, documents: { type: string; url: string }[]): Promise<VerificationRequest> {
    const request: VerificationRequest = {
      id: uuidv4(),
      userId,
      status: 'pending',
      documents: documents.map(doc => ({
        ...doc,
        uploadedAt: new Date()
      })),
      submittedAt: new Date()
    };

    this.verificationRequests.set(request.id, request);
    return request;
  }

  async getVerificationRequest(userId: string): Promise<VerificationRequest | null> {
    return Array.from(this.verificationRequests.values())
      .find(req => req.userId === userId) || null;
  }

  async approveVerification(requestId: string, reviewerId: string, notes?: string): Promise<VerificationRequest> {
    const request = this.verificationRequests.get(requestId);
    if (!request) throw new Error('Verification request not found');

    request.status = 'approved';
    request.reviewedAt = new Date();
    request.reviewedBy = reviewerId;
    request.notes = notes;

    return request;
  }

  async rejectVerification(requestId: string, reviewerId: string, reason: string, notes?: string): Promise<VerificationRequest> {
    const request = this.verificationRequests.get(requestId);
    if (!request) throw new Error('Verification request not found');

    request.status = 'rejected';
    request.reviewedAt = new Date();
    request.reviewedBy = reviewerId;
    request.rejectionReason = reason;
    request.notes = notes;

    return request;
  }

  async getAllPendingRequests(): Promise<VerificationRequest[]> {
    return Array.from(this.verificationRequests.values())
      .filter(req => req.status === 'pending');
  }
}

export const verificationService = new VerificationService();