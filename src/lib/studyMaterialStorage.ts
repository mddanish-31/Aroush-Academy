/**
 * AROUSH ACADEMY — Study Material Storage Service & Client Demo Adapter
 *
 * ARCHITECTURAL BOUNDARY:
 * Provides a clean storage interface for study material uploads and downloads.
 * In this frontend-only phase, an honest local demo adapter simulates file persistence
 * using browser Object URLs and in-memory caches, strictly distinguishing simulated
 * local session storage from production cloud object storage (e.g. AWS S3, Cloudflare R2, GCS).
 */

import type {
  UserRole,
  StudyMaterialItem,
  StudyMaterialType,
  MaterialPublicationStatus,
} from "@/types";
import {
  DEMO_STORAGE_KEYS,
  getDemoStorage,
  setDemoStorage,
} from "@/lib/demoStorage";
import { SAMPLE_MATERIALS } from "@/data/dashboardModulesData";

export const DEFAULT_STUDY_MATERIAL_TYPES: string[] = [
  "PDF Notes",
  "Formula Sheet",
  "Worksheet",
  "Practice Paper",
  "Assignment",
  "Handout",
];

// Supported Extensions and MIME types for Coaching Academy workflow
export const SUPPORTED_FILE_EXTENSIONS = [
  ".pdf",
  ".docx",
  ".pptx",
  ".jpg",
  ".jpeg",
  ".png",
] as const;

export const SUPPORTED_MIME_TYPES: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/jpg": [".jpg", ".jpeg"],
  "image/png": [".png"],
};

// Configurable maximum file size (15 MB default for high-yield PDFs, worksheets & presentations)
export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15 MB

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates a file against allowed extensions, MIME types, and file size ceiling.
 */
