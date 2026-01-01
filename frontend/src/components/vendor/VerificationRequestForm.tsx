import { useState, FormEvent } from 'react';
import { Select, Button, FormError, FormSuccess } from '../Form';
import axios from 'axios';
import './VerificationRequestForm.css';

interface DocumentFile {
  file: File;
  preview: string;
}

interface VerificationRequestFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

const documentTypes = [
  { value: 'business_registration', label: 'Business Registration Certificate' },
  { value: 'tax_certificate', label: 'Tax Registration Certificate' },
  { value: 'national_id', label: 'National ID / Passport' },
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'business_license', label: 'Business License' },
  { value: 'other', label: 'Other Supporting Document' }
];

const VerificationRequestForm: React.FC<VerificationRequestFormProps> = ({
  onSuccess,
  onCancel
}) => {
  const [documentType, setDocumentType] = useState('');
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const maxFileSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

  const handleDocumentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDocumentType(e.target.value);
    setError('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setError('');

    if (documents.length + files.length > 5) {
      setError('Maximum 5 documents allowed');
      return;
    }

    const validFiles: DocumentFile[] = [];

    for (const file of files) {
      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        setError('Only JPEG, PNG, and PDF files are allowed');
        continue;
      }

      // Validate file size
      if (file.size > maxFileSize) {
        setError(`File "${file.name}" is too large. Maximum size is 5MB`);
        continue;
      }

      // Create preview URL
      const preview = URL.createObjectURL(file);
      validFiles.push({ file, preview });
    }

    if (validFiles.length > 0) {
      setDocuments(prev => [...prev, ...validFiles]);
    }

    // Reset input
    e.target.value = '';
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => {
      const newDocs = [...prev];
      URL.revokeObjectURL(newDocs[index].preview);
      newDocs.splice(index, 1);
      return newDocs;
    });
  };

  const validateForm = (): boolean => {
    if (!documentType) {
      setError('Please select a document type');
      return false;
    }

    if (documents.length === 0) {
      setError('Please upload at least one document');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('documentType', documentType);
      
      documents.forEach((doc, index) => {
        formData.append(`documents`, doc.file);
      });

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/users/verification-request`,
        formData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(progress);
            }
          }
        }
      );

      if (response.data.success) {
        setSuccess('Verification request submitted successfully! We will review your documents within 1-3 business days.');
        
        // Clean up preview URLs
        documents.forEach(doc => URL.revokeObjectURL(doc.preview));
        
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err: any) {
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to submit verification request. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <form onSubmit={handleSubmit} className="verification-request-form">
      <div className="form-header">
        <h2>Submit Verification Documents</h2>
        <p>Upload your business documents to get verified as a trusted vendor</p>
      </div>

      {error && <FormError message={error} />}
      {success && <FormSuccess message={success} />}

      <div className="form-section">
        <Select
          label="Document Type"
          name="documentType"
          value={documentType}
          onChange={handleDocumentTypeChange}
          required
          disabled={isSubmitting}
          placeholder="Select document type"
          options={documentTypes}
        />

        <div className="file-upload-section">
          <label className="file-upload-label">
            Upload Documents
            <span className="file-requirements">
              (JPEG, PNG, PDF • Max 5MB each • Up to 5 files)
            </span>
          </label>
          
          <div className="file-upload-area">
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={handleFileSelect}
              disabled={isSubmitting || documents.length >= 5}
              className="file-input"
            />
            <div className="file-upload-content">
              <div className="upload-icon">📁</div>
              <p>Click to select files or drag and drop</p>
              <p className="upload-hint">Maximum 5 files, 5MB each</p>
            </div>
          </div>
        </div>

        {documents.length > 0 && (
          <div className="uploaded-documents">
            <h3>Uploaded Documents ({documents.length}/5)</h3>
            <div className="documents-list">
              {documents.map((doc, index) => (
                <div key={index} className="document-item">
                  <div className="document-preview">
                    {doc.file.type.startsWith('image/') ? (
                      <img src={doc.preview} alt="Document preview" />
                    ) : (
                      <div className="pdf-preview">
                        <span>📄</span>
                        <span>PDF</span>
                      </div>
                    )}
                  </div>
                  <div className="document-info">
                    <p className="document-name">{doc.file.name}</p>
                    <p className="document-size">{formatFileSize(doc.file.size)}</p>
                  </div>
                  <button
                    type="button"
                    className="remove-document"
                    onClick={() => removeDocument(index)}
                    disabled={isSubmitting}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {isSubmitting && uploadProgress > 0 && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            <p>Uploading... {uploadProgress}%</p>
          </div>
        )}
      </div>

      <div className="requirements-info">
        <h3>Document Requirements</h3>
        <ul>
          <li>Documents must be clear and readable</li>
          <li>All text should be visible and not blurred</li>
          <li>Documents should be recent (within last 6 months for statements)</li>
          <li>Business registration must match your profile information</li>
          <li>All documents must be in English or include certified translations</li>
        </ul>
      </div>

      <div className="form-actions">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          isLoading={isSubmitting}
          disabled={isSubmitting || documents.length === 0 || !documentType}
        >
          {isSubmitting ? 'Submitting...' : 'Submit for Verification'}
        </Button>
      </div>
    </form>
  );
};

export default VerificationRequestForm;