import src from "./assets/notepad.png";
import Icon, { type IconProps } from "./Icon";

/** Notepad */
export default function Notepad(props: Omit<IconProps, "src">) {
  return <Icon src={src} alt="Notepad" {...props} />;
}