export function validateStudyMaterialFile(
  file: File,
  maxSizeBytes = MAX_FILE_SIZE_BYTES
): FileValidationResult {
  if (!file) {
    return { isValid: false, error: "No file was selected." };
  }

  // Size validation
  if (file.size > maxSizeBytes) {
    const maxMB = (maxSizeBytes / (1024 * 1024)).toFixed(0);
    const actualMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      isValid: false,
      error: `File size (${actualMB} MB) exceeds maximum allowed limit of ${maxMB} MB.`,
    };
  }

  // Extension validation
  const lowerName = file.name.toLowerCase();
  const hasValidExtension = SUPPORTED_FILE_EXTENSIONS.some((ext) =>
    lowerName.endsWith(ext)
  );

  if (!hasValidExtension) {
    return {
      isValid: false,
      error: `Unsupported file format "${file.name}". Supported formats: PDF, DOCX, PPTX, JPG, JPEG, PNG.`,
    };
  }

  // MIME type validation (if provided by browser)
  if (file.type && !SUPPORTED_MIME_TYPES[file.type]) {
    // Some Windows machines report application/x-zip-compressed for docx/pptx or empty
    const isSpecialOfficeType =
      (lowerName.endsWith(".docx") || lowerName.endsWith(".pptx")) &&
      (file.type.includes("document") ||
        file.type.includes("presentation") ||
        file.type.includes("zip") ||
        file.type === "");

    if (!isSpecialOfficeType) {
      return {
        isValid: false,
        error: `File MIME type "${file.type}" is not recognized as a permitted document or image format.`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Formats byte size into human-readable representation.
 */
export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "0 KB";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export interface UploadStudyMaterialOptions {
  file: File;
  metadata: {
    title: string;
    subject: string;
    classGrade: string;
    batchName?: string;
    type: StudyMaterialType;
    description?: string;
    teacherId: string;
    uploadedBy: string;
    status: MaterialPublicationStatus;
  };
}

export interface UploadStudyMaterialResult {
  success: boolean;
  item?: StudyMaterialItem;
  error?: string;
  isSimulated: boolean;
  storageNotice: string;
}

// IndexedDB configuration for client-side binary persistence
const DB_NAME = "aroush_study_materials_db";
const DB_VERSION = 1;
const STORE_NAME = "files";

interface StoredFileRecord {
  id: string; // materialId
  fileName: string;
  fileType: string;
  blob: Blob;
  updatedAt: number;
}

function openMaterialsDB(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function persistBinaryFile(
  id: string,
  file: Blob,
  fileName: string,
  fileType: string
): Promise<boolean> {
  const db = await openMaterialsDB();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const record: StoredFileRecord = {
        id,
        fileName,
        fileType,
        blob: file,
        updatedAt: Date.now(),
      };
      const req = store.put(record);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

export async function getBinaryFile(id: string): Promise<StoredFileRecord | null> {
  const db = await openMaterialsDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve((req.result as StoredFileRecord) || null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function deleteBinaryFile(id: string): Promise<boolean> {
  const db = await openMaterialsDB();
  if (!db) return false;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

/**
 * Normalizes a subject name by splitting compound terms (e.g., "Physics & Chemistry").
 */
export function normalizeSubject(s: string): string[] {
  return s
    .toLowerCase()
    .split(/&|,|\band\b|\/|\+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * Checks whether a material's subject safely matches an enrolled/assigned candidate subject.
 * Eliminates accidental substring matches while safely honoring compound subjects.
 */
export function subjectsMatch(matSubjRaw: string, candidateSubjRaw: string): boolean {
  const m1 = (matSubjRaw || "").trim().toLowerCase();
  const c1 = (candidateSubjRaw || "").trim().toLowerCase();
  if (!m1 || !c1) return false;
  if (m1 === c1) return true;

  const matParts = normalizeSubject(matSubjRaw);
  const candParts = normalizeSubject(candidateSubjRaw);

  return matParts.some((mp) => candParts.includes(mp));
}

/**
 * Storage Service Interface
 */
export interface StudyMaterialStorageService {
  getMaterials(): StudyMaterialItem[];
  saveMaterial(item: StudyMaterialItem): StudyMaterialItem[];
  deleteMaterial(id: string): StudyMaterialItem[];
  uploadFile(options: UploadStudyMaterialOptions): Promise<UploadStudyMaterialResult>;
  downloadFile(item: StudyMaterialItem): Promise<boolean>;
  hasActiveSessionFile(id: string): boolean;
  getFileUrl(id: string): string | null;
  hydrateStoredFiles(): Promise<string[]>;
  getAvailableFileIds(): string[];
}

// In-memory runtime cache for client-side blob URLs during active browser session
const clientFileBlobMap = new Map<string, { blob: Blob; url: string; fileName: string }>();

/**
 * Local Demo Storage Adapter
 *
 * Strictly client-side: Uses shared canonical storage key for record persistence,
 * creates native browser Object URLs for direct in-tab viewing and downloading,
 * and maintains honest awareness of session binary boundaries with IndexedDB persistence.
 */
export const demoStudyMaterialStorage: StudyMaterialStorageService = {
  getMaterials(): StudyMaterialItem[] {
    return getDemoStorage<StudyMaterialItem[]>(
      DEMO_STORAGE_KEYS.STUDY_MATERIALS,
      SAMPLE_MATERIALS
    );
  },

  saveMaterial(item: StudyMaterialItem): StudyMaterialItem[] {
    const current = this.getMaterials();
    const existingIndex = current.findIndex((m) => m.id === item.id);
    let next: StudyMaterialItem[];
    if (existingIndex >= 0) {
      next = [...current];
      next[existingIndex] = item;
    } else {
      next = [item, ...current];
    }
    setDemoStorage(DEMO_STORAGE_KEYS.STUDY_MATERIALS, next);
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("aroush-demo-storage-change", {
          detail: { key: DEMO_STORAGE_KEYS.STUDY_MATERIALS, value: next },
        })
      );
    }
    return next;
  },

  deleteMaterial(id: string): StudyMaterialItem[] {
    const current = this.getMaterials();
    const next = current.filter((m) => m.id !== id);
    setDemoStorage(DEMO_STORAGE_KEYS.STUDY_MATERIALS, next);
    clientFileBlobMap.delete(id);
    deleteBinaryFile(id).catch(() => {});
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("aroush-demo-storage-change", {
          detail: { key: DEMO_STORAGE_KEYS.STUDY_MATERIALS, value: next },
        })
      );
    }
    return next;
  },

  hasActiveSessionFile(id: string): boolean {
    return clientFileBlobMap.has(id);
  },

  getFileUrl(id: string): string | null {
    return clientFileBlobMap.get(id)?.url || null;
  },

  getAvailableFileIds(): string[] {
    return Array.from(clientFileBlobMap.keys());
  },

  async hydrateStoredFiles(): Promise<string[]> {
    if (typeof window === "undefined" || !window.indexedDB) {
      return Array.from(clientFileBlobMap.keys());
    }
    const materials = this.getMaterials();
    for (const mat of materials) {
      if (mat.hasPhysicalFile && !clientFileBlobMap.has(mat.id)) {
        const stored = await getBinaryFile(mat.id);
        if (stored && stored.blob) {
          const url = URL.createObjectURL(stored.blob);
          clientFileBlobMap.set(mat.id, {
            blob: stored.blob,
            url,
            fileName: stored.fileName || mat.fileName || "document.pdf",
          });
        }
      }
    }
    return Array.from(clientFileBlobMap.keys());
  },

  async uploadFile(options: UploadStudyMaterialOptions): Promise<UploadStudyMaterialResult> {
    const { file, metadata } = options;

    const validation = validateStudyMaterialFile(file);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
        isSimulated: true,
        storageNotice: "Validation failed before local upload simulation.",
      };
    }

    try {
      const materialId = `mat-up-${Date.now()}`;
      let fileUrl = "";

      if (typeof window !== "undefined" && typeof URL !== "undefined") {
        fileUrl = URL.createObjectURL(file);
        clientFileBlobMap.set(materialId, {
          blob: file,
          url: fileUrl,
          fileName: file.name,
        });
        // Persist binary bytes in IndexedDB asynchronously
        persistBinaryFile(materialId, file, file.name, file.type).catch(() => {});
      }

      const item: StudyMaterialItem = {
        id: materialId,
        title: metadata.title.trim(),
        subject: metadata.subject,
        classGrade: metadata.classGrade,
        batchName: metadata.batchName || "All Batches in this Class",
        type: metadata.type,
        size: formatFileSize(file.size),
        uploadedBy: metadata.uploadedBy,
        teacherId: metadata.teacherId,
        date: new Date().toISOString().split("T")[0],
        createdAt: new Date().toISOString(),
        description: metadata.description?.trim() || undefined,
        status: metadata.status,
        fileName: file.name,
        fileType: file.type || file.name.split(".").pop() || "application/octet-stream",
        fileSizeBytes: file.size,
        fileUrl,
        hasPhysicalFile: true,
        isSimulatedUpload: true,
        storageRef: `session-local://${materialId}/${encodeURIComponent(file.name)}`,
      };

      // Persist directly to canonical shared storage collection
      this.saveMaterial(item);

      return {
        success: true,
        item,
        isSimulated: true,
        storageNotice:
          "File registered in client demo session storage. Production cloud persistence requires backend API integration.",
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Failed to process file locally.",
        isSimulated: true,
        storageNotice: "Local browser file processing failed.",
      };
    }
  },

  async downloadFile(item: StudyMaterialItem): Promise<boolean> {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return false;
    }

    if (!item.hasPhysicalFile || !item.fileName) {
      return false;
    }

    let downloadUrl = clientFileBlobMap.get(item.id)?.url;

    // If not in runtime cache, attempt retrieval from IndexedDB
    if (!downloadUrl) {
      const stored = await getBinaryFile(item.id);
      if (stored && stored.blob) {
        downloadUrl = URL.createObjectURL(stored.blob);
        clientFileBlobMap.set(item.id, {
          blob: stored.blob,
          url: downloadUrl,
          fileName: stored.fileName || item.fileName,
        });
      }
    }

    if (!downloadUrl) {
      return false;
    }

    try {
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = item.fileName || `${item.title}.pdf`;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    } catch (e) {
      console.error("[StudyMaterialStorage] Download failed:", e);
      return false;
    }
  },
};

export interface MaterialVisibilityContext {
  student?: {
    id: string;
    classGrade: string;
  } | null;
  enrolledSubjects?: string[];
  enrolledBatches?: string[];
  teacherId?: string;
  teacherAssignedSubjects?: string[];
}

/**
 * Single authoritative visibility selector for materials across all 4 portal roles.
 * Validates role-based boundaries, drafts hiding, class grade match, subject enrollment,
 * and batch-level scoping.
 */
export function isMaterialVisibleToRole(
  material: StudyMaterialItem,
  role: UserRole,
  context: MaterialVisibilityContext
): boolean {
  if (role === "academy-admin") {
    return true;
  }

  if (role === "teacher") {
    // Teacher sees materials if they are the author OR if subject matches assigned subjects
    if (context.teacherId && material.teacherId === context.teacherId) {
      return true;
    }
    if (context.teacherAssignedSubjects && context.teacherAssignedSubjects.length > 0) {
      return context.teacherAssignedSubjects.some((assigned) =>
        subjectsMatch(material.subject || "", assigned)
      );
    }
    return false;
  }

  if (role === "student" || role === "parent") {
    // Drafts are strictly hidden from students and parents
    if (material.status === "draft") {
      return false;
    }
    if (!context.student) {
      return false;
    }
    // Class match check (case-insensitive & trimmed)
    const matClass = (material.classGrade || "").trim().toLowerCase();
    const stdClass = (context.student.classGrade || "").trim().toLowerCase();
    if (matClass && stdClass && matClass !== stdClass) {
      return false;
    }
    // Subject enrollment check (handles compound subjects safely, avoids accidental substring match)
    if (context.enrolledSubjects && context.enrolledSubjects.length > 0) {
      const isEnrolled = context.enrolledSubjects.some((enrolledSubj) =>
        subjectsMatch(material.subject || "", enrolledSubj)
      );
      if (!isEnrolled) {
        return false;
      }
    } else {
      return false;
    }
    // Batch scoping check: if material is restricted to a specific batch, student must be enrolled in that batch
    const rawBatch = (material.batchName || "").trim();
    const isUnscopedBatch =
      !rawBatch ||
      rawBatch.toLowerCase() === "all" ||
      rawBatch.toLowerCase() === "all batches" ||
      rawBatch.toLowerCase() === "all batches in class" ||
      rawBatch.toLowerCase() === "all batches in this class" ||
      rawBatch.toLowerCase().startsWith("all batches");

    if (!isUnscopedBatch) {
      if (
        !context.enrolledBatches ||
        !context.enrolledBatches.some((b) => b.trim().toLowerCase() === rawBatch.toLowerCase())
      ) {
        return false;
      }
    }
    return true;
  }

  return false;
}

/**
 * Single authoritative management permission check for editing, publishing, deleting materials.
 * Academy Admin can manage all. Teachers can manage materials within assigned subjects/classes or own uploads.
 */
export function canManageMaterial(
  material: StudyMaterialItem,
  role: UserRole,
  currentTeacherId?: string,
  teacherAssignedSubjects?: string[]
): boolean {
  if (role === "academy-admin") return true;
  if (role === "teacher") {
    if (currentTeacherId && material.teacherId === currentTeacherId) return true;
    if (teacherAssignedSubjects && teacherAssignedSubjects.length > 0) {
      return teacherAssignedSubjects.some((assigned) =>
        subjectsMatch(material.subject || "", assigned)
      );
    }
  }
  return false;
}

