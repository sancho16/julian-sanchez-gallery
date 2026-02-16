import React, { useState, useEffect } from 'react';

export default function Admin() {
  const [videos, setVideos] = useState([]);
  const [uploading, setUploading] = useState(false);

  const loadVideos = () => {
    fetch('/api/videos')
      .then(res => res.json())
      .then(setVideos);
  };

  useEffect(() => {
    loadVideos();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    setUploading(true);
    
    try {
      await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      loadVideos();
      e.target.reset();
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename) => {
    if (!confirm('Delete this video?')) return;
    await fetch(`/api/videos/${filename}`, { method: 'DELETE' });
    loadVideos();
  };

  const handleUpdateDescription = async (filename, description) => {
    await fetch(`/api/videos/${filename}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description })
    });
  };

  return (
    <div className="container">
      <h1>Admin Panel</h1>
      
      <form onSubmit={handleUpload} className="upload-form">
        <input type="file" name="video" accept="video/*" required />
        <input type="text" name="description" placeholder="Video description" />
        <button type="submit" disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload Video'}
        </button>
      </form>

      <div className="admin-list">
        {videos.map(video => (
          <div key={video.filename} className="admin-item">
            <video src={video.url} className="admin-preview" />
            <div className="admin-details">
              <strong>{video.filename}</strong>
              <input
                type="text"
                defaultValue={video.description}
                onBlur={(e) => handleUpdateDescription(video.filename, e.target.value)}
                placeholder="Add description"
              />
              <button onClick={() => handleDelete(video.filename)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
