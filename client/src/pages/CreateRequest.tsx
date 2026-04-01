import { useState } from 'react';
import api from '../api';

type CreateRequestData = {
  title: string;
  description: string;
  category: string;
  urgency: string;
  location_text: string;
  image_url: string | null;
};

export default function CreateRequest() {
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [urgency, setUrgency] = useState<string>('');
  const [locationText, setLocationText] = useState<string>('');
  const [image, setImage] = useState<string>('');

  //Submit handler - to be implemented
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSend: CreateRequestData = {
      title,
      description,
      category,
      urgency,
      location_text: locationText,
      image_url: image || null,
    };

    /*console.log('Submitting request:', dataToSend);*/

    const token = localStorage.getItem('token');
    if (!token) {
      alert('אנא התחבר כדי ליצור בקשה');
      return;
    }

    try {
      await api.post('/requests', dataToSend);
      alert('הבקשה נוצרה בהצלחה!');
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || 'אירעה שגיאה ביצירת הבקשה';
      alert(`שגיאה: ${errorMessage}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6 sm:p-8">
          <h1 className="text-3xl font-bold text-blue-700 text-center">בקשה חדשה</h1>
          <p className="text-gray-600 text-center mt-2 mb-8">
           טופס בקשה
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                כותרת 
              </label>
              <input
                id="title"
                type="text"
                placeholder="דוגמה: צריך עזרה עם קניות"
                value={title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                תיאור
              </label>
              <textarea
                id="description"
                placeholder="תאור הבקשה"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                rows={4}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                  קטגוריה
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
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

              <div>
                <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-1">
                  רמת דחיפות
                </label>
                <select
                  id="urgency"
                  value={urgency}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setUrgency(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">בחר דחיפות</option>
                  <option value="low">נמוכה</option>
                  <option value="medium">בינונית</option>
                  <option value="high">גבוהה</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                מיקום
              </label>
              <input
                id="location"
                type="text"
                placeholder="לדוגמה: רחוב הרצל 10, תל אביב"
                value={locationText}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocationText(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
                קישור לתמונה (אופציונלי)
              </label>
              <input
                id="image"
                type="url"
                placeholder="https://..."
                value={image}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setImage(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors"
            >
              שלח בקשה
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
