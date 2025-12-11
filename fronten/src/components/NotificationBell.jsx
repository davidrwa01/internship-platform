// src/components/NotificationBell.jsx
import React, { useState, useEffect, useRef } from "react";
import API from "../services/api";
import socket from '../services/socket';
import "./NotificationBell.css";

const NotificationBell = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  // Fetch notifications on mount
  useEffect(() => {
    if (user) {
      fetchNotifications();
      fetchUnreadCount();
    }
  }, [user]);

  // Socket connection and real-time updates
  useEffect(() => {
    if (user && socket) {
      // Connect socket if not connected
      if (!socket.connected) {
        socket.connect();
      }

      // Join notification room
      socket.emit('join_notifications', user.id);

      // Listen for new notifications
      socket.on('new_notification', (newNotification) => {
        console.log('Received new notification:', newNotification);
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);

        // Show window.alert() for all notifications
        const alertMessage = `${getNotificationTitle(newNotification)}: ${newNotification.message || "No message content"}`;
        window.alert(alertMessage);
      });

      // Listen for notification updates (e.g., unread count changes)
      socket.on('notification_update', (update) => {
        console.log('Notification update:', update);
        if (update.unreadCount !== undefined) {
          setUnreadCount(update.unreadCount);
        }
      });

      // Cleanup on unmount
      return () => {
        socket.off('new_notification');
        socket.off('notification_update');
      };
    }
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await API.get("/notifications");
      console.log("Notifications response:", res.data);
      setNotifications(res.data || []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const res = await API.get("/notifications/unread-count");
      console.log("Unread count response:", res.data);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
      setUnreadCount(0);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await API.put(`/notifications/${notificationId}/read`);
      setNotifications(notifications.map(notif => 
        notif._id === notificationId ? { ...notif, read: true } : notif
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await API.put("/notifications/mark-all-read");
      setNotifications(notifications.map(notif => ({ ...notif, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const deleteNotification = async (notificationId, e) => {
    e.stopPropagation();
    try {
      await API.delete(`/notifications/${notificationId}`);
      const notification = notifications.find(n => n._id === notificationId);
      setNotifications(notifications.filter(notif => notif._id !== notificationId));
      
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    
    // UPDATED: Better navigation based on notification type
    switch (notification.type) {
      case "new_company_registration":
        if (user.role === "admin") {
          window.location.href = "/admin/companies?pending=true";
        }
        break;
      case "application":
        if (user.role === "company") {
          window.location.href = "/company/applications";
        }
        break;
      case "status_update":
        if (user.role === "student") {
          window.location.href = "/student/applications";
        }
        break;
      case "approval":
        if (user.role === "company") {
          window.location.href = "/company/dashboard";
        } else if (user.role === "student") {
          window.location.href = "/student/dashboard";
        }
        break;
      case "rejection":
        if (user.role === "company") {
          window.location.href = "/company/dashboard";
        }
        break;
      case "message":
        if (notification.relatedConversation) {
          window.location.href = `/messages?conversation=${notification.relatedConversation}`;
        } else if (notification.sender) {
          window.location.href = `/messages?user=${notification.sender._id}`;
        } else {
          window.location.href = "/messages";
        }
        break;
      case "new_internship":
        if (notification.relatedInternship) {
          window.location.href = `/internship/${notification.relatedInternship}`;
        }
        break;
      default:
        // Default navigation based on user role
        if (user.role === "admin") window.location.href = "/admin/dashboard";
        else if (user.role === "company") window.location.href = "/company/dashboard";
        else window.location.href = "/student/dashboard";
        break;
    }
    
    setShowNotifications(false);
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "message":
        return "💬";
      case "approval":
        return "✅";
      case "rejection":
        return "❌";
      case "application":
        return "📄";
      case "new_internship":
        return "💼";
      case "status_update":
        return "🔄";
      case "new_company_registration":
        return "🏢";
      case "new_student_registration":
        return "🎓";
      case "new_follower":
        return "👥";
      case "application_cancelled":
        return "🚫";
      default:
        return "🔔";
    }
  };

  const getNotificationTitle = (notification) => {
    switch (notification.type) {
      case "new_company_registration":
        return "New Company Registration";
      case "new_student_registration":
        return "New Student Registration";
      case "application":
        return "New Application Received";
      case "message":
        return "New Message";
      case "approval":
        return "Registration Approved";
      case "rejection":
        return "Registration Rejected";
      case "status_update":
        return "Application Status Updated";
      case "new_internship":
        return "New Internship Posted";
      case "new_follower":
        return "New Follower";
      case "application_cancelled":
        return "Application Cancelled";
      default:
        return notification.title || "Notification";
    }
  };

  // UPDATED: Filter logic for proper notification routing
  const filteredNotifications = notifications.filter(notification => {
    if (user.role === "admin") {
      // Admin sees: company registrations, system notifications
      return ["new_company_registration", "new_student_registration", "system"].includes(notification.type);
    } else if (user.role === "company") {
      // Company sees: applications, messages, approvals, rejections, new followers
      return ["application", "message", "approval", "rejection", "new_follower", "application_cancelled"].includes(notification.type);
    } else if (user.role === "student") {
      // Student sees: messages, status updates, approvals, new internships from followed companies
      return ["message", "status_update", "approval", "new_internship"].includes(notification.type);
    }
    return false;
  });

  const formatTime = (dateString) => {
    if (!dateString) return "Recently";
    
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button 
        className="bell-icon"
        onClick={() => setShowNotifications(!showNotifications)}
        disabled={loading}
      >
        <i className="fas fa-bell"></i>
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
        {loading && <span className="loading-dot">...</span>}
      </button>

      {showNotifications && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Notifications</h4>
            <div className="header-actions">
              {unreadCount > 0 && (
                <button 
                  onClick={markAllAsRead} 
                  className="mark-all-read-btn"
                  disabled={loading}
                >
                  Mark all read
                </button>
              )}
              <button 
                onClick={() => setShowNotifications(false)}
                className="close-dropdown-btn"
              >
                ×
              </button>
            </div>
          </div>
          
          <div className="notification-list">
            {loading ? (
              <div className="loading-notifications">
                <p>Loading notifications...</p>
              </div>
            ) : filteredNotifications.length > 0 ? (
              filteredNotifications.slice(0, 10).map(notification => (
                <div 
                  key={notification._id} 
                  className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <h5>{getNotificationTitle(notification)}</h5>
                    <p>{notification.message || "No message content"}</p>
                    <small>{formatTime(notification.createdAt)}</small>
                  </div>
                  <div className="notification-actions">
                    {!notification.read && <div className="unread-dot"></div>}
                    <button 
                      className="delete-notification-btn"
                      onClick={(e) => deleteNotification(notification._id, e)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-notifications">
                <p>No notifications yet</p>
                <small>You'll see notifications here for new activities</small>
              </div>
            )}
          </div>

          {filteredNotifications.length > 10 && (
            <div className="notification-footer">
              <button 
                className="view-all-btn"
                onClick={() => {
                  window.location.href = "/notifications";
                  setShowNotifications(false);
                }}
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;