import src from "./assets/computer.png";
import Icon, { type IconProps } from "./Icon";

/** My Computer */
export default function Computer(props: Omit<IconProps, "src">) {
  return <Icon src={src} alt="My Computer" {...props} />;
}
