import React, { useState, useEffect, useRef } from 'react';

function App() {
  const [reports, setReports] = useState([]);
  const [lastId, setLastId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchReports = async (isLoadMore = false) => {
    if (loading || (!hasMore && isLoadMore)) return;
    setLoading(true);
    try {
      const url = `/api/get-list${isLoadMore && lastId ? `?last_id=${lastId}` : ''}`;
      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        if (isLoadMore) {
          setReports(prev => [...prev, ...json.data]);
        } else {
          setReports(json.data);
        }
        setLastId(json.next_last_id);
        if (!json.next_last_id) setHasMore(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhoto(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !description || !photo) return alert('Please fill all fields');
    
    setSubmitting(true);
    const formData = new FormData();
    formData.append('reporter_name', name);
    formData.append('description', description);
    formData.append('photo', photo);

    try {
      const res = await fetch('/api/report', {
        method: 'POST',
        body: formData,
      });
      const json = await res.json();
      if (json.success) {
        alert('Report submitted successfully!');
        setName('');
        setDescription('');
        setPhoto(null);
        setPreview(null);
        // Refresh feed
        setHasMore(true);
        setLastId(null);
        fetchReports();
      } else {
        alert(json.message || 'Failed to submit report');
      }
    } catch (e) {
      alert('Error submitting report');
      console.error(e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600">Citizen Report</h1>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
            Deployed by: {import.meta.env.VITE_INFO_APP_OWNER || 'Local Dev'}
          </span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Form Section */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Submit a Report</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="John Doe"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  rows="3"
                  placeholder="What's the issue?"
                  required
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Photo Evidence</label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-500 transition relative overflow-hidden group cursor-pointer" onClick={() => document.getElementById('photo-upload').click()}>
                  <div className="space-y-1 text-center">
                    {preview ? (
                      <img src={preview} alt="Preview" className="mx-auto h-32 object-cover rounded" />
                    ) : (
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                    <div className="flex text-sm text-gray-600 justify-center">
                      <label htmlFor="photo-upload" className="relative cursor-pointer rounded-md bg-white font-medium text-blue-600 hover:text-blue-500">
                        <span>Upload a file</span>
                        <input id="photo-upload" name="photo-upload" type="file" className="sr-only" accept="image/*" onChange={handleFileChange} />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={submitting}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition"
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </form>
          </div>
        </div>

        {/* Feed Section */}
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-gray-800">Recent Reports</h2>
          
          <div className="space-y-6">
            {reports.map((report) => (
              <div key={report.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
                <div className="md:flex">
                  <div className="md:flex-shrink-0 w-full md:w-48 h-48">
                    <img className="h-full w-full object-cover" src={report.photo_url} alt="Report evidence" />
                  </div>
                  <div className="p-6 flex flex-col justify-between">
                    <div>
                      <div className="uppercase tracking-wide text-sm text-blue-600 font-semibold mb-1">
                        Report #{report.id}
                      </div>
                      <p className="block mt-1 text-lg leading-tight font-medium text-gray-900">
                        {report.description}
                      </p>
                    </div>
                    <div className="mt-4 flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                          {report.reporter_name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {report.reporter_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(report.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {reports.length === 0 && !loading && (
              <div className="text-center py-10 text-gray-500">
                No reports found. Be the first to report an issue!
              </div>
            )}
          </div>

          {hasMore && reports.length > 0 && (
            <div className="text-center mt-8">
              <button 
                onClick={() => fetchReports(true)}
                disabled={loading}
                className="px-6 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

export default App;
