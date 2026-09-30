import { useEffect, useRef, useState } from 'react';
import { resolveFileUrl } from '../api/client';

/** Read a File as a base64 data URL (fallback when a page posts JSON). */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read the selected file.'));
    reader.readAsDataURL(file);
  });
}

/**
 * File input + live preview.  Returns the chosen File through onChange()
 * so the caller can send it as multipart/form-data.
 */
export default function ImageUpload({
  label = 'Image',
  value = null,
  existingUrl = null,
  onChange,
  onClear,
  accept = 'image/*',
  required = false,
  help,
  maxSizeMb = 5,
  id,
}) {
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!value) {
      setPreview(null);
      return undefined;
    }
    const url = URL.createObjectURL(value);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [value]);

  const shown = preview || resolveFileUrl(existingUrl);

  function handleFile(event) {
    const file = event.target.files?.[0];
    setError('');
    if (!file) {
      onChange?.(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      return;
    }
    if (maxSizeMb && file.size > maxSizeMb * 1024 * 1024) {
      setError(`Images must be smaller than ${maxSizeMb} MB.`);
      return;
    }
    onChange?.(file);
  }

  function clear() {
    setError('');
    if (inputRef.current) inputRef.current.value = '';
    onChange?.(null);
    onClear?.();
  }

  const inputId = id || `image-upload-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="form-field image-upload">
      <label className="field-label" htmlFor={inputId}>
        {label}
        {required ? <span className="required"> *</span> : null}
      </label>

      <div className="image-upload-row">
        <div className="image-preview">
          {shown ? (
            <img src={shown} alt="Selected attachment preview" />
          ) : (
            <span className="image-preview-empty">No image</span>
          )}
        </div>

        <div className="image-upload-controls">
          <input
            id={inputId}
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleFile}
            className="file-input"
          />
          {shown ? (
            <button type="button" className="btn btn-ghost btn-sm" onClick={clear}>
              Remove image
            </button>
          ) : null}
          <p className="field-hint">{help || `JPG or PNG, up to ${maxSizeMb} MB.`}</p>
          {error ? <p className="field-error">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
