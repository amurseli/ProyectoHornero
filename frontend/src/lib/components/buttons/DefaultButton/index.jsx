import React, { forwardRef, useCallback } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import "./styles.css";

const DefaultButton = forwardRef(function DefaultButton(
  {
    destination,
    content,
    children,
    secondary = false,
    handleClick,
    disabled = false,
    type = "button",
    ariaLabel,
    ...rest
  },
  ref
) {
  const navigate = useNavigate();

  const handleButtonClick = useCallback(
    (e) => {
      if (disabled) return;
      if (destination) {
        // if it's an external link, use full navigation
        if (/^https?:\/\//.test(destination)) {
          window.location.href = destination;
        } else {
          navigate(destination);
        }
        return;
      }
      if (handleClick) handleClick(e);
    },
    [destination, handleClick, navigate, disabled]
  );

  const contentNode = children || content || ariaLabel || "";

  return (
    <button
      ref={ref}
      className={`default-button ${secondary ? 'default-button--secondary' : ''}`}
      onClick={handleButtonClick}
      type={type}
      disabled={disabled}
      aria-label={ariaLabel}
      {...rest}
    >
      {contentNode}
    </button>
  );
});

export default React.memo(DefaultButton);

DefaultButton.propTypes = {
  /* *
   *  Destination route path
   */
  destination: PropTypes.string,
  /* *
   * Button's text
   */
  content: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  /* *
   * Activate secondary color styles
   */
  secondary: PropTypes.bool,
  /* *
   * Callback handler when clicked
   */
  handleClick: PropTypes.func,
  /* *
   * Button type
   */
  type: PropTypes.string,
  /* *
   * Button disabled
   */
  disabled: PropTypes.bool,
  /* Accessible label (used when content is not descriptive) */
  ariaLabel: PropTypes.string,
  /* children may be provided instead of content */
  children: PropTypes.node,
};