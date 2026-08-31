import { db } from "@/lib/data/shop";
import { FormSaveButton } from "@/components/admin/form-save-button";
import { DestructiveButton } from "@/components/admin/destructive-button";
import {
  createLocation,
  deleteLocation,
  makePrimaryLocation,
  updateLocation,
} from "@/app/admin/locations/actions";

export const dynamic = "force-dynamic";

export default async function AdminLocationsPage() {
  const locations = await (await db()).location.findMany({
    orderBy: [{ isPrimary: "desc" }, { order: "asc" }],
  });

  return (
    <div className="max-w-3xl">
      <h1 className="font-serif text-3xl font-semibold">Locations</h1>
      <p className="mt-1 text-sm text-ink-soft">
        Where people can find you. Shown wherever you add the Find us section.
      </p>

      <div className="mt-6 space-y-4">
        {locations.map((location) => (
          <form
            key={location.id}
            action={updateLocation.bind(null, location.id)}
            className="space-y-3 rounded-lg border border-border bg-white p-5"
          >
            <div className="flex items-center gap-3">
              <input
                name="name"
                required
                defaultValue={location.name}
                aria-label="Name"
                className="input h-9 flex-1 font-medium"
              />
              {location.isPrimary ? (
                <span className="rounded-pill bg-emerald-bg px-2 py-0.5 text-xs font-medium text-emerald">
                  Main
                </span>
              ) : (
                <button
                  formAction={makePrimaryLocation.bind(null, location.id)}
                  className="text-xs text-ink-soft hover:text-ink"
                >
                  Make main
                </button>
              )}
            </div>

            <textarea
              name="address"
              required
              rows={2}
              defaultValue={location.address}
              aria-label="Address"
              className="input text-sm"
            />

            <div className="grid gap-3 sm:grid-cols-3">
              <input
                name="city"
                defaultValue={location.city ?? ""}
                placeholder="City"
                aria-label="City"
                className="input h-9 text-sm"
              />
              <input
                name="phone"
                defaultValue={location.phone ?? ""}
                placeholder="Phone"
                aria-label="Phone"
                className="input h-9 text-sm"
              />
              <input
                name="mapUrl"
                defaultValue={location.mapUrl ?? ""}
                placeholder="https://maps..."
                aria-label="Map link"
                className="input h-9 text-sm"
              />
            </div>

            <div className="flex items-center gap-4">
              <FormSaveButton className="px-5 py-1.5" />
              <DestructiveButton
                action={deleteLocation.bind(null, location.id)}
                title={`Delete ${location.name}?`}
                description="It will disappear from your storefront. This cannot be undone."
              >
                Delete
              </DestructiveButton>
            </div>
          </form>
        ))}
      </div>

      <form
        action={createLocation}
        className="mt-8 space-y-3 rounded-lg border border-dashed border-border p-5"
      >
        <h2 className="font-serif text-lg font-semibold">Add a location</h2>
        <input name="name" required placeholder="Name, e.g. The dining room" className="input" />
        <textarea name="address" required rows={2} placeholder="Street address" className="input" />
        <div className="grid gap-3 sm:grid-cols-3">
          <input name="city" placeholder="City" className="input" />
          <input name="phone" placeholder="Phone" className="input" />
          <input name="mapUrl" placeholder="https://maps..." className="input" />
        </div>
        <p className="text-xs text-ink-faint">
          The map is a link rather than an embedded map, so nothing third party runs on your
          storefront.
        </p>
        <FormSaveButton idleLabel="Add location" savingLabel="Adding…" savedLabel="Added" />
      </form>
    </div>
  );
}
