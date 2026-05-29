import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../common/elements/button";
import Input from "../common/elements/input";
import { NavBar, NavItem } from "../common/elements/navbar";
import { icons, iconLabels, iconNames, type IconName } from "../common/elements/icons";

/** Dev-only kitchen sink for the Win95 UI elements. Not wired into the app. */

const FOLDERS: { label: string; icon: IconName }[] = [
  { label: "Inbox", icon: "folder-mail" },
  { label: "Drafts", icon: "compose" },
  { label: "Sent", icon: "folder" },
  { label: "Junk", icon: "folder-tools" },
  { label: "Trash", icon: "trash" },
  { label: "Archive", icon: "documents" },
];

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="m-0 text-navy text-xl font-normal">{title}</h2>
      {children}
    </section>
  );
}

function Elements() {
  const navigate = useNavigate();
  const [selectedFolder, setSelectedFolder] = useState("Inbox");
  const [text, setText] = useState("");
  const [account, setAccount] = useState("");

  return (
    <div className="flex flex-1 flex-col gap-10 p-8">
      <Button className="self-start" onClick={() => navigate("/")}>
        Back
      </Button>
      <h1 className="m-0 text-3xl font-normal">UI Elements</h1>

      <Section title="Button">
        <div className="flex flex-wrap items-start gap-6">
          <Button>Default</Button>
          <Button previewState="hover">Hover</Button>
          <Button previewState="pressed">Pressed</Button>
          <Button previewState="focused">Focused</Button>
          <Button disabled>Disabled</Button>
        </div>
      </Section>

      <Section title="Nav bar (horizontal)">
        <NavBar className="gap-1 p-1">
          {FOLDERS.slice(0, 4).map(({ label, icon }) => {
            const Glyph = icons[icon];
            return (
              <NavItem
                key={label}
                icon={<Glyph size={16} />}
                label={label}
                selected={selectedFolder === label}
                onClick={() => setSelectedFolder(label)}
              />
            );
          })}
        </NavBar>
      </Section>

      <Section title="Sidebar (vertical)">
        <NavBar orientation="vertical" className="w-48 gap-1 p-1">
          {FOLDERS.map(({ label, icon }) => {
            const Glyph = icons[icon];
            return (
              <NavItem
                key={label}
                icon={<Glyph size={16} />}
                label={label}
                className="justify-start"
                selected={selectedFolder === label}
                onClick={() => setSelectedFolder(label)}
              />
            );
          })}
        </NavBar>
      </Section>

      <Section title="Input">
        <div className="flex flex-col gap-3">
          <Input
            className="w-64"
            placeholder="Plain text field"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Input
            containerClassName="w-64"
            placeholder="Pick an account"
            value={account}
            options={[
              "hunter@lexprep.ai",
              "work@ghastmail.app",
              "personal@gmail.com",
            ]}
            onValueChange={setAccount}
          />
          <Input
            containerClassName="w-64"
            dropdown
            disabled
            defaultValue="Disabled field"
          />
        </div>
      </Section>

      <Section title="Icons">
        <p className="m-0 text-sm opacity-70">
          The full Win95 set. Import by name, e.g.{" "}
          <code>{`import { Folder } from "../common/elements/icons"`}</code>.
        </p>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
          {iconNames.map((name) => {
            const Glyph = icons[name];
            return (
              <div
                key={name}
                className="bevel-field flex flex-col items-center gap-1 bg-white p-2 text-center"
                title={iconLabels[name]}
              >
                <Glyph size={32} />
                <code className="text-xs">{name}</code>
                <span className="text-[10px] leading-tight opacity-60">
                  {iconLabels[name]}
                </span>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}

export default Elements;
