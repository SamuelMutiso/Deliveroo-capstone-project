import { Link } from 'react-router-dom'

import { Clause, LegalBody, LegalHeader, Points } from '@/components/legal/Legal'
import { CONTACT } from '@/utils/constants'

const UPDATED = '1 September 2026'

export default function Terms() {
  return (
    <>
      <LegalHeader
        eyebrow="Legal"
        title="Terms of service"
        updated={UPDATED}
        summary={`These terms cover what you can expect from ${CONTACT.company} and what we expect from you when you book, carry or pay for a parcel through this platform.`}
      />

      <LegalBody>
        <Clause number="01" title="Who these terms are between">
          <p>
            This platform is operated by {CONTACT.company}, {CONTACT.addressLines.join(', ')}. In
            these terms “we” and “us” mean {CONTACT.company}, and “you” means the person using the
            platform, whether as a customer sending a parcel, a rider carrying one, or a member of
            our operations team.
          </p>
          <p>
            By creating an account or placing an order you accept these terms. If you do not accept
            them, do not use the platform.
          </p>
        </Clause>

        <Clause number="02" title="Your account">
          <p>
            You need an account to book a delivery or to ride for us. You are responsible for the
            accuracy of what you enter and for keeping your password to yourself. Tell us straight
            away if you think someone else has access to your account.
          </p>
          <Points
            items={[
              'One person, one account. Do not share your login.',
              'You must be 18 or older to hold an account.',
              'We may suspend an account that is used to abuse the service, other users or our riders.',
            ]}
          />
        </Clause>

        <Clause number="03" title="Booking a delivery">
          <p>
            When you request a quote we calculate a price from the distance between your pickup and
            destination and the weight band you choose. That price is shown to you in full, itemised,
            before you confirm. Confirming the order creates a contract between you and us for that
            delivery.
          </p>
          <p>
            Distance and duration estimates come from public routing data. They are estimates. Actual
            travel time depends on traffic, weather and road conditions in Nairobi and we do not
            guarantee an arrival time.
          </p>
        </Clause>

        <Clause number="04" title="What you may not send">
          <p>Do not book a delivery for any of the following:</p>
          <Points
            items={[
              'Anything illegal to possess or transport in Kenya.',
              'Cash, bullion, negotiable instruments or bank cards.',
              'Firearms, ammunition, explosives, fireworks or weapons of any kind.',
              'Flammable, corrosive, toxic, radioactive or otherwise hazardous material.',
              'Live animals, human remains, or human tissue.',
              'Narcotics or controlled substances outside a licensed pharmaceutical chain.',
              'Anything that would put a rider at risk.',
            ]}
          />
          <p>
            You are responsible for what is inside the parcel. If a rider has reason to believe a
            parcel contains something on this list they may refuse to carry it, and we may cancel the
            order and report it to the authorities where the law requires us to.
          </p>
        </Clause>

        <Clause number="05" title="Packaging and the recipient">
          <p>
            Pack your parcel so it survives a motorcycle journey across the city. Fragile items must
            be padded and marked. Give us a recipient name and a phone number that will actually be
            answered at the destination.
          </p>
          <p>
            The rider records who received the parcel at the point of handover, and that name appears
            on the delivery record. If nobody is available to receive it, the rider will contact you
            before returning the parcel, and a return trip is charged as a new delivery.
          </p>
        </Clause>

        <Clause number="06" title="Payment">
          <p>
            Deliveries are paid for in Kenya Shillings. The usual method is M-Pesa: we send a payment
            prompt to the phone number you give us, and you authorise it with your PIN. We never ask
            for and never see your M-Pesa PIN.
          </p>
          <p>
            Where the prompt does not reach you, a rider may collect the fare directly. A cash
            payment is only settled once a member of our operations team confirms it against the
            rider’s report, and you receive the same receipt either way.
          </p>
          <p>
            A receipt is issued for every completed and paid delivery. It carries a reference you can
            check against our records at any time on the <Link to="/verify" className="text-brand-700 underline underline-offset-4">verification page</Link>.
          </p>
        </Clause>

        <Clause number="07" title="Cancelling">
          <p>
            You can cancel an order yourself at any time before a rider collects the parcel, at no
            charge. Once the parcel is in a rider’s hands the delivery is under way and the fare is
            due.
          </p>
          <p>
            We may cancel an order if the pickup or destination cannot be safely reached, if the
            parcel is on the prohibited list, or if we cannot reach you to complete the collection.
          </p>
        </Clause>

        <Clause number="08" title="Loss and damage">
          <p>
            We take reasonable care of every parcel we carry. If a parcel is lost or damaged while it
            is with us, tell us within seven days of the delivery date so that we can investigate
            against the tracking record.
          </p>
          <p>
            Our liability for any one delivery is limited to the declared value of the parcel or ten
            times the delivery fare, whichever is lower. We are not liable for indirect losses such
            as lost profit, lost opportunity or missed deadlines, or for damage caused by inadequate
            packaging.
          </p>
        </Clause>

        <Clause number="09" title="Riders">
          <p>
            Riders on this platform are independent operators, not employees. A rider chooses when to
            be available, sees only the deliveries assigned to them, and is paid a share of the fare
            for each completed delivery.
          </p>
          <p>
            If you ride with us, you must hold a valid licence and insurance for the machine you use,
            keep your status updates honest and current, and treat customers and their parcels with
            care.
          </p>
        </Clause>

        <Clause number="10" title="Changes to these terms">
          <p>
            We may update these terms as the service changes. The date at the top of this page is
            always the date of the version you are reading, and continuing to use the platform after
            a change means you accept the updated terms.
          </p>
        </Clause>

        <Clause number="11" title="Governing law and contact">
          <p>
            These terms are governed by the laws of Kenya, and the courts of Kenya have jurisdiction
            over any dispute arising from them. We would much rather sort a problem out directly
            first.
          </p>
          <p>
            Reach us at{' '}
            <a
              href={`mailto:${CONTACT.email}`}
              className="text-brand-700 underline underline-offset-4"
            >
              {CONTACT.email}
            </a>{' '}
            or {CONTACT.phoneDisplay}, {CONTACT.hours}. Our{' '}
            <Link to="/privacy" className="text-brand-700 underline underline-offset-4">
              privacy policy
            </Link>{' '}
            explains what we do with your personal data.
          </p>
        </Clause>
      </LegalBody>
    </>
  )
}
