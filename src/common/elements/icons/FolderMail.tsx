import src from "./assets/folder-mail.png";
import Icon, { type IconProps } from "./Icon";

/** Folder with letter */
export default function FolderMail(props: Omit<IconProps, "src">) {
  return <Icon src={src} alt="Folder with letter" {...props} />;
}
