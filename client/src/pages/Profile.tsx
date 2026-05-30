import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import UploadImage from '../components/UploadImage';
import { validateCity, validateCityAndStreet, validateFullAddress } from '../utils/geocoding';
import api from '../api';

// Role display names in Hebrew
const ROLE_NAMES = {
  resident: 'דייר',
  house_committee: 'ועד בית',
  area_manager: 'מנהל אזור',
};

const CATEGORY_COLORS: Record<string, string> = {
  shopping:     'bg-sky-100 text-sky-700',
  elderly_care: 'bg-violet-100 text-violet-700',
  moving:       'bg-amber-100 text-amber-700',
  repairs:      'bg-orange-100 text-orange-700',
  pet_care:     'bg-emerald-100 text-emerald-700',
  other:        'bg-slate-100 text-slate-600',
};

const CATEGORY_LABELS: Record<string, string> = {
  shopping: 'קניות',
  elderly_care: 'סיוע לקשישים',
  moving: 'הובלה',
  repairs: 'תיקונים',
  pet_care: 'טיפול בחיות',
  other: 'אחר',
};

const URGENCY_LABELS: Record<string, string> = {
  high: 'דחיפות גבוהה',
  medium: 'דחיפות בינונית',
  low: 'דחיפות נמוכה',
};

const URGENCY_CLASSES: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
};

