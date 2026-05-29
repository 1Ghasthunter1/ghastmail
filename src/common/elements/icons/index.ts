// Auto-generated icon barrel. Win95 system icon set.
export { default as Computer } from "./Computer";
export { default as Browser } from "./Browser";
export { default as Folder } from "./Folder";
export { default as FolderMail } from "./FolderMail";
export { default as FolderExplore } from "./FolderExplore";
export { default as Hourglass } from "./Hourglass";
export { default as FolderTools } from "./FolderTools";
export { default as SettingsGears } from "./SettingsGears";
export { default as Window } from "./Window";
export { default as Drive } from "./Drive";
export { default as SearchComputer } from "./SearchComputer";
export { default as SearchDocument } from "./SearchDocument";
export { default as Notepad } from "./Notepad";
export { default as DocumentProgram } from "./DocumentProgram";
export { default as Documents } from "./Documents";
export { default as Page } from "./Page";
export { default as Help } from "./Help";
export { default as TrashFull } from "./TrashFull";
export { default as Trash } from "./Trash";
export { default as Tree } from "./Tree";
export { default as Mouse } from "./Mouse";
export { default as Compose } from "./Compose";
export { default as Windows } from "./Windows";
export { default as Display } from "./Display";
export { default as Brain } from "./Brain";
export { default as Claude } from "./Claude";
export { default as OpenAI } from "./OpenAI";
export { default as OpenRouter } from "./OpenRouter";
export { default as WarningExclamation } from "./WarningExclamation";

import Computer from "./Computer";
import Browser from "./Browser";
import Folder from "./Folder";
import FolderMail from "./FolderMail";
import FolderExplore from "./FolderExplore";
import Hourglass from "./Hourglass";
import FolderTools from "./FolderTools";
import SettingsGears from "./SettingsGears";
import Window from "./Window";
import Drive from "./Drive";
import SearchComputer from "./SearchComputer";
import SearchDocument from "./SearchDocument";
import Notepad from "./Notepad";
import DocumentProgram from "./DocumentProgram";
import Documents from "./Documents";
import Page from "./Page";
import Help from "./Help";
import TrashFull from "./TrashFull";
import Trash from "./Trash";
import Tree from "./Tree";
import Mouse from "./Mouse";
import Compose from "./Compose";
import Windows from "./Windows";
import Display from "./Display";
import Brain from "./Brain";
import Claude from "./Claude";
import OpenAI from "./OpenAI";
import OpenRouter from "./OpenRouter";
import WarningExclamation from "./WarningExclamation";

/** name -> component, for dynamic lookup and the gallery. */
export const icons = {
  "computer": Computer,
  "browser": Browser,
  "folder": Folder,
  "folder-mail": FolderMail,
  "folder-explore": FolderExplore,
  "hourglass": Hourglass,
  "folder-tools": FolderTools,
  "settings-gears": SettingsGears,
  "window": Window,
  "drive": Drive,
  "search-computer": SearchComputer,
  "search-document": SearchDocument,
  "notepad": Notepad,
  "document-program": DocumentProgram,
  "documents": Documents,
  "page": Page,
  "help": Help,
  "trash-full": TrashFull,
  "trash": Trash,
  "tree": Tree,
  "mouse": Mouse,
  "compose": Compose,
  "windows": Windows,
  "display": Display,
  "brain": Brain,
  "claude": Claude,
  "openai": OpenAI,
  "openrouter": OpenRouter,
  "warning-exclamation": WarningExclamation,
} as const;

/** name -> human-readable label. */
export const iconLabels: Record<IconName, string> = {
  "computer": "My Computer",
  "browser": "Browser",
  "folder": "Folder",
  "folder-mail": "Folder with letter",
  "folder-explore": "Open folder",
  "hourglass": "Loading / wait",
  "folder-tools": "Program files",
  "settings-gears": "Settings (gears)",
  "window": "Window",
  "drive": "Drive",
  "search-computer": "Find computer",
  "search-document": "Find file",
  "notepad": "Notepad",
  "document-program": "Program document",
  "documents": "Documents",
  "page": "Page",
  "help": "Help",
  "trash-full": "Recycle bin (full)",
  "trash": "Recycle bin (empty)",
  "tree": "Tree",
  "mouse": "Mouse",
  "compose": "Compose",
  "windows": "Windows",
  "display": "Display settings",
  "brain": "Brain",
  "claude": "Claude",
  "openai": "OpenAI",
  "openrouter": "OpenRouter",
  "warning-exclamation": "Warning",
};

export type IconName = keyof typeof icons;
export const iconNames = Object.keys(icons) as IconName[];

export { default as Icon } from "./Icon";
export type { IconProps } from "./Icon";
