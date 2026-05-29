import src from "./assets/folder.png";
import Icon, { type IconProps } from "./Icon";

/** Folder */
export default function Folder(props: Omit<IconProps, "src">) {
  return <Icon src={src} alt="Folder" {...props} />;
}
