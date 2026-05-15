import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../api";
import { useAuth } from "../AuthContext";
import { socket } from "../socket";
// import {Request} from "@typesLib"

type SocketAck = {
  ok: boolean;
  error?: string;
};

type ChatApiResponse = {
  id: number;
  request: {
    id: number;
  } | null;
};

const HELP_MESSAGE = "היי, אני יכול לעזור";

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [request, setRequest] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [startingChat, setStartingChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  //const navigate = useNavigate();

  const { user } = useAuth();
  console.log("Current user id:", user?.id);
  console.log("Current user name:", user?.name); 

  //Delete request
  function handleDelete() {
    api.delete(`/requests/${id}`)
      .then(()  => {
        alert("הבקשה נמחקה בהצלחה");
        navigate(`/requests`)
      })
      .catch((error) => {
        console.error("Error deleting request:", error);
        alert("אירעה שגיאה בעת מחיקת הבקשה");
      });
  }

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

  async function findRequestChat(requestId: number) {
    const response = await api.get<ChatApiResponse[]>('/chats');
    return response.data.find((chat) => chat.request?.id === requestId);
  }

  async function handleHelpClick() {
    const requestId = Number(id);

    if (!requestId || Number.isNaN(requestId)) {
      setChatError('בקשה לא תקינה');
      return;
    }

    if (!socket.connected) {
      setChatError('אין חיבור לצ׳אט');
      return;
    }

    try {
      setStartingChat(true);
      setChatError(null);

      const existingChat = await findRequestChat(requestId);
      if (existingChat) {
        navigate(`/chats/${existingChat.id}`);
        return;
      }

      socket.emit(
        'first_request_message',
        {
          requestId,
          content: HELP_MESSAGE,
        },
        async (response: SocketAck) => {
          if (!response?.ok) {
            setStartingChat(false);
            setChatError(response?.error || 'פתיחת הצ׳אט נכשלה');
            return;
          }

          try {
            const chat = await findRequestChat(requestId);
            if (!chat) {
              setChatError('הצ׳אט נפתח, אבל לא הצלחנו למצוא אותו ברשימת השיחות');
              setStartingChat(false);
              return;
            }

            navigate(`/chats/${chat.id}`);
          } catch (error) {
            console.error('Failed to find created chat:', error);
            setChatError('הצ׳אט נפתח, אבל לא הצלחנו לפתוח אותו');
            setStartingChat(false);
          }
        }
      );
    } catch (error) {
      console.error('Failed to start request chat:', error);
      setChatError('פתיחת הצ׳אט נכשלה');
      setStartingChat(false);
    }
  }

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
            <span className={`text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap ${request.urgency === 'high' ? 'bg-red-100 text-red-700' :
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
            <span>
             פורסם על ידי: {request.user_name}
                  </span>
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
          {chatError && (
            <p className="text-sm text-red-600 mb-3 text-center">{chatError}</p>
          )}
          {user?.id !== request.user_id ? (
            <>
              {chatError && (
                <p className="text-sm text-red-600 mb-3 text-center">{chatError}</p>
              )}
              <button
                onClick={handleHelpClick}
                disabled={startingChat}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-medium py-2.5 px-4 rounded-md transition-colors"
              >
                {startingChat ? 'פותח צ׳אט...' : 'אני אעזור'}
              </button>
            </>
          ) : (
            <button onClick={handleDelete} className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 px-4 rounded-md transition-colors">
              מחק
            </button>
          )}

        </div>
      </div>
    </div>
  );
}
