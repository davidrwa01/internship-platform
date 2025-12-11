import React from "react";
import "./Alert.css";

const Alert = ({
  variant = "info",
  icon = true,
  title = null,
  children,
  onClose = null,
  className = "",
  ...props
}) => {
  const defaultIcons = {
    info: "info-circle",
    success: "check-circle",
    warning: "exclamation-triangle",
    danger: "exclamation-circle",
  };

  const displayIcon = icon === true ? defaultIcons[variant] : icon;

  return (
    <div className={`ui-alert ui-alert--${variant} ${className}`} {...props}>
      <div className="ui-alert__content">
        {displayIcon && <i className={`fas fa-${displayIcon}`}></i>}
        <div className="ui-alert__text">
          {title && <h4 className="ui-alert__title">{title}</h4>}
          <p className="ui-alert__message">{children}</p>
        </div>
      </div>
      {onClose && (
        <button className="ui-alert__close" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      )}
    </div>
  );
};

export default Alert;
