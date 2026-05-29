import src from "./assets/folder-tools.png";
import Icon, { type IconProps } from "./Icon";

/** Program files */
export default function FolderTools(props: Omit<IconProps, "src">) {
  return <Icon src={src} alt="Program files" {...props} />;
}
