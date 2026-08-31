import { Link, useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";

import Button from "@/components/ui/Button";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Input from "@/components/ui/Input";
import { FileText } from "lucide-react";

import LiveTrackingBar from "@/components/orders/LiveTrackingBar";
import RateDelivery from "@/components/orders/RateDelivery";
import MapView from "@/components/map/MapView";
import Modal from "@/components/ui/Modal";
import OrderTimeline from "@/components/orders/OrderTimeline";
import PlacesAutocomplete from "@/components/map/PlacesAutocomplete";
import PriceBreakdown from "@/components/orders/PriceBreakdown";
import StatusBadge, { PaymentBadge } from "@/components/ui/StatusBadge";
import StatusStepper from "@/components/orders/StatusStepper";
import { PageContainer } from "@/components/layout/AppShell";
import { PageSpinner } from "@/components/ui/Spinner";
import {
  cancelOrder,
  changeDestination,
  clearCurrent,
  fetchOrder,
  selectCurrentOrder,
  selectDetailError,
  selectDetailStatus,
  selectSaveError,
  selectSaving,
} from "@/features/orders/ordersSlice";
import {
  clearCheckout,
  fetchPayment,
  resetPayment,
  selectCheckingOut,
  selectCheckoutError,
  selectCheckoutMessage,
  selectPayment,
  startCheckout,
} from "@/features/payments/paymentsSlice";
import Avatar from "@/components/ui/Avatar";
import {
  arrivalBy,
  distance,
  duration,
  fullDate,
  money,
} from "@/utils/formatters";
import { validatePhone } from "@/utils/validators";
import { useToast } from "@/hooks/useToast";

export default function OrderDetail() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const toast = useToast();

  const order = useSelector(selectCurrentOrder);
  const status = useSelector(selectDetailStatus);
  const error = useSelector(selectDetailError);
  const saving = useSelector(selectSaving);
  const saveError = useSelector(selectSaveError);

  const payment = useSelector(selectPayment);
  const checkingOut = useSelector(selectCheckingOut);
  const checkoutMessage = useSelector(selectCheckoutMessage);
  const checkoutError = useSelector(selectCheckoutError);

  const [destinationOpen, setDestinationOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [nextDestination, setNextDestination] = useState(null);
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState(null);

  useEffect(() => {
    dispatch(fetchOrder(id));
    dispatch(fetchPayment(id));
    return () => {
      dispatch(clearCurrent());
      dispatch(resetPayment());
    };
  }, [dispatch, id]);

  if (status === "loading" || (status === "idle" && !order)) {
    return (
      <PageContainer>
        <PageSpinner label="Loading your delivery" />
      </PageContainer>
    );
  }

  if (status === "failed") {
    return (
      <PageContainer className="max-w-xl">
        <ErrorMessage
          title="Cannot open that delivery"
          message={error}
          onRetry={() => dispatch(fetchOrder(id))}
        />
        <div className="mt-6">
          <Button as={Link} to="/dashboard" variant="outline">
            Back to my deliveries
          </Button>
        </div>
      </PageContainer>
    );
  }

  if (!order) return null;

  const handleDestination = async () => {
    if (!nextDestination?.lat) return;
    const result = await dispatch(
      changeDestination({
        id: order.id,
        payload: {
          destination_address: nextDestination.address,
          destination_lat: nextDestination.lat,
          destination_lng: nextDestination.lng,
        },
      }),
    );
    if (changeDestination.fulfilled.match(result)) {
      toast.success("Destination updated and repriced");
      setDestinationOpen(false);
      setNextDestination(null);
      dispatch(fetchPayment(order.id));
    }
  };

  const handleCancel = async () => {
    const result = await dispatch(cancelOrder(order.id));
    if (cancelOrder.fulfilled.match(result)) {
      toast.info(`${order.tracking_code} cancelled`);
      setCancelOpen(false);
    }
  };

  const handleCheckout = async () => {
    if (!validatePhone(phone)) {
      setPhoneError("Enter a valid Safaricom number, for example 0712345678");
      return;
    }
    setPhoneError(null);
    const result = await dispatch(startCheckout({ orderId: order.id, phone }));
    if (startCheckout.fulfilled.match(result)) {
      setPayOpen(false);
      toast.success(
        result.payload.message || "Check your phone to authorise the payment",
      );
    }
  };

  const paid = payment?.status === "paid";

  return (
    <PageContainer>
      <div className="flex flex-col gap-3.5 border-b border-slate-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="-my-1.5 inline-block py-1.5 font-body text-sm text-slate-500 underline-offset-4 hover:underline"
          >
            ← My deliveries
          </button>
          <h1 className="mt-2.5 font-display text-3xl font-bold tracking-tight text-slate-950">
            {order.tracking_code}
          </h1>
          <p className="mt-0.5 font-body text-base text-slate-500">
            Created {fullDate(order.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <StatusBadge status={order.status} />
          <PaymentBadge status={payment?.status || order.payment_status} />
          <Link
            to={`/orders/${order.id}/receipt`}
            className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3.5 py-1.5 font-body text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
          >
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            Receipt
          </Link>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-inset ring-slate-100">
        <StatusStepper status={order.status} />
      </div>

      {saveError && (
        <div className="mt-6">
          <ErrorMessage compact message={saveError} />
        </div>
      )}

      <div className="mt-6 grid gap-12 lg:grid-cols-[1.35fr_1fr]">
        <div className="flex flex-col gap-6">
          <LiveTrackingBar
            order={order}
            onRefresh={() => {
              dispatch(fetchOrder(id));
              dispatch(fetchPayment(id));
            }}
          />

          <MapView
            pickup={{ lat: order.pickup_lat, lng: order.pickup_lng }}
            destination={{
              lat: order.destination_lat,
              lng: order.destination_lng,
            }}
            courier={
              order.current_lat && order.status !== "pending"
                ? { lat: order.current_lat, lng: order.current_lng }
                : null
            }
            polyline={order.route_polyline}
          />

          <RateDelivery order={order} />

          <Panel title="Route">
            <div className="flex flex-col gap-3.5">
              <Leg
                tone="bg-brand-600"
                label="Pickup"
                value={order.pickup_address}
              />
              <Leg
                tone="bg-slate-950"
                label="Destination"
                value={order.destination_address}
              />
            </div>
            <dl className="mt-6 grid grid-cols-2 gap-3.5 border-t border-slate-100 pt-3.5 sm:grid-cols-4">
              <Fact label="Distance" value={distance(order.distance_km)} />
              <Fact label="Est. time" value={duration(order.duration_min)} />
              <Fact
                label="Parcel band"
                value={order.price_breakdown?.category_label}
              />
              <Fact
                label="Tier"
                value={order.price_breakdown?.category_label}
              />
            </dl>
          </Panel>

          <Panel title="Tracking history">
            <OrderTimeline events={order.events} />
          </Panel>
        </div>

        <div className="flex flex-col gap-6">
          <PriceBreakdown quote={order.price_breakdown} compact />

          <Panel title="Recipient">
            <dl className="flex flex-col gap-2.5">
              <Fact label="Name" value={order.recipient_name} />
              <Fact label="Phone" value={order.recipient_phone} mono />
              {order.recipient_email && (
                <Fact label="Email" value={order.recipient_email} />
              )}
              {order.notes && <Fact label="Notes" value={order.notes} />}
            </dl>
          </Panel>

          <Panel title="Your rider">
            {order.courier ? (
              <div className="flex flex-col gap-3.5">
                <div className="flex items-center gap-3.5">
                  <Avatar
                    name={order.courier.name}
                    photo={order.courier.photo_url}
                    size="lg"
                  />
                  <div className="min-w-0">
                    <p className="font-display text-lg font-semibold text-slate-950">
                      {order.courier.name}
                    </p>
                    <p className="font-body text-sm text-slate-500">
                      {order.courier.vehicle}
                    </p>
                    <a
                      href={`tel:${order.courier.phone}`}
                      className="mt-0.5 inline-block py-1.5 font-mono text-sm font-medium text-brand-700 underline underline-offset-2"
                    >
                      {order.courier.phone}
                    </a>
                  </div>
                </div>
                <p className="font-body text-xs text-slate-400">
                  Check this photo matches the person before you hand over the
                  parcel.
                </p>
                {order.duration_min > 0 && order.status !== "delivered" && (
                  <p className="rounded-xl bg-brand-100 px-3.5 py-2.5 font-body text-sm text-brand-950">
                    Arriving at the destination around{" "}
                    <strong>{arrivalBy(order.duration_min)}</strong> — about{" "}
                    {duration(order.duration_min)} on the road.
                  </p>
                )}
              </div>
            ) : (
              <p className="font-body text-sm text-slate-500">
                No rider assigned yet. Operations will allocate one shortly, and
                you will see their photo here.
              </p>
            )}
          </Panel>

          <Panel title="Payment">
            <div className="flex items-baseline justify-between gap-3.5">
              <span className="font-body text-sm text-slate-500">
                Amount due
              </span>
              <span className="font-display text-xl font-semibold text-slate-950">
                {money(order.price_kes)}
              </span>
            </div>
            {payment?.mpesa_receipt && (
              <p className="mt-2.5 font-mono text-xs text-slate-400">
                Receipt {payment.mpesa_receipt}
              </p>
            )}
            <div className="mt-3.5">
              {paid ? (
                <p className="rounded-xl bg-brand-100 px-3.5 py-2.5 font-body text-sm text-brand-800">
                  Paid in full. Thank you.
                </p>
              ) : (
                <Button
                  fullWidth
                  disabled={order.status === "cancelled"}
                  onClick={() => {
                    dispatch(clearCheckout());
                    setPayOpen(true);
                  }}
                >
                  Pay with M-Pesa
                </Button>
              )}
            </div>
          </Panel>

          <Panel title="Manage">
            <div className="flex flex-col gap-2.5">
              <Button
                variant="outline"
                fullWidth
                disabled={!order.is_editable}
                onClick={() => setDestinationOpen(true)}
              >
                Change destination
              </Button>
              <Button
                variant="danger"
                fullWidth
                disabled={!order.is_cancellable}
                onClick={() => setCancelOpen(true)}
              >
                Cancel delivery
              </Button>
              {!order.is_editable && (
                <p className="font-body text-xs text-slate-400">
                  The destination locks once the parcel leaves the pickup point.
                </p>
              )}
            </div>
          </Panel>
        </div>
      </div>

      <Modal
        open={destinationOpen}
        onClose={() => setDestinationOpen(false)}
        title="Change destination"
        description="We will reprice the delivery from the new distance."
        footer={
          <>
            <Button variant="ghost" onClick={() => setDestinationOpen(false)}>
              Keep current
            </Button>
            <Button
              loading={saving}
              disabled={!nextDestination?.lat}
              onClick={handleDestination}
            >
              Update and reprice
            </Button>
          </>
        }
      >
        <PlacesAutocomplete
          label="New destination"
          value={nextDestination}
          onChange={setNextDestination}
          placeholder="Where should it go instead?"
        />
        <p className="mt-3.5 font-body text-sm text-slate-500">
          Current destination: {order.destination_address}
        </p>
      </Modal>

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel this delivery?"
        description={`${order.tracking_code} will stop immediately and nothing further will be charged.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setCancelOpen(false)}>
              Keep it running
            </Button>
            <Button variant="danger" loading={saving} onClick={handleCancel}>
              Cancel delivery
            </Button>
          </>
        }
      >
        <p className="font-body text-base text-slate-600">
          This cannot be undone. You would need to create a new order to send
          the parcel again.
        </p>
      </Modal>

      <Modal
        open={payOpen}
        onClose={() => setPayOpen(false)}
        title="Pay with M-Pesa"
        description={`We will send an STK push for ${money(order.price_kes)}.`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setPayOpen(false)}>
              Close
            </Button>
            <Button loading={checkingOut} onClick={handleCheckout}>
              Send prompt
            </Button>
          </>
        }
      >
        <Input
          label="M-Pesa number"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          error={phoneError}
          placeholder="0712345678"
          inputMode="tel"
        />
        {checkoutMessage && (
          <p className="mt-3.5 rounded-xl bg-brand-100 px-3.5 py-2.5 font-body text-sm text-brand-800">
            {checkoutMessage}
          </p>
        )}
        {checkoutError && (
          <div className="mt-3.5">
            <ErrorMessage compact message={checkoutError} />
          </div>
        )}
      </Modal>
    </PageContainer>
  );
}

function Panel({ title, children }) {
  return (
    <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-inset ring-slate-100">
      <h2 className="font-display text-xl font-semibold text-slate-950">
        {title}
      </h2>
      <div className="mt-3.5">{children}</div>
    </section>
  );
}

function Leg({ tone, label, value }) {
  return (
    <div className="flex items-start gap-2.5">
      <span
        className={`mt-[7px] h-2.5 w-2.5 shrink-0 rounded-full ${tone}`}
        aria-hidden="true"
      />
      <div>
        <p className="font-body text-xs uppercase tracking-[0.12em] text-slate-400">
          {label}
        </p>
        <p className="font-body text-base text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function Fact({ label, value, mono }) {
  return (
    <div>
      <dt className="font-body text-xs uppercase tracking-[0.12em] text-slate-400">
        {label}
      </dt>
      <dd
        className={`mt-0.5 text-base text-slate-800 ${mono ? "font-mono" : "font-body"}`}
      >
        {value || "—"}
      </dd>
    </div>
  );
}
