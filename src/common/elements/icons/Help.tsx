import src from "./assets/help.png";
import Icon, { type IconProps } from "./Icon";

/** Help */
export default function Help(props: Omit<IconProps, "src">) {
  return <Icon src={src} alt="Help" {...props} />;
}
