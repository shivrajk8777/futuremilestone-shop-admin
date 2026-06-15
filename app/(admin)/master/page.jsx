import { getSettings } from "../../../lib/settings";
import MasterSettingsForm from "./MasterSettingsForm";
import { updateSettingsAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function MasterPage() {
  const settings = await getSettings();

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="mt-1 mb-0 text-[32px] font-bold tracking-[-0.05em]">Master Settings</h1>
        <p className="mt-1 mb-0 text-fjord-muted text-[14px]">
          Manage global storefront settings, toggle sections on/off, and customize text or images.
        </p>
      </div>

      <MasterSettingsForm initialSettings={settings} action={updateSettingsAction} />
    </div>
  );
}
