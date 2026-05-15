import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { Circle, GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";


export default function RequestsList() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [textFilter, setTextFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [urgencyFilter, setUrgencyFilter] = useState<string>("");
  const [radiusFilter, setRadiusFilter] = useState<number>(50);
  const [userCoords, setUserCoords] = useState<userCords | null>(null);

  //Get current user from context
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const fetchHomeLocation = async () => {
      const response = await api.get(`/users/${user.id}`);

      const { latitude, longitude } = response.data;

      setUserCoords({ userLat: Number(latitude), userLng: Number(longitude) });
    };

    fetchHomeLocation();
  }, [user]);

  //for navigation to request details page on marker click
  const navigate = useNavigate();
  //listen to google maps api load
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
    language: 'he',
  });
  //Use geolocation api to get user coordinates
  type userCords = {
    userLat: number;
    userLng: number;
  }
  // //Get user coordinates on component mount only
  // useEffect(() => {
  //   if (navigator.geolocation) {
  //     navigator.geolocation.getCurrentPosition(
  //       (position) => {
  //         console.log("Geolocation success:", position.coords.latitude, position.coords.longitude);
  //         setUserCoords({
  //           userLat: position.coords.latitude,
  //           userLng: position.coords.longitude,
  //         });
  //       },
  //       (error) => {
  //         console.error("Geolocation error:", error);
  //       }
  //     );
  //   } else {
  //     console.error("Geolocation not supported");
  //   }
  // }, []);

  // // Log when userCoords updates
  // useEffect(() => {
  //   console.log("userCoords updated:", userCoords);
  // }, [userCoords]);

  const center = { lat: userCoords ? userCoords.userLat : 31.117, lng: userCoords ? userCoords.userLng : 35.0818 }; //Users location or center of tel aviv


  useEffect(() => {
    api.get("/requests", {
      params: {
        radius: radiusFilter
      }
    })
      .then((response) => {
        setRequests(response.data.data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching requests:", error);
        setLoading(false);
      });
  }, [radiusFilter]);

  // // Calculate distance between two coordinates using Haversine formula
  // function toRadians(deg: number) {
  //   return (deg * Math.PI) / 180;
  // }

  // function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  //   const R = 6371; // Earth radius in km
  //   const dLat = toRadians(lat2 - lat1);
  //   const dLng = toRadians(lng2 - lng1);

  //   const a =
  //     Math.sin(dLat / 2) ** 2 +
  //     Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;

  //   return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  // }

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
    //Filter based on radius
    // const matchesRadius = !radiusFilter || !userCoords ||
    //   distanceKm(
    //     userCoords.userLat,
    //     userCoords.userLng,
    //     Number(request.latitude),
    //     Number(request.longitude)
    //   ) <= radiusFilter;

    return matchesText && matchesUrgency && matchesCategory;
  });

  //Map only requests with valid coordinates
  const markerRequests = filteredRequests
    .map((request) => ({
      id: request.id,
      title: request.title,
      lat: Number(request.latitude),
      lng: Number(request.longitude),
    }))
    .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng));

  //console.log("markers count:", markerRequests.length, markerRequests);

  return (
    <div className="flex gap-6" dir="ltr">
      <div className="min-h-screen  bg-gray-50 py-10 px-4 flex-1" dir="rtl">
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
              <div className="relative w-full sm:w-48">
                <label
                  className="
                  absolute
                  -top-2
                  left-2
                  bg-white
                  px-1
                  text-xs
                  text-gray-500
                "
                >
                  רדיוס בקילומטרים
                </label>

                <input
                  type="number"
                  value={radiusFilter}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setRadiusFilter(Number(e.target.value))
                  }
                  className="
                    w-full 
                    sm:w-48
                    border
                    border-gray-300
                    rounded-lg      
                    px-3
                    py-2
                    focus:border-gray-500
                "
                />
              </div>
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

            <div className="flex justify-center mb-6">
              <button
                onClick={() => navigate("/requests/new")}
                className="w-full sm:w-auto bg-blue-600 text-white rounded-lg px-4 py-2 hover:bg-blue-700 transition-colors"
              >
                בקשה חדשה
              </button>
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
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${request.urgency === 'high' ? 'bg-red-100 text-red-700' :
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
                    <p className="text-gray-500 text-xs mt-1">פורסם על ידי: {request.user?.name}</p>
                  </li>
                ))}
              </ul>
            )}

          </div>
        </div>

      </div>

      <div className="flex-1 sticky top-4 self-start py-10 pr-4">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 sm:p-8">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '70vh', borderRadius: '8px' }}
              center={center}
              zoom={15}
            >
              {userCoords && (
                <Marker
                  position={{ lat: userCoords.userLat, lng: userCoords.userLng }}
                  title="Home"
                  icon={{
                    url: '/homeFavicon.svg',
                    scaledSize: new window.google.maps.Size(40, 40),
                  }}
                  options={{
                    cursor: 'pointer',
                  }}
                />
              )}
              {userCoords && <Circle
                center={{
                  lat: userCoords.userLat,
                  lng: userCoords.userLng,
                }}
                radius={radiusFilter * 1000}
                options={{
                  fillColor: "#a6b6c6",
                  fillOpacity: 0.2,
                  strokeColor: "#73889c",
                  strokeOpacity: 0.8,
                  strokeWeight: 2,
                }}
              />}
              {markerRequests.map((request) => (
                <Marker
                  key={request.id}
                  position={{ lat: request.lat, lng: request.lng }}
                  title={request.title}
                  onClick={() => navigate(`/requests/${request.id}`)}
                  options={{ cursor: 'pointer' }}
                />
              ))}
            </GoogleMap>
          ) : null}
        </div>
      </div>

    </div>
  );
}
