import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white" dir="rtl">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Section */}
          <h1 className="text-5xl md:text-6xl font-bold text-blue-900 mb-6">
            שכנים טובים
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 mb-12">
            פלטפורמה שכונתית לעזרה הדדית
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/requests/new"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-lg shadow-md transition-colors duration-200"
            >
              פרסם בקשה
            </Link>
            <Link
              to="/requests"
              className="bg-white hover:bg-gray-50 text-blue-600 font-semibold px-8 py-4 rounded-lg shadow-md border-2 border-blue-600 transition-colors duration-200"
            >
              צפה בבקשות
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
