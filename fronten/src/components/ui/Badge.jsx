import React from "react";
import "./Badge.css";

const Badge = ({
  children,
  variant = "primary",
  size = "md",
  icon = null,
  className = "",
  ...props
}) => {
  return (
    <span className={`ui-badge ui-badge--${variant} ui-badge--${size} ${className}`} {...props}>
      {icon && <i className={`fas fa-${icon}`}></i>}
      {children}
    </span>
  );
};

export default Badge;
