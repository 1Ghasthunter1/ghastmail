import src from "./assets/warning-exclamation.png";
import Icon, { type IconProps } from "./Icon";

/** Warning (exclamation) */
export default function WarningExclamation(props: Omit<IconProps, "src">) {
  return <Icon src={src} alt="Warning" {...props} />;
}
