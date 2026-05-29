import src from "./assets/mouse.png";
import Icon, { type IconProps } from "./Icon";

/** Mouse */
export default function Mouse(props: Omit<IconProps, "src">) {
  return <Icon src={src} alt="Mouse" {...props} />;
}
