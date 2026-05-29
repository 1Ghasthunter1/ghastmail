import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../common/elements/button";
import Input from "../common/elements/input";
import { NavBar, NavItem } from "../common/elements/navbar";
import TitleBar from "../common/elements/titlebar";
import Dialog from "../common/elements/dialog";
import Alert from "../common/elements/alert";
import {
  icons,
  iconLabels,
  iconNames,
  Window,
  type IconName,
} from "../common/elements/icons";

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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [alertOpen, setAlertOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

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

      <Section title="Title bar">
        <div className="flex flex-col gap-3">
          <TitleBar
            className="w-80"
            title="Active window"
            icon={<Window size={16} />}
          />
          <TitleBar
            className="w-80"
            title="Inactive window"
            icon={<Window size={16} />}
            active={false}
          />
          <TitleBar
            className="w-80"
            title="Close only"
            icon={<Window size={16} />}
            controls={["close"]}
          />
        </div>
      </Section>

      <Section title="Dialog">
        <p className="m-0 text-sm opacity-70">
          A general window — title bar, body, optional button footer. Shown
          inline here; pass <code>modal</code> for the centered overlay.
        </p>
        <Dialog
          modal={false}
          title="Account properties"
          icon={<Window size={16} />}
          controls={["minimize", "maximize", "close"]}
          className="w-96"
          footer={
            <>
              <Button>OK</Button>
              <Button>Cancel</Button>
            </>
          }
        >
          <div className="flex flex-col gap-3">
            <p className="m-0">Display name</p>
            <Input className="w-full" defaultValue="Hunter Pruett" />
          </div>
        </Dialog>
        <Button className="self-start" onClick={() => setDialogOpen(true)}>
          Open modal dialog
        </Button>
        <Dialog
          open={dialogOpen}
          title="Modal dialog"
          icon={<Window size={16} />}
          onClose={() => setDialogOpen(false)}
          footer={<Button onClick={() => setDialogOpen(false)}>Close</Button>}
        >
          <p className="m-0">
            Click the close box or the area outside this window to dismiss it.
          </p>
        </Dialog>
      </Section>

      <Section title="Alert">
        <div className="flex flex-wrap items-start gap-6">
          <Button onClick={() => setAlertOpen(true)}>Show notice</Button>
          <Button onClick={() => setConfirmOpen(true)}>Show confirm</Button>
        </div>
        <Alert
          open={alertOpen}
          title="GhastMailer"
          icon="help"
          onClose={() => setAlertOpen(false)}
        >
          Your changes have been saved.
        </Alert>
        <Alert
          open={confirmOpen}
          title="Confirm delete"
          icon="trash"
          onClose={() => setConfirmOpen(false)}
          actions={[
            {
              label: "Delete",
              primary: true,
              onClick: () => setConfirmOpen(false),
            },
            { label: "Cancel", onClick: () => setConfirmOpen(false) },
          ]}
        >
          Are you sure you want to delete this account? This can't be undone.
        </Alert>
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
