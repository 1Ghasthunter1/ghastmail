import src from "./assets/window.png";
import Icon, { type IconProps } from "./Icon";

/** Window */
export default function Window(props: Omit<IconProps, "src">) {
  return <Icon src={src} alt="Window" {...props} />;
}
