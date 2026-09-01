import { Link } from 'react-router-dom'

import { Clause, LegalBody, LegalHeader, Points } from '@/components/legal/Legal'
import { CONTACT } from '@/utils/constants'

const UPDATED = '1 September 2026'

export default function Privacy() {
  return (
    <>
      <LegalHeader
        eyebrow="Legal"
        title="Privacy policy"
        updated={UPDATED}
        summary={`What ${CONTACT.company} collects about you, why we need it, who else sees it, and how you get it back or get it deleted.`}
      />

      <LegalBody>
        <Clause number="01" title="Who is responsible for your data">
          <p>
            {CONTACT.company}, {CONTACT.addressLines.join(', ')}, is the data controller for the
            personal data described here. We handle it in line with the Data Protection Act, No. 24
            of 2019, which is the law governing personal data in Kenya and is enforced by the Office
            of the Data Protection Commissioner.
          </p>
        </Clause>

        <Clause number="02" title="What we collect">
          <p>We only collect what a delivery actually needs.</p>
          <Points
            items={[
              'Account details: your name, email address, phone number and a securely hashed password. We never store your password in a readable form.',
              'Delivery details: pickup and destination addresses with their map coordinates, parcel weight band, notes you add, and the recipient’s name, phone number and email address.',
              'Payment records: the amount, the method, the M-Pesa transaction reference and the phone number that paid. We never receive or store your M-Pesa PIN, and we never see or hold card or bank account numbers.',
              'Rider location: while a rider is carrying your parcel, their position is recorded so you can follow it. Location is only recorded during an active delivery and never when a rider is off duty.',
              'Delivery history: the timeline of every status change, who made it, and the name of whoever received the parcel.',
            ]}
          />
        </Clause>

        <Clause number="03" title="Why we hold it">
          <p>
            Every item above exists to carry out the delivery contract you entered into with us, to
            let you and your recipient follow the parcel, to take payment and issue a receipt, and to
            keep the financial and operational records the law requires us to keep.
          </p>
          <p>
            We do not sell your data. We do not share it with advertisers. We do not build
            advertising profiles, and we do not use your data to train anything.
          </p>
        </Clause>

        <Clause number="04" title="About the recipient’s details">
          <p>
            When you book a delivery you give us the details of the person receiving the parcel. We
            use them only to deliver it and to keep that person informed about the parcel coming to
            them. Please make sure the recipient is expecting to hear from us.
          </p>
        </Clause>

        <Clause number="05" title="Who else sees it">
          <p>Your data reaches other people only where the delivery requires it.</p>
          <Points
            items={[
              'The rider assigned to your parcel sees the pickup and destination addresses and the two phone numbers, and only for the parcel they are carrying.',
              'Our operations team sees order records so they can assign riders and correct mistakes.',
              'Safaricom processes the M-Pesa payment and sends us back the transaction result.',
              'Google delivers the notification emails we send you, and OpenStreetMap services turn addresses into map coordinates and routes.',
              'The hosting providers that run the application and its database on our behalf.',
            ]}
          />
          <p>
            We will also disclose data where a court order or the law requires us to, and we will
            tell you when we are permitted to.
          </p>
        </Clause>

        <Clause number="06" title="How long we keep it">
          <p>
            Delivery and payment records are kept for seven years, which is the retention period for
            business and tax records in Kenya. Rider location traces are kept only as part of the
            delivery record they belong to.
          </p>
          <p>
            If you close your account we remove your profile, but the delivery and payment records
            attached to completed orders remain for that retention period because we are required to
            keep them.
          </p>
        </Clause>

        <Clause number="07" title="How we protect it">
          <p>
            Traffic between your browser and our servers is encrypted in transit. Passwords are
            stored as one-way hashes. Access is controlled by role, so a rider cannot open another
            rider’s deliveries and a customer cannot open another customer’s orders. Receipts carry a
            keyed signature so a forged one can be detected.
          </p>
          <p>
            No system is perfectly secure. If a breach affects your personal data we will notify you
            and the Office of the Data Protection Commissioner as the Act requires.
          </p>
        </Clause>

        <Clause number="08" title="Your rights">
          <p>Under the Data Protection Act you have the right to:</p>
          <Points
            items={[
              'Be told what personal data we hold about you and why.',
              'Get a copy of it.',
              'Have anything inaccurate corrected.',
              'Have data deleted where we have no lawful reason to keep it.',
              'Object to how we are using it, and to ask us to restrict that use.',
              'Complain to the Office of the Data Protection Commissioner if you are not satisfied with our answer.',
            ]}
          />
          <p>
            You can correct most of your own details from your profile page at any time. For anything
            else, write to us and we will respond within thirty days.
          </p>
        </Clause>

        <Clause number="09" title="Cookies">
          <p>
            We do not use advertising or tracking cookies. Your browser stores your sign-in token so
            that you stay signed in between visits, and clearing your browser storage or signing out
            removes it.
          </p>
        </Clause>

        <Clause number="10" title="Contact us">
          <p>
            For anything to do with your personal data, write to{' '}
            <a
              href={`mailto:${CONTACT.email}`}
              className="text-brand-700 underline underline-offset-4"
            >
              {CONTACT.email}
            </a>{' '}
            or call {CONTACT.phoneDisplay}, {CONTACT.hours}. Our{' '}
            <Link to="/terms" className="text-brand-700 underline underline-offset-4">
              terms of service
            </Link>{' '}
            cover the delivery agreement itself.
          </p>
        </Clause>
      </LegalBody>
    </>
  )
}
