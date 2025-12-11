import React from "react";
import "./Card.css";

const Card = ({
  children,
  title = null,
  subtitle = null,
  footer = null,
  interactive = false,
  onClick = null,
  className = "",
  headerClassName = "",
  bodyClassName = "",
  ...props
}) => {
  return (
    <div
      className={`ui-card ${interactive ? "ui-card--interactive" : ""} ${className}`}
      onClick={onClick}
      {...props}
    >
      {(title || subtitle) && (
        <div className={`ui-card__header ${headerClassName}`}>
          {title && <h3 className="ui-card__title">{title}</h3>}
          {subtitle && <p className="ui-card__subtitle">{subtitle}</p>}
        </div>
      )}
      <div className={`ui-card__body ${bodyClassName}`}>{children}</div>
      {footer && <div className="ui-card__footer">{footer}</div>}
    </div>
  );
};

export default Card;
