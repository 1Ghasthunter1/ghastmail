import src from "./assets/settings-gears.png";
import Icon, { type IconProps } from "./Icon";

/** Settings (gears) */
export default function SettingsGears(props: Omit<IconProps, "src">) {
  return <Icon src={src} alt="Settings (gears)" {...props} />;
}
