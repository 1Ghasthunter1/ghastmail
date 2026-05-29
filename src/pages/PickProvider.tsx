import { useNavigate } from "react-router-dom";
import Button from "../common/elements/button";
import googleMailBeta from "../common/media/mailProviders/google-mail-beta.png";

/** Provider picker shown when adding a new mail account. */
function PickProvider() {
  const navigate = useNavigate();

  function handlePickGoogle() {
    // TODO: kick off the Google account auth flow.
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <h1 className="m-0 text-3xl font-normal">Pick a provider</h1>
      <Button className="mt-2 px-4 py-3" onClick={handlePickGoogle}>
        <img
          src={googleMailBeta}
          alt="Google Mail (beta)"
          className="h-auto w-48 select-none"
        />
      </Button>
      <Button onClick={() => navigate("/")}>Back</Button>
    </div>
  );
}

export default PickProvider;
