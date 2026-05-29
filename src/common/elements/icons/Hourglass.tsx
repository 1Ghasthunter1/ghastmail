import src from "./assets/hourglass.png";
import Icon, { type IconProps } from "./Icon";

/** Loading / wait */
export default function Hourglass(props: Omit<IconProps, "src">) {
  return <Icon src={src} alt="Loading / wait" {...props} />;
}
