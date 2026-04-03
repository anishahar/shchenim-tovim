import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api";

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (id) {
      api.get(`/requests/${id}`)
        .then((response) => {
          setRequest(response.data);
          setLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching request:", error);
          setLoading(false);
        });
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4 flex items-center justify-center">
        <p className="text-gray-500">טוען</p>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 py-10 px-4 flex items-center justify-center">
        <p className="text-gray-500">בקשה לא נמצאה</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-blue-700">{request.title}</h1>
            <span className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap ${
              request.urgency === 'high' ? 'bg-red-100 text-red-700' :
              request.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
              'bg-green-100 text-green-700'
            }`}>
              {request.urgency === 'high' ? 'דחיפות גבוהה' :
               request.urgency === 'medium' ? 'דחיפות בינונית' : 'דחיפות נמוכה'}
            </span>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed mb-6">{request.description}</p>
          <div className="flex flex-wrap gap-4 text-xs text-gray-400 mb-6">
            {request.location_text && <span>📍 {request.location_text}</span>}
            {request.category && <span>🏷️ {request.category}</span>}
            {request.created_at && (
              <span>🕐 {new Date(request.created_at).toLocaleDateString('he-IL')}</span>
            )}
          </div>
          {request.image_url && (
            <div className="mb-6">
              <img
                src={request.image_url}
                alt={request.title}
                className="w-full rounded-lg border border-gray-100"
              />
            </div>
          )}
          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors">
            אני אעזור
          </button>

        </div>
      </div>
    </div>
  );
}
