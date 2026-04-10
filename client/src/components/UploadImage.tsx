import { useState } from 'react';
import api from '../api';

type UploadImageProps = {
  onUploadSuccess: (url: string) => void;
  onUploadError?: (error: string) => void;
};

export default function UploadImage({ onUploadSuccess, onUploadError }: UploadImageProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      const error = 'אנא בחר קובץ תמונה';
      onUploadError?.(error);
      alert(error);
      return;
    }

    // Validate file size (20MB)
    if (file.size > 20 * 1024 * 1024) {
      const error = 'גודל הקובץ חייב להיות קטן מ-20MB';
      onUploadError?.(error);
      alert(error);
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onUploadSuccess(response.data.url);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'שגיאה בהעלאת התמונה';
      onUploadError?.(errorMessage);
      alert(errorMessage);
      setPreview(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={uploading}
        className="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-md file:border-0
          file:text-sm file:font-medium
          file:bg-blue-50 file:text-blue-700
          hover:file:bg-blue-100
          disabled:opacity-50 disabled:cursor-not-allowed"
      />

      {uploading && (
        <p className="text-sm text-blue-600">מעלה תמונה...</p>
      )}

      {preview && !uploading && (
        <div className="mt-2">
          <img
            src={preview}
            alt="Preview"
            className="max-w-xs max-h-48 rounded-md border border-gray-300"
          />
        </div>
      )}
    </div>
  );
}
