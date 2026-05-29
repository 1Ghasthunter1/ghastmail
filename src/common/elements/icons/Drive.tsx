import src from "./assets/drive.png";
import Icon, { type IconProps } from "./Icon";

/** Drive */
export default function Drive(props: Omit<IconProps, "src">) {
  return <Icon src={src} alt="Drive" {...props} />;
}
