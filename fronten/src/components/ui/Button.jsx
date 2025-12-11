import React from "react";
import "./Button.css";

const Button = ({
  variant = "primary",
  size = "md",
  disabled = false,
  isLoading = false,
  icon = null,
  children,
  onClick,
  type = "button",
  className = "",
  ...props
}) => {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`ui-button ui-button--${variant} ui-button--${size} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <i className="fas fa-spinner fa-spin"></i>
          <span>{children}</span>
        </>
      ) : (
        <>
          {icon && <i className={`fas fa-${icon}`}></i>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
};

export default Button;
