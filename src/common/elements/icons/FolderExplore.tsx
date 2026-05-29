import src from "./assets/folder-explore.png";
import Icon, { type IconProps } from "./Icon";

/** Open folder */
export default function FolderExplore(props: Omit<IconProps, "src">) {
  return <Icon src={src} alt="Open folder" {...props} />;
}
