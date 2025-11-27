// src/components/NotificationBell.jsx - UPDATED
import React, { useState, useEffect } from "react";
import API from "../services/api";
import "./NotificationBell.css";

const NotificationBell = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await API.get("/notifications");
      setNotifications(res.data || []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await API.put(`/notifications/${notificationId}/read`);
      setNotifications(notifications.map(notif => 
        notif._id === notificationId ? { ...notif, read: true } : notif
      ));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.put("/notifications/read-all");
      setNotifications(notifications.map(notif => ({ ...notif, read: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const unreadCount = notifications.filter(notif => !notif.read).length;

  const handleNotificationClick = (notification) => {
    markAsRead(notification._id);
    
    // Navigate based on notification type
    if (notification.type === "application" && user.role === "company") {
      window.location.href = "/company-dashboard#applications";
    } else if (notification.type === "status_update" && user.role === "student") {
      window.location.href = "/student-dashboard";
    }
    
    setShowNotifications(false);
  };

  return (
    <div className="notification-bell">
      <button 
        className="bell-icon"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {showNotifications && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Notifications</h4>
            <div>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="btn btn-sm">
                  Mark all read
                </button>
              )}
              <button onClick={() => setShowNotifications(false)}>×</button>
            </div>
          </div>
          
          <div className="notification-list">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <div 
                  key={notification._id} 
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-content">
                    <h5>{notification.title}</h5>
                    <p>{notification.message}</p>
                    <small>{new Date(notification.createdAt).toLocaleDateString()}</small>
                  </div>
                  {!notification.read && <div className="unread-dot"></div>}
                </div>
              ))
            ) : (
              <p className="no-notifications">No notifications</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;