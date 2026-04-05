import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";

export default function RequestsList() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [textFilter, setTextFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("");


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

 //Filter based on text
  const normalizedFilter = textFilter.trim().toLowerCase();

  const filteredRequests = requests.filter((request) => {
  const matchesText = !normalizedFilter || 
    [request.title, request.description, request.location_text, request.category, request.user?.name]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(normalizedFilter);
    //Filter based on urgency
  const matchesUrgency = !urgencyFilter || request.urgency === urgencyFilter;
  //Filter based on category
  const matchesCategory = !categoryFilter || request.category === categoryFilter;

  return matchesText && matchesUrgency && matchesCategory;
});


  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-blue-700 text-center mb-8">רשימת בקשות</h1>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <input
              type="text"
              placeholder="חיפוש לפי טקסט..."
              value={textFilter}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTextFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
            />
            <select
                value={urgencyFilter}
                onChange={(e) => setUrgencyFilter(e.target.value)}
                className="w-full sm:w-48 border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">דחיפות</option>
            <option value="high">דחיפות גבוהה</option>
            <option value="medium">דחיפות בינונית</option>
            <option value="low">דחיפות נמוכה</option>
          </select>
          <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full sm:w-48 border border-gray-300 rounded-lg px-3 py-2"
          >
            <option value="">בחר קטגוריה</option>
                  <option value="shopping">קניות</option>
                  <option value="elderly_care">סיוע לקשישים</option>
                  <option value="moving">הובלה</option>
                  <option value="repairs">תיקונים</option>
                  <option value="pet_care">טיפול בחיות</option>
                  <option value="other">אחר</option>
          </select>
          </div>

          {loading ? (
            <p className="text-center text-gray-500">טוען</p>
          ) : requests.length === 0 ? (
            <p className="text-center text-gray-500">אין בקשות להצגה</p>
          ) : (
            <ul className="space-y-4">
              {filteredRequests.map((request) => (
                <li key={request.id} className="border border-gray-200 rounded-lg p-5 hover:shadow-sm transition-shadow">
                  {/*Go to specific request page*/}
                  <Link
                    to={`/requests/${request.id}`}
                    className="block cursor-pointer focus:outline-none"
                  >
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
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
