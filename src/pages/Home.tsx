import { useNavigate } from "react-router-dom";
import Button from "../common/elements/button";

/** Empty state shown when no mail accounts have been added yet. */
function Home() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <h1 className="m-0 text-3xl font-normal">GhastMailer</h1>
      <p className="m-0 opacity-70">No accounts added yet.</p>
      <Button className="mt-2" onClick={() => navigate("/add-account")}>
        Add mail account
      </Button>
      <Button onClick={() => navigate("/settings")}>Settings</Button>
      <Button onClick={() => navigate("/elements")}>UI Elements</Button>
    </div>
  );
}

export default Home;
