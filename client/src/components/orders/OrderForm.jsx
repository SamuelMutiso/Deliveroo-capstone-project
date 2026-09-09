import Input from '@/components/ui/Input'
import PlacesAutocomplete from '@/components/map/PlacesAutocomplete'
import UseMyLocation from '@/components/map/UseMyLocation'
export default function OrderForm({ values, errors, categories, onChange }) {
  const set = (patch) => onChange({ ...values, ...patch })

  return (
    <div className="flex flex-col gap-8">
      <Section title="Route" caption="Where should we collect and deliver?">
        <PlacesAutocomplete
          label="Pickup location"
          value={values.pickup}
          onChange={(pickup) => set({ pickup })}
          error={errors.pickup}
          placeholder="Sarit Centre, Westlands"
        />
        <UseMyLocation onPick={(pickup) => set({ pickup })} />
        <PlacesAutocomplete
          label="Destination"
          value={values.destination}
          onChange={(destination) => set({ destination })}
          error={errors.destination}
          placeholder="Karen Shopping Centre"
        />
      </Section>

      <Section title="Parcel" caption="Pick the band your parcel falls into. No scale needed.">
        <fieldset>
          <legend className="font-body text-sm font-semibold text-slate-700">
            Weight category
          </legend>
          <div className="mt-2.5 grid gap-2.5 sm:grid-cols-2">
            {categories.map((category) => {
              const active = values.weight_category === category.value
              return (
                <label
                  key={category.value}
                  className={[
                    'flex cursor-pointer flex-col gap-0.5 rounded-xl p-3.5 transition',
                    'ring-1 ring-inset focus-within:ring-2 focus-within:ring-brand-500',
                    active
                      ? 'bg-brand-50 ring-brand-500'
                      : 'bg-white ring-slate-200 hover:ring-slate-300',
                  ].join(' ')}
                >
                  <span className="flex items-center justify-between gap-2.5">
                    <span className="font-display text-base font-semibold text-slate-900">
                      {category.label}
                    </span>
                    <input
                      type="radio"
                      name="weight_category"
                      value={category.value}
                      checked={active}
                      onChange={() => set({ weight_category: category.value })}
                      className="h-4 w-4 accent-brand-600"
                    />
                  </span>
                  <span className="font-body text-sm text-slate-500">{category.description}</span>
                  <span className="font-mono text-xs text-slate-400">
                    up to {category.max_kg} kg
                  </span>
                </label>
              )
            })}
          </div>
          {errors.weight_category && (
            <p className="mt-1.5 font-body text-sm text-red-700">{errors.weight_category}</p>
          )}
        </fieldset>
      </Section>

      <Section title="Recipient" caption="Who is receiving this parcel?">
        <Input
          label="Full name"
          value={values.recipient_name}
          onChange={(event) => set({ recipient_name: event.target.value })}
          error={errors.recipient_name}
          placeholder="Joyce Muthoni"
        />
        <Input
          label="Phone number"
          value={values.recipient_phone}
          onChange={(event) => set({ recipient_phone: event.target.value })}
          error={errors.recipient_phone}
          placeholder="0712345678"
          inputMode="tel"
        />
        <Input
          label="Email address"
          type="email"
          value={values.recipient_email}
          onChange={(event) => set({ recipient_email: event.target.value })}
          error={errors.recipient_email}
          placeholder="joyce@example.com"
          hint="Optional. If given, we email them at every stage of the delivery."
        />
        <Input
          as="textarea"
          label="Delivery notes"
          value={values.notes}
          onChange={(event) => set({ notes: event.target.value })}
          placeholder="Call on arrival, leave at reception, fragile…"
          hint="Optional"
        />
      </Section>

      <Section title="Rider" caption="Operations assign the rider once your order is placed.">
        <p className="rounded-xl bg-slate-100 px-3.5 py-3 font-body text-sm text-slate-600">
          A rider is allocated by our operations team based on who is closest and available. You
          will get a text and an email with their name, vehicle and photo as soon as they are
          assigned.
        </p>
      </Section>
    </div>
  )
}

function Section({ title, caption, children }) {
  return (
    <section className="flex flex-col gap-3.5">
      <div>
        <h2 className="font-display text-xl font-semibold text-slate-950">{title}</h2>
        <p className="mt-0.5 font-body text-sm text-slate-500">{caption}</p>
      </div>
      <div className="flex flex-col gap-3.5">{children}</div>
    </section>
  )
}