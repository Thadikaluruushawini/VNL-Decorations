import { useState } from "react";
import ReceiverDashboard from "./ReceiverDashboard";

const API = "http://localhost:5000";

const eventTypes = [
  "Haldi",
  "Reception",
  "Marriage Dinner",
  "Engagement",
  "Birthday Function",
  "Half Saree Function"
];

const functionHalls = [
  "Sri Trikoteswara Raghavendra Function Hall",
  "TKR Function Hall",
  "Sreedhar Gardens"
];

const advanceOptions = [30000, 40000, 50000];

function App() {
  // ========================================
  // RECEIVER DASHBOARD
  // ========================================

  if (window.location.pathname === "/receiver") {
    return <ReceiverDashboard />;
  }

  // ========================================
  // STEP
  // ========================================

  const [step, setStep] = useState(1);

  // ========================================
  // CUSTOMER DETAILS
  // ========================================

  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // ========================================
  // BOOKING DETAILS
  // ========================================

  const [hall, setHall] = useState("");
  const [event, setEvent] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  // ========================================
  // PAYMENT
  // ========================================

  const [advanceAmount, setAdvanceAmount] = useState(null);

  // ========================================
  // STATUS
  // ========================================

  const [available, setAvailable] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ========================================
  // STEP 1
  // CUSTOMER
  // ========================================

  function continueRegistration(e) {
    e.preventDefault();

    setError("");

    if (!customer.trim()) {
      setError("Please enter customer name.");
      return;
    }

    if (!phone.trim()) {
      setError("Please enter phone number.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter email address.");
      return;
    }

    setStep(2);
  }

  // ========================================
  // STEP 2
  // HALL
  // ========================================

  function continueHall() {
    setError("");

    if (!hall) {
      setError("Please select a function hall.");
      return;
    }

    setStep(3);
  }

  // ========================================
  // STEP 3
  // CHECK AVAILABILITY
  // ========================================

  async function checkAvailability(e) {
    e.preventDefault();

    setError("");

    if (!event) {
      setError("Please select an event type.");
      return;
    }

    if (!date) {
      setError("Please select an event date.");
      return;
    }

    if (!time) {
      setError("Please select Morning or Evening.");
      return;
    }

    setLoading(true);

    try {
      console.log(
        "Checking availability:",
        hall,
        date,
        time
      );

      const response = await fetch(
        `${API}/api/check-availability`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            hall,
            date,
            time
          })
        }
      );

      const rawResponse = await response.text();

      console.log(
        "Availability HTTP status:",
        response.status
      );

      console.log(
        "Availability response:",
        rawResponse
      );

      let data;

      try {
        data = JSON.parse(rawResponse);
      } catch {
        throw new Error(
          `Server returned non-JSON response.\n\nStatus: ${response.status}\n\n${rawResponse.substring(
            0,
            500
          )}`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not check availability."
        );
      }

      setAvailable(data.available);

      setStep(4);
    } catch (err) {
      console.error(
        "AVAILABILITY ERROR:",
        err
      );

      setError(
        err.message ||
          "Cannot connect to server."
      );
    } finally {
      setLoading(false);
    }
  }

  // ========================================
  // STEP 4 → STEP 5
  // ========================================

  function continueToPayment() {
    setError("");

    setStep(5);
  }

  // ========================================
  // CREATE PENDING BOOKING
  // ========================================
  //
  // This does NOT confirm the booking.
  //
  // It creates:
  //
  // status = PENDING
  // payment_status = PENDING
  //
  // Razorpay will be connected after this.
  //
  // ========================================

  async function createPendingBooking() {
    setError("");

    if (!advanceAmount) {
      setError(
        "Please select an advance payment amount."
      );

      return;
    }

    setLoading(true);

    const bookingData = {
      customer,
      phone,
      email,
      event,
      hall,
      date,
      time,
      advanceAmount
    };

    console.log(
      "================================"
    );

    console.log(
      "Creating pending booking"
    );

    console.log(
      "URL:",
      `${API}/api/bookings/pending`
    );

    console.log(
      "DATA:",
      bookingData
    );

    console.log(
      "================================"
    );

    try {
      const response = await fetch(
        `${API}/api/bookings/pending`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify(
            bookingData
          )
        }
      );

      // ====================================
      // IMPORTANT
      // Read as TEXT first.
      // This prevents:
      //
      // Unexpected token '<'
      //
      // ====================================

      const rawResponse =
        await response.text();

      console.log(
        "HTTP STATUS:",
        response.status
      );

      console.log(
        "SERVER RESPONSE:",
        rawResponse
      );

      let data;

      try {
        data = JSON.parse(
          rawResponse
        );
      } catch (jsonError) {
        throw new Error(
          `Server returned HTML/non-JSON instead of JSON.\n\nHTTP Status: ${
            response.status
          }\n\nServer response:\n${rawResponse.substring(
            0,
            800
          )}`
        );
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Could not create booking."
        );
      }

      if (!data.success) {
        throw new Error(
          data.message ||
            "Booking could not be created."
        );
      }

      console.log(
        "PENDING BOOKING CREATED:",
        data.booking
      );

      setBooking(data.booking);

      setStep(6);
    } catch (err) {
      console.error(
        "PENDING BOOKING ERROR:",
        err
      );

      setError(
        err.message ||
          "Cannot connect to server."
      );
    } finally {
      setLoading(false);
    }
  }

  // ========================================
  // NEW BOOKING
  // ========================================

  function newBooking() {
    setStep(1);

    setCustomer("");
    setPhone("");
    setEmail("");

    setHall("");
    setEvent("");
    setDate("");
    setTime("");

    setAdvanceAmount(null);

    setAvailable(null);

    setBooking(null);

    setError("");
  }

  // ========================================
  // TODAY
  // ========================================

  const today = new Date()
    .toISOString()
    .split("T")[0];

  // ========================================
  // UI
  // ========================================

  return (
    <div style={styles.page}>
      {/* ==================================
          HEADER
      ================================== */}

      <header style={styles.header}>
        <div style={styles.logo}>V</div>

        <h1 style={styles.title}>
          VNL Decorations
        </h1>

        <p style={styles.subtitle}>
          Event Management - Atmakur,
          Nellore
        </p>
      </header>

      {/* ==================================
          PROGRESS
      ================================== */}

      {!booking && (
        <div style={styles.progress}>
          <Step number="1" active={step >= 1} />

          <div style={styles.progressLine} />

          <Step number="2" active={step >= 2} />

          <div style={styles.progressLine} />

          <Step number="3" active={step >= 3} />

          <div style={styles.progressLine} />

          <Step number="4" active={step >= 4} />

          <div style={styles.progressLine} />

          <Step number="5" active={step >= 5} />
        </div>
      )}

      {/* ==================================
          ERROR
      ================================== */}

      {error && (
        <div style={styles.error}>
          ⚠️
          <pre style={styles.errorText}>
            {error}
          </pre>
        </div>
      )}

      {/* ==================================
          STEP 1
      ================================== */}

      {step === 1 && (
        <div style={styles.card}>
          <div style={styles.bigIcon}>
            👤
          </div>

          <h2>
            Customer Registration
          </h2>

          <p style={styles.description}>
            Enter your details to start
            your booking.
          </p>

          <form
            onSubmit={
              continueRegistration
            }
          >
            <label style={styles.label}>
              Customer Name
            </label>

            <input
              style={styles.input}
              type="text"
              placeholder="Enter customer name"
              value={customer}
              onChange={(e) =>
                setCustomer(
                  e.target.value
                )
              }
            />

            <label style={styles.label}>
              Phone Number
            </label>

            <input
              style={styles.input}
              type="tel"
              placeholder="Enter phone number"
              value={phone}
              onChange={(e) =>
                setPhone(e.target.value)
              }
            />

            <label style={styles.label}>
              Email Address
            </label>

            <input
              style={styles.input}
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

            <button
              style={styles.primaryButton}
              type="submit"
            >
              Continue →
            </button>
          </form>
        </div>
      )}

      {/* ==================================
          STEP 2
      ================================== */}

      {step === 2 && (
        <div style={styles.card}>
          <div style={styles.bigIcon}>
            🏛️
          </div>

          <h2>
            Select Function Hall
          </h2>

          <p style={styles.description}>
            Choose a function hall in
            Atmakur, Nellore.
          </p>

          {functionHalls.map((item) => (
            <div
              key={item}
              onClick={() =>
                setHall(item)
              }
              style={{
                ...styles.hallCard,

                ...(hall === item
                  ? styles.hallSelected
                  : {})
              }}
            >
              <div style={styles.radio}>
                {hall === item
                  ? "●"
                  : "○"}
              </div>

              <div>
                <strong>
                  {item}
                </strong>

                <p
                  style={styles.smallText}
                >
                  📍 Atmakur, Nellore
                </p>
              </div>
            </div>
          ))}

          <div style={styles.buttonRow}>
            <button
              style={styles.secondaryButton}
              onClick={() =>
                setStep(1)
              }
            >
              ← Back
            </button>

            <button
              style={styles.primaryButton}
              onClick={continueHall}
            >
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* ==================================
          STEP 3
      ================================== */}

      {step === 3 && (
        <div style={styles.card}>
          <div style={styles.bigIcon}>
            📅
          </div>

          <h2>
            Event Details
          </h2>

          <p style={styles.description}>
            Select event, date and
            time slot.
          </p>

          <div style={styles.infoBox}>
            <strong>
              Function Hall
            </strong>

            <p>{hall}</p>
          </div>

          <form
            onSubmit={
              checkAvailability
            }
          >
            <label style={styles.label}>
              Event Type
            </label>

            <select
              style={styles.input}
              value={event}
              onChange={(e) =>
                setEvent(
                  e.target.value
                )
              }
            >
              <option value="">
                Select Event Type
              </option>

              {eventTypes.map((item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              ))}
            </select>

            <label style={styles.label}>
              Event Date
            </label>

            <input
              style={styles.input}
              type="date"
              min={today}
              value={date}
              onChange={(e) =>
                setDate(e.target.value)
              }
            />

            <label style={styles.label}>
              Time Slot
            </label>

            <div style={styles.timeRow}>
              <button
                type="button"
                onClick={() =>
                  setTime("Morning")
                }
                style={{
                  ...styles.timeCard,

                  ...(time === "Morning"
                    ? styles.timeSelected
                    : {})
                }}
              >
                <span
                  style={
                    styles.timeEmoji
                  }
                >
                  🌅
                </span>

                <strong>
                  Morning
                </strong>

                <small>
                  6:00 AM - 2:00 PM
                </small>
              </button>

              <button
                type="button"
                onClick={() =>
                  setTime("Evening")
                }
                style={{
                  ...styles.timeCard,

                  ...(time === "Evening"
                    ? styles.timeSelected
                    : {})
                }}
              >
                <span
                  style={
                    styles.timeEmoji
                  }
                >
                  🌙
                </span>

                <strong>
                  Evening
                </strong>

                <small>
                  4:00 PM - 11:00 PM
                </small>
              </button>
            </div>

            <div style={styles.buttonRow}>
              <button
                type="button"
                style={
                  styles.secondaryButton
                }
                onClick={() =>
                  setStep(2)
                }
              >
                ← Back
              </button>

              <button
                type="submit"
                style={
                  styles.primaryButton
                }
                disabled={loading}
              >
                {loading
                  ? "Checking..."
                  : "Check Availability"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ==================================
          STEP 4 AVAILABLE
      ================================== */}

      {step === 4 &&
        available === true && (
          <div style={styles.card}>
            <div
              style={styles.statusIcon}
            >
              🟢
            </div>

            <h2>
              Slot Available
            </h2>

            <p
              style={
                styles.availableText
              }
            >
              This function hall is
              available!
            </p>

            <div style={styles.summary}>
              <SummaryRow
                label="Customer"
                value={customer}
              />

              <SummaryRow
                label="Phone"
                value={phone}
              />

              <SummaryRow
                label="Email"
                value={email}
              />

              <SummaryRow
                label="Event"
                value={event}
              />

              <SummaryRow
                label="Hall"
                value={hall}
              />

              <SummaryRow
                label="Date"
                value={date}
              />

              <SummaryRow
                label="Time"
                value={time}
              />

              <SummaryRow
                label="Location"
                value="Atmakur, Nellore"
              />
            </div>

            <button
              style={
                styles.primaryButton
              }
              onClick={
                continueToPayment
              }
            >
              Continue to Advance
              Payment →
            </button>

            <button
              style={
                styles.secondaryFull
              }
              onClick={() =>
                setStep(3)
              }
            >
              ← Change Date / Time
            </button>
          </div>
        )}

      {/* ==================================
          STEP 4 BOOKED
      ================================== */}

      {step === 4 &&
        available === false && (
          <div style={styles.card}>
            <div
              style={styles.statusIcon}
            >
              🔴
            </div>

            <h2>
              Slot Already Booked
            </h2>

            <p
              style={
                styles.bookedText
              }
            >
              This hall is already
              booked for this date and
              time.
            </p>

            <div style={styles.summary}>
              <SummaryRow
                label="Hall"
                value={hall}
              />

              <SummaryRow
                label="Date"
                value={date}
              />

              <SummaryRow
                label="Time"
                value={time}
              />
            </div>

            <button
              style={
                styles.primaryButton
              }
              onClick={() =>
                setStep(3)
              }
            >
              ← Choose Another Slot
            </button>
          </div>
        )}

      {/* ==================================
          STEP 5 PAYMENT SELECTION
      ================================== */}

      {step === 5 && !booking && (
        <div style={styles.card}>
          <div
            style={styles.statusIcon}
          >
            💰
          </div>

          <h2>
            Choose Advance Payment
          </h2>

          <p
            style={styles.description}
          >
            Select the advance amount
            for your event.
          </p>

          <div style={styles.summary}>
            <SummaryRow
              label="Customer"
              value={customer}
            />

            <SummaryRow
              label="Function Hall"
              value={hall}
            />

            <SummaryRow
              label="Event"
              value={event}
            />

            <SummaryRow
              label="Date"
              value={date}
            />

            <SummaryRow
              label="Time"
              value={time}
            />
          </div>

          <div
            style={
              styles.paymentOptions
            }
          >
            {advanceOptions.map(
              (amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() =>
                    setAdvanceAmount(
                      amount
                    )
                  }
                  style={{
                    ...styles.paymentCard,

                    ...(advanceAmount ===
                    amount
                      ? styles.paymentSelected
                      : {})
                  }}
                >
                  <span
                    style={
                      styles.paymentIcon
                    }
                  >
                    ₹
                  </span>

                  <strong>
                    ₹
                    {amount.toLocaleString(
                      "en-IN"
                    )}
                  </strong>

                  <small>
                    Advance Payment
                  </small>
                </button>
              )
            )}
          </div>

          {advanceAmount && (
            <div
              style={
                styles.selectedPayment
              }
            >
              Selected Advance:

              <strong>
                ₹
                {advanceAmount.toLocaleString(
                  "en-IN"
                )}
              </strong>
            </div>
          )}

          <div style={styles.buttonRow}>
            <button
              style={
                styles.secondaryButton
              }
              onClick={() =>
                setStep(4)
              }
            >
              ← Back
            </button>

            <button
              style={
                styles.primaryButton
              }
              onClick={
                createPendingBooking
              }
              disabled={
                loading ||
                !advanceAmount
              }
            >
              {loading
                ? "Processing..."
                : "Proceed to Payment →"}
            </button>
          </div>
        </div>
      )}

      {/* ==================================
          STEP 6
          PENDING BOOKING
      ================================== */}

      {step === 6 && booking && (
        <div style={styles.card}>
          <div
            style={styles.statusIcon}
          >
            💳
          </div>

          <h2>
            Booking Created
          </h2>

          <p
            style={styles.pendingText}
          >
            Your booking is waiting for
            payment confirmation.
          </p>

          <div
            style={styles.confirmBox}
          >
            <SummaryRow
              label="Booking ID"
              value={`#${booking.id}`}
            />

            <SummaryRow
              label="Customer"
              value={
                booking.customer
              }
            />

            <SummaryRow
              label="Phone"
              value={booking.phone}
            />

            <SummaryRow
              label="Email"
              value={booking.email}
            />

            <SummaryRow
              label="Event"
              value={booking.event}
            />

            <SummaryRow
              label="Function Hall"
              value={booking.hall}
            />

            <SummaryRow
              label="Date"
              value={booking.date}
            />

            <SummaryRow
              label="Time"
              value={booking.time}
            />

            <SummaryRow
              label="Advance"
              value={`₹${Number(
                booking.advance_amount ||
                  booking.advanceAmount ||
                  0
              ).toLocaleString(
                "en-IN"
              )}`}
            />

            <SummaryRow
              label="Payment Status"
              value={
                booking.payment_status ||
                "PENDING"
              }
            />

            <SummaryRow
              label="Booking Status"
              value={
                booking.status ||
                "PENDING"
              }
            />
          </div>

          <div
            style={
              styles.paymentNotice
            }
          >
            <strong>
              Razorpay Payment
            </strong>

            <p>
              Razorpay will be connected
              here next.
            </p>
          </div>

          <button
            style={
              styles.primaryButton
            }
            onClick={newBooking}
          >
            Make Another Booking
          </button>
        </div>
      )}
    </div>
  );
}

// ========================================
// STEP
// ========================================

function Step({
  number,
  active
}) {
  return (
    <div
      style={{
        ...styles.step,

        ...(active
          ? styles.stepActive
          : {})
      }}
    >
      {number}
    </div>
  );
}

// ========================================
// SUMMARY ROW
// ========================================

function SummaryRow({
  label,
  value
}) {
  return (
    <div
      style={styles.summaryRow}
    >
      <strong>{label}</strong>

      <span>{value}</span>
    </div>
  );
}

// ========================================
// STYLES
// ========================================

const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#fff8f0",
    padding: "30px 20px",
    fontFamily:
      "Arial, sans-serif"
  },

  header: {
    textAlign: "center",
    marginBottom: "30px"
  },

  logo: {
    width: "65px",
    height: "65px",
    borderRadius: "50%",
    margin:
      "0 auto 10px",
    backgroundColor:
      "#a94f12",
    color: "white",
    display: "flex",
    justifyContent:
      "center",
    alignItems: "center",
    fontSize: "38px",
    fontWeight: "bold"
  },

  title: {
    margin: 0,
    fontSize: "42px",
    color: "#8b4513"
  },

  subtitle: {
    color: "#666",
    fontSize: "18px"
  },

  progress: {
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    marginBottom: "30px",
    flexWrap: "wrap"
  },

  step: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    backgroundColor: "#ddd",
    display: "flex",
    justifyContent:
      "center",
    alignItems: "center",
    fontWeight: "bold"
  },

  stepActive: {
    backgroundColor:
      "#a94f12",
    color: "white"
  },

  progressLine: {
    width: "50px",
    height: "3px",
    backgroundColor:
      "#ddd"
  },

  card: {
    maxWidth: "700px",
    margin: "0 auto",
    backgroundColor: "white",
    padding: "35px",
    borderRadius: "18px",
    boxShadow:
      "0 5px 20px rgba(0,0,0,0.12)"
  },

  bigIcon: {
    textAlign: "center",
    fontSize: "50px"
  },

  statusIcon: {
    textAlign: "center",
    fontSize: "60px"
  },

  description: {
    textAlign: "center",
    color: "#666"
  },

  label: {
    display: "block",
    marginTop: "20px",
    marginBottom: "8px",
    fontWeight: "bold"
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "14px",
    fontSize: "16px",
    border:
      "1px solid #ccc",
    borderRadius: "8px"
  },

  primaryButton: {
    width: "100%",
    marginTop: "25px",
    padding: "15px",
    backgroundColor:
      "#a94f12",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "17px",
    fontWeight: "bold",
    cursor: "pointer"
  },

  secondaryButton: {
    flex: 1,
    padding: "15px",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    cursor: "pointer"
  },

  secondaryFull: {
    width: "100%",
    marginTop: "12px",
    padding: "13px",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer"
  },

  buttonRow: {
    display: "flex",
    gap: "12px",
    marginTop: "20px"
  },

  hallCard: {
    display: "flex",
    gap: "15px",
    alignItems: "center",
    padding: "18px",
    marginTop: "12px",
    border:
      "2px solid #ddd",
    borderRadius: "10px",
    cursor: "pointer"
  },

  hallSelected: {
    border:
      "2px solid #a94f12",
    backgroundColor:
      "#fff3e8"
  },

  radio: {
    fontSize: "25px",
    color: "#a94f12"
  },

  smallText: {
    color: "#777",
    margin: "5px 0 0"
  },

  infoBox: {
    backgroundColor:
      "#fff3e8",
    padding: "15px",
    borderRadius: "8px",
    marginTop: "20px"
  },

  timeRow: {
    display: "flex",
    gap: "15px"
  },

  timeCard: {
    flex: 1,
    padding: "20px",
    display: "flex",
    flexDirection:
      "column",
    alignItems:
      "center",
    gap: "8px",
    backgroundColor:
      "white",
    border:
      "2px solid #ddd",
    borderRadius: "10px",
    cursor: "pointer"
  },

  timeSelected: {
    border:
      "2px solid #a94f12",
    backgroundColor:
      "#fff3e8"
  },

  timeEmoji: {
    fontSize: "30px"
  },

  summary: {
    backgroundColor:
      "#f7f7f7",
    padding: "20px",
    borderRadius: "10px",
    marginTop: "20px"
  },

  summaryRow: {
    display: "flex",
    justifyContent:
      "space-between",
    gap: "20px",
    padding: "9px 0",
    borderBottom:
      "1px solid #e5e5e5"
  },

  paymentOptions: {
    display: "flex",
    gap: "15px",
    marginTop: "25px",
    flexWrap: "wrap"
  },

  paymentCard: {
    flex: 1,
    minWidth: "150px",
    padding:
      "22px 15px",
    display: "flex",
    flexDirection:
      "column",
    alignItems:
      "center",
    gap: "8px",
    backgroundColor:
      "white",
    border:
      "2px solid #ddd",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "16px"
  },

  paymentSelected: {
    border:
      "2px solid #a94f12",
    backgroundColor:
      "#fff3e8"
  },

  paymentIcon: {
    width: "35px",
    height: "35px",
    borderRadius: "50%",
    backgroundColor:
      "#a94f12",
    color: "white",
    display: "flex",
    alignItems:
      "center",
    justifyContent:
      "center",
    fontWeight: "bold"
  },

  selectedPayment: {
    marginTop: "20px",
    padding: "15px",
    backgroundColor:
      "#fff3e8",
    borderRadius: "8px",
    textAlign: "center"
  },

  confirmBox: {
    backgroundColor:
      "#f1fff1",
    padding: "20px",
    borderRadius: "10px",
    marginTop: "20px"
  },

  availableText: {
    textAlign: "center",
    color: "green",
    fontWeight: "bold"
  },

  bookedText: {
    textAlign: "center",
    color: "red",
    fontWeight: "bold"
  },

  pendingText: {
    textAlign: "center",
    color: "#b06a00",
    fontWeight: "bold"
  },

  paymentNotice: {
    marginTop: "20px",
    padding: "18px",
    backgroundColor:
      "#fff3e8",
    borderRadius: "10px",
    textAlign: "center"
  },

  error: {
    maxWidth: "700px",
    margin:
      "0 auto 20px",
    padding: "15px",
    backgroundColor:
      "#ffe5e5",
    color: "#b00000",
    borderRadius: "8px",
    textAlign: "left",
    overflowX: "auto"
  },

  errorText: {
    whiteSpace: "pre-wrap",
    fontFamily:
      "monospace",
    margin: "8px 0 0"
  }
};

export default App;