import src from "./assets/windows.png";
import Icon, { type IconProps } from "./Icon";

/** Windows */
export default function Windows(props: Omit<IconProps, "src">) {
  return <Icon src={src} alt="Windows" {...props} />;
}
