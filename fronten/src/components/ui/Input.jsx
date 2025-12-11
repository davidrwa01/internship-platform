import React from "react";
import "./Input.css";

const Input = ({
  type = "text",
  name,
  value,
  onChange,
  placeholder = "",
  disabled = false,
  error = null,
  icon = null,
  size = "md",
  className = "",
  ...props
}) => {
  return (
    <div className={`ui-input-wrapper ${error ? "ui-input-wrapper--error" : ""}`}>
      {icon && <i className={`fas fa-${icon} ui-input-icon`}></i>}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`ui-input ui-input--${size} ${icon ? "ui-input--with-icon" : ""} ${className}`}
        {...props}
      />
      {error && <span className="ui-input-error">{error}</span>}
    </div>
  );
};

export default Input;
