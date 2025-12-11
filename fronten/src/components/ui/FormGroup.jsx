import React from "react";
import "./FormGroup.css";

const FormGroup = ({
  label,
  required = false,
  error = null,
  hint = null,
  children,
  className = "",
  ...props
}) => {
  return (
    <div className={`ui-form-group ${error ? "ui-form-group--error" : ""} ${className}`} {...props}>
      {label && (
        <label className="ui-form-group__label">
          {label}
          {required && <span className="ui-form-group__required">*</span>}
        </label>
      )}
      <div className="ui-form-group__input">{children}</div>
      {error && <span className="ui-form-group__error">{error}</span>}
      {hint && <span className="ui-form-group__hint">{hint}</span>}
    </div>
  );
};

export default FormGroup;
