import { v4 as uuidv4 } from 'uuid';

export interface KYCDocument {
  id: string;
  type: 'passport' | 'national_id' | 'drivers_license' | 'utility_bill';
  url: string;
  uploadedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
}

export interface KYCSubmission {
  id: string;
  userId: string;
  status: 'not_submitted' | 'pending' | 'approved' | 'rejected';
  documents: KYCDocument[];
  submittedAt?: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
  personalInfo: {
    fullName: string;
    dateOfBirth: string;
    nationality: string;
    address: string;
  };
}

export class KYCService {
  private submissions: Map<string, KYCSubmission> = new Map();

  async getKYCStatus(userId: string): Promise<KYCSubmission> {
    let submission = this.submissions.get(userId);
    
    if (!submission) {
      submission = {
        id: uuidv4(),
        userId,
        status: 'not_submitted',
        documents: [],
        personalInfo: {
          fullName: '',
          dateOfBirth: '',
          nationality: '',
          address: ''
        }
      };
      this.submissions.set(userId, submission);
    }
    
    return submission;
  }

  async submitKYC(userId: string, data: {
    personalInfo: KYCSubmission['personalInfo'];
    documents: Omit<KYCDocument, 'id' | 'uploadedAt' | 'status'>[];
  }): Promise<KYCSubmission> {
    const submission: KYCSubmission = {
      id: uuidv4(),
      userId,
      status: 'pending',
      documents: data.documents.map(doc => ({
        ...doc,
        id: uuidv4(),
        uploadedAt: new Date(),
        status: 'pending' as const
      })),
      personalInfo: data.personalInfo,
      submittedAt: new Date()
    };

    this.submissions.set(userId, submission);
    return submission;
  }

  async approveKYC(userId: string, reviewerId: string): Promise<KYCSubmission> {
    const submission = this.submissions.get(userId);
    if (!submission) throw new Error('KYC submission not found');

    submission.status = 'approved';
    submission.reviewedAt = new Date();
    submission.reviewedBy = reviewerId;
    submission.documents.forEach(doc => doc.status = 'approved');

    return submission;
  }

  async rejectKYC(userId: string, reviewerId: string, reason: string): Promise<KYCSubmission> {
    const submission = this.submissions.get(userId);
    if (!submission) throw new Error('KYC submission not found');

    submission.status = 'rejected';
    submission.reviewedAt = new Date();
    submission.reviewedBy = reviewerId;
    submission.rejectionReason = reason;
    submission.documents.forEach(doc => doc.status = 'rejected');

    return submission;
  }
}

export const kycService = new KYCService();