import FileViewer from 'react-file-viewer';

/**
 * Crisp file preview. PDFs are rendered with the browser's native PDF
 * engine via an <iframe> (sharp at any zoom, with built-in controls)
 * instead of react-file-viewer's low-resolution canvas rasterisation,
 * which looked blurry. Non-PDF types still fall back to react-file-viewer.
 */
export default function FilePreview({ filePath, fileName }) {
  const ext = (filePath.split('.').pop() || '').toLowerCase();

  if (ext === 'pdf') {
    return (
      <iframe
        src={filePath}
        title={fileName || 'PDF preview'}
        className="w-full h-full border-0"
      />
    );
  }

  return (
    <FileViewer
      fileType={ext}
      filePath={filePath}
      onError={(e) => console.error('Error viewing file:', e)}
    />
  );
}
