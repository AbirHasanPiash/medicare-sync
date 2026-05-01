import { useMemo, useState } from 'react';
import useSWR from 'swr';
import toast from 'react-hot-toast';
import {
  Download,
  Eye,
  FileText,
  FolderOpen,
  Image,
  Loader2,
  Trash2,
  Upload,
} from 'lucide-react';
import api, { fetcher } from '../utils/api';
import ConfirmationModal from '../components/ConfirmationModal';

const documentCategories = [
  { value: 'LAB_REPORT', label: 'Lab Reports' },
  { value: 'X_RAY', label: 'X-rays' },
  { value: 'PRESCRIPTION', label: 'Prescriptions' },
  { value: 'OTHER', label: 'Other Documents' },
];

const formatDate = (dateString) => {
  if (!dateString) return 'No date';
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const getFileName = (fileUrl) => {
  const parts = String(fileUrl || '').split('/');
  return parts[parts.length - 1] || 'document';
};

const MedicalDocuments = ({
  patientId,
  readOnly = false,
  compact = false,
  title = 'Documents',
  subtitle = 'Upload and organize your medical files in one secure place.',
}) => {
  const endpoint =
    readOnly && patientId
      ? `/documents/patients/${patientId}`
      : '/documents/my';
  const shouldFetch = readOnly ? Boolean(patientId) : true;
  const {
    data: documents = [],
    isLoading,
    mutate,
    error,
  } = useSWR(shouldFetch ? endpoint : null, fetcher);

  const [form, setForm] = useState({
    title: '',
    documentType: 'LAB_REPORT',
    file: null,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const documentsByCategory = useMemo(() => {
    return documentCategories.map((category) => ({
      ...category,
      documents: documents.filter(
        (document) => document.documentType === category.value
      ),
    }));
  }, [documents]);

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      toast.error('Please enter a document name.');
      return;
    }

    if (!form.file) {
      toast.error('Please choose a file.');
      return;
    }

    const payload = new FormData();
    payload.append('title', form.title);
    payload.append('documentType', form.documentType);
    payload.append('document', form.file);

    setIsUploading(true);
    try {
      await api.post('/documents/upload', payload);
      setForm({ title: '', documentType: 'LAB_REPORT', file: null });
      event.target.reset();
      await mutate();
      toast.success('Document uploaded.');
    } catch (uploadError) {
      toast.error(
        uploadError.response?.data?.error || 'Failed to upload document.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  const openDocument = async (document, download = false) => {
    try {
      const response = await api.get(
        `${document.fileUrl}${download ? '?download=true' : ''}`,
        {
          responseType: 'blob',
        }
      );
      const blobUrl = URL.createObjectURL(response.data);

      if (download) {
        const link = window.document.createElement('a');
        link.href = blobUrl;
        link.download = getFileName(document.fileUrl);
        link.click();
        URL.revokeObjectURL(blobUrl);
        return;
      }

      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
    } catch (openError) {
      toast.error(
        openError.response?.data?.error || 'Could not open document.'
      );
    }
  };

  const handleDeleteDocument = async () => {
    if (!documentToDelete) return;

    setIsDeleting(true);
    try {
      await api.delete(`/documents/${documentToDelete.id}`);
      setDocumentToDelete(null);
      await mutate();
      toast.success('Document deleted.');
    } catch (deleteError) {
      toast.error(
        deleteError.response?.data?.error || 'Failed to delete document.'
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={`mx-auto max-w-7xl space-y-6 font-sans ${compact ? '' : 'pb-8'}`}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-100 bg-teal-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-teal-700">
            <FolderOpen className="h-4 w-4" />
            Medical repository
          </div>
          <h1
            className={`${compact ? 'text-2xl' : 'text-3xl'} font-extrabold tracking-tight text-slate-900`}
          >
            {title}
          </h1>
          <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-slate-500 md:text-base">
            {subtitle}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 shadow-sm">
          {documents.length} saved file{documents.length === 1 ? '' : 's'}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-700">
          Failed to load documents.
        </div>
      )}

      {!readOnly && (
        <form
          onSubmit={handleUpload}
          className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg shadow-slate-200/40"
        >
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-2xl bg-teal-50 p-3 text-teal-600">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                Upload Document
              </h2>
              <p className="text-sm font-medium text-slate-500">
                PDF, JPG, PNG, or WEBP up to 10MB.
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Document Name
              </label>
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="e.g. CBC report April"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition-colors hover:border-teal-300 focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="lg:col-span-3">
              <label className="mb-2 block text-sm font-bold text-slate-700">
                Category
              </label>
              <select
                value={form.documentType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    documentType: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-800 outline-none transition-colors hover:border-teal-300 focus:ring-2 focus:ring-teal-500"
              >
                {documentCategories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="lg:col-span-3">
              <label className="mb-2 block text-sm font-bold text-slate-700">
                File
              </label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    file: event.target.files?.[0] || null,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-teal-50 file:px-3 file:py-1.5 file:font-bold file:text-teal-700 hover:border-teal-300"
              />
            </div>

            <div className="flex items-end lg:col-span-2">
              <button
                type="submit"
                disabled={isUploading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 font-extrabold text-white transition-colors hover:bg-teal-700 disabled:opacity-60"
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {isUploading ? 'Uploading' : 'Upload'}
              </button>
            </div>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <div
              key={item}
              className="h-36 animate-pulse rounded-3xl bg-slate-100"
            />
          ))}
        </div>
      ) : documents.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <FolderOpen className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <h2 className="text-xl font-extrabold text-slate-900">
            No documents found
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-500">
            {readOnly
              ? 'This patient has not uploaded any documents yet.'
              : 'Upload your first medical document to get started.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {documentsByCategory.map((category) => (
            <section key={category.value} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-extrabold text-slate-900">
                  {category.label}
                </h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                  {category.documents.length}
                </span>
              </div>

              {category.documents.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-sm font-semibold text-slate-400">
                  No files in this category.
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {category.documents.map((document) => {
                    const isImage = /\.(jpg|jpeg|png|webp)$/i.test(
                      document.fileUrl
                    );
                    return (
                      <article
                        key={document.id}
                        className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                      >
                        <div className="mb-4 flex items-start gap-3">
                          <div className="rounded-2xl bg-slate-50 p-3 text-teal-600">
                            {isImage ? (
                              <Image className="h-5 w-5" />
                            ) : (
                              <FileText className="h-5 w-5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h3 className="truncate text-base font-extrabold text-slate-900">
                              {document.title}
                            </h3>
                            <p className="mt-1 text-xs font-bold text-slate-500">
                              {formatDate(document.createdAt)}
                            </p>
                          </div>
                        </div>

                        <div className="mb-4 truncate rounded-xl bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
                          {getFileName(document.fileUrl)}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openDocument(document)}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                          >
                            <Eye className="h-4 w-4" />
                            Preview
                          </button>
                          <button
                            type="button"
                            onClick={() => openDocument(document, true)}
                            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 hover:bg-slate-50"
                            aria-label="Download document"
                          >
                            <Download className="h-4 w-4" />
                          </button>
                          {!readOnly && (
                            <button
                              type="button"
                              onClick={() => setDocumentToDelete(document)}
                              className="inline-flex items-center justify-center rounded-xl border border-rose-200 bg-white p-2.5 text-rose-600 hover:bg-rose-50"
                              aria-label="Delete document"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          ))}
        </div>
      )}

      <ConfirmationModal
        isOpen={Boolean(documentToDelete)}
        onClose={() => setDocumentToDelete(null)}
        onConfirm={handleDeleteDocument}
        isLoading={isDeleting}
        type="danger"
        title="Delete Document?"
        message="This removes the document metadata and the uploaded file from storage."
        confirmText="Delete Document"
      />
    </div>
  );
};

export default MedicalDocuments;