export default function Profile() {
  const { user: authUser, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [myRating, setMyRating] = useState<{ average: number; count: number } | null>(null);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [editingRequestId, setEditingRequestId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', urgency: '' });
  const [editLoading, setEditLoading] = useState(false);
  const [uploadResetKey, setUploadResetKey] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    role: '',
    // Support both old and new address formats
    address: '',        // Legacy field for display only
    city: '',
    street: '',
    streetNumber: '',
    apartment: '',
    avatarUrl: '',
  });

  // Fetch current user profile
  useEffect(() => {
    if (authUser?.id) {
      fetchProfile();
      fetchMyRequests();
      api.get(`/ratings/average/${authUser.id}`)
        .then((res) => setMyRating({ average: res.data.average, count: res.data.count }))
        .catch(() => {});
    }
  }, [authUser]);

  const fetchProfile = async () => {
    try {
      const response = await api.get(`/users/${authUser!.id}`);
      const data = response.data;
      if (data.city && data.street && data.streetNumber) {
        // New format - user has separate fields
        setFormData({
          name: data.name || '',
          phone: data.phone || '',
          email: data.email || '',
          role: data.role || '',
          address: '',
          city: data.city,
          street: data.street,
          streetNumber: data.streetNumber,
          apartment: data.apartment || '',
          avatarUrl: data.avatarUrl || '',
        });
      } else {
        // Legacy format - user only has address_text
        setFormData({
          name: data.name || '',
          phone: data.phone || '',
          email: data.email || '',
          role: data.role || '',
          address: data.addressText || '',
          city: '',
          street: '',
          streetNumber: '',
          apartment: '',
          avatarUrl: data.avatarUrl || '',
        });
      }
    } catch (err) {
      setError('שגיאה בטעינת הפרופיל');
    }
  };

  const fetchMyRequests = async () => {
    setRequestsLoading(true);
    try {
      const response = await api.get('/requests/my');
      setMyRequests(response.data);
    } catch (err) {
      // silently fail — not critical
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleDeleteRequest = async (id: number) => {
    try {
      await api.delete(`/requests/${id}`);
      await fetchMyRequests();
      setSuccess('הבקשה נמחקה בהצלחה');
    } catch (err) {
      setError('שגיאה במחיקת הבקשה');
    }
  };

  const startEditRequest = (request: any) => {
    setEditingRequestId(request.id);
    setEditForm({ title: request.title, description: request.description, urgency: request.urgency });
  };

  const handleSaveRequest = async (id: number) => {
    setEditLoading(true);
    try {
      await api.patch(`/requests/${id}`, {
        title: editForm.title,
        description: editForm.description,
        urgency: editForm.urgency,
      });
      setMyRequests((prev) =>
        prev.map((r) => r.id === id ? { ...r, ...editForm } : r)
      );
      setEditingRequestId(null);
    } catch (err) {
      setError('שגיאה בעדכון הבקשה');
    } finally {
      setEditLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      let updateData: any = {
        name: formData.name,
        phone: formData.phone,
        avatarUrl: formData.avatarUrl,
      };

      // Only validate and update if user has new format
      if (!formData.address && formData.city && formData.street && formData.streetNumber) {
        // Step 1: Validate city
        await validateCity(formData.city);

        // Step 2: Validate street in city
        await validateCityAndStreet(formData.city, formData.street);

        // Step 3: Validate full address
        const location = await validateFullAddress(
          formData.city,
          formData.street,
          formData.streetNumber
        );

        // Compose address_text
        const address_text = `${formData.street} ${formData.streetNumber}${formData.apartment ? ', דירה ' + formData.apartment : ''
          }, ${formData.city}`;

        updateData = {
          ...updateData,
          city: formData.city,
          street: formData.street,
          streetNumber: formData.streetNumber,
          apartment: formData.apartment || null,
          addressText: address_text,
          latitude: location.lat,
          longitude: location.lng,
        };
      }

      const response = await api.patch(`/users/${authUser!.id}`, updateData);
      const updatedData = response.data;

      // Update AuthContext so navbar shows new name immediately
      updateUser({
        name: updatedData.user.name,
        avatarUrl: updatedData.user.avatarUrl,
        phone: updatedData.user.phone,
      });

      setSuccess('הפרופיל עודכן בהצלחה!');
      setIsEditing(false);
      await fetchProfile(); // Refresh profile data
    } catch (err: any) {
      setError(err.message || 'שגיאה בעדכון הפרופיל');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    setSuccess('');
    fetchProfile(); // Reset form data
  };

  if (!authUser) {
    return (
      <div className="min-h-screen flex items-center justify-center" dir="rtl">
        <p className="text-gray-600">אנא התחבר כדי לצפות בפרופיל</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-teal-500 px-8 py-6">
            <div className="flex items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                {formData.avatarUrl ? (
                  <img
                    src={formData.avatarUrl}
                    alt={formData.name}
                    className="w-24 h-24 rounded-full border-4 border-white object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full border-4 border-white bg-teal-500 flex items-center justify-center text-white text-3xl font-bold">
                    {formData.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>

              {/* User Info */}
              <div className="flex-1 text-white">
                <h1 className="text-3xl font-bold">{formData.name}</h1>
                <p className="text-blue-100 mt-1">{formData.email}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-sm">
                  {ROLE_NAMES[formData.role as keyof typeof ROLE_NAMES]}
                </span>
                <span className="inline-block mt-2 mr-2 px-3 py-1 bg-white/20 rounded-full text-sm">
                  {myRating && myRating.count > 0
                    ? `★ ${myRating.average.toFixed(1)} (${myRating.count} דירוגים)`
                    : '★ לא מדורג'}
                </span>
              </div>

              {/* Edit Button */}
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
                >
                  ✏️ ערוך פרופיל
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Success/Error Messages */}
            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                {success}
              </div>
            )}

            {error && (
              <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {isEditing ? (
              /* Edit Mode */
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      שם מלא
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      מספר טלפון
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Show legacy single field OR new 4 fields */}
                {formData.address ? (
                  // Legacy user - show single read-only field
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                      כתובת
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      value={formData.address}
                      disabled
                      title="לעדכון הכתובת, אנא צור קשר עם התמיכה"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      כתובת זו נשמרה בפורמט הישן. לעדכון, אנא השתמש בטופס חדש.
                    </p>
                  </div>
                ) : (
                  // New user - show 4 editable fields
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                        עיר
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-2">
                        רחוב
                      </label>
                      <input
                        type="text"
                        id="street"
                        name="street"
                        value={formData.street}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <label htmlFor="streetNumber" className="block text-sm font-medium text-gray-700 mb-2">
                        מספר בניין
                      </label>
                      <input
                        type="text"
                        id="streetNumber"
                        name="streetNumber"
                        value={formData.streetNumber}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                      />
                    </div>
                    <div>
                      <label htmlFor="apartment" className="block text-sm font-medium text-gray-700 mb-2">
                        דירה
                      </label>
                      <input
                        type="text"
                        id="apartment"
                        name="apartment"
                        value={formData.apartment}
                        onChange={handleChange}
                        placeholder="אופציונלי"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    תמונת פרופיל
                  </label>
                  <div className="flex items-start gap-3">
                    <UploadImage
                      key={uploadResetKey}
                      onUploadSuccess={(url) => setFormData({ ...formData, avatarUrl: url })}
                      onUploadError={(err) => setError('שגיאה בהעלאת התמונה')}
                    />
                    {formData.avatarUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, avatarUrl: '' });
                          setUploadResetKey((prev) => prev + 1);
                        }}
                        className="bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                      >
                        מחק תמונה
                      </button>
                    )}
                  </div>
                  {formData.avatarUrl && (
                    <img
                      src={formData.avatarUrl}
                      alt="Preview"
                      className="mt-3 w-32 h-32 rounded-lg object-cover border-2 border-gray-200"
                    />
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'שומר...' : 'שמור שינויים'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors disabled:cursor-not-allowed"
                  >
                    ביטול
                  </button>
                </div>
              </form>
            ) : (
              /* View Mode */
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">שם מלא</label>
                    <p className="text-lg text-gray-900">{formData.name}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      מספר טלפון
                    </label>
                    <p className="text-lg text-gray-900">{formData.phone || 'לא הוזן'}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">אימייל</label>
                    <p className="text-lg text-gray-900">{formData.email}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">תפקיד</label>
                    <p className="text-lg text-gray-900">
                      {ROLE_NAMES[formData.role as keyof typeof ROLE_NAMES]}
                    </p>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      כתובת מגורים
                    </label>
                    <p className="text-lg text-gray-900">
                      {formData.address
                        ? formData.address
                        : formData.city && formData.street && formData.streetNumber
                          ? `${formData.street} ${formData.streetNumber}${formData.apartment ? ', דירה ' + formData.apartment : ''}, ${formData.city}`
                          : 'לא הוזנה'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* My Open Requests */}
        <div className="mt-8 bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="px-8 py-5 border-b border-blue-100 bg-blue-50">
            <h2 className="text-xl font-bold text-gray-800 border-r-4 border-amber-500 pr-3">הבקשות הפתוחות שלי</h2>
          </div>
          <div className="p-6">
            {requestsLoading ? (
              <p className="text-center text-gray-500">טוען...</p>
            ) : myRequests.length === 0 ? (
              <p className="text-center text-gray-500">אין בקשות פתוחות</p>
            ) : (
              <ul className="space-y-4">
                {myRequests.map((request) => {
                  const isEditingThis = editingRequestId === request.id;
                  return (
                    <li key={request.id} className="border border-gray-100 rounded-xl border-r-4 border-r-blue-300 p-5 hover:shadow-md hover:border-blue-100 transition-all">
                      {isEditingThis ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">שם הבקשה</label>
                            <input
                              type="text"
                              value={editForm.title}
                              onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">תיאור</label>
                            <textarea
                              value={editForm.description}
                              onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                              rows={3}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">רמת דחיפות</label>
                            <select
                              value={editForm.urgency}
                              onChange={(e) => setEditForm({ ...editForm, urgency: e.target.value })}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="low">דחיפות נמוכה</option>
                              <option value="medium">דחיפות בינונית</option>
                              <option value="high">דחיפות גבוהה</option>
                            </select>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button
                              onClick={() => handleSaveRequest(request.id)}
                              disabled={editLoading}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:bg-blue-300"
                            >
                              {editLoading ? 'שומר...' : 'שמור'}
                            </button>
                            <button
                              onClick={() => setEditingRequestId(null)}
                              disabled={editLoading}
                              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium py-2 rounded-lg transition-colors"
                            >
                              ביטול
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-semibold text-gray-800">{request.title}</h3>
                            <div className="flex items-center gap-2">
                              {request.category && (
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[request.category] ?? 'bg-slate-100 text-slate-600'}`}>
                                  {CATEGORY_LABELS[request.category] ?? request.category}
                                </span>
                              )}
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${URGENCY_CLASSES[request.urgency] ?? 'bg-gray-100 text-gray-600'}`}>
                                {URGENCY_LABELS[request.urgency] ?? request.urgency}
                              </span>
                              <button
                                onClick={() => startEditRequest(request)}
                                className="text-blue-500 hover:text-blue-700 transition-colors text-sm px-2 py-1 rounded hover:bg-blue-50"
                                title="ערוך בקשה"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteRequest(request.id)}
                                className="text-red-500 hover:text-red-700 transition-colors text-sm px-2 py-1 rounded hover:bg-red-50"
                                title="מחק בקשה"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">{request.description}</p>
                          {request.location_text && (
                            <p className="text-gray-400 text-xs">📍 {request.location_text}</p>
                          )}
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
