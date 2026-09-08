import "./Button.css";

export default function Button({ variant = "primary", fullWidth = true, className = "", ...props }) {
  const classes = ["btn", `btn--${variant}`, fullWidth ? "btn--full" : "", className].filter(Boolean).join(" ");
  return <button className={classes} {...props} />;
}
