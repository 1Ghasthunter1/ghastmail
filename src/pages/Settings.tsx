import { useNavigate } from "react-router-dom";
import Button from "../common/elements/button";

/** Placeholder settings page. */
function Settings() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <h1 className="m-0 text-3xl font-normal">Settings</h1>
      <p className="m-0 opacity-70">Nothing here yet.</p>
      <Button className="mt-2" onClick={() => navigate("/")}>
        Back
      </Button>
    </div>
  );
}

export default Settings;
