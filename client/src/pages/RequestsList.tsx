import { useEffect, useState } from "react";
import api from "../api";

export default function RequestsList() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.get("/requests")
      .then((response) => {
        setRequests(response.data.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching requests:", error);
        setLoading(false);
      });
  }, []);


  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-blue-700 text-center mb-8">רשימת בקשות</h1>

          {loading ? (
            <p className="text-center text-gray-500">טוען...</p>
          ) : requests.length === 0 ? (
            <p className="text-center text-gray-500">אין בקשות להצגה</p>
          ) : (
            <ul className="space-y-4">
              {requests.map((request) => (
                <li key={request.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-sm transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-lg font-semibold text-gray-800">{request.title}</h2>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      request.urgency === 'high' ? 'bg-red-100 text-red-700' :
                      request.urgency === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {request.urgency === 'high' ? 'דחיפות גבוהה' :
                       request.urgency === 'medium' ? 'דחיפות בינונית' : 'דחיפות נמוכה'}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{request.description}</p>
                  {request.location_text && (
                    <p className="text-gray-400 text-xs">📍 {request.location_text}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
