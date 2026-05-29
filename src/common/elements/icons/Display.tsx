import src from "./assets/display.png";
import Icon, { type IconProps } from "./Icon";

/** Display settings */
export default function Display(props: Omit<IconProps, "src">) {
  return <Icon src={src} alt="Display settings" {...props} />;
}
