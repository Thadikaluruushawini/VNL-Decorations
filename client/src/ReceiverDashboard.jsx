import { useEffect, useMemo, useState } from "react";

const API = "http://localhost:5000";

const HALLS = [
  "Sri Trikoteswara Raghavendra Function Hall",
  "TKR Function Hall",
  "Sreedhar Gardens"
];

function ReceiverDashboard() {
  const today = new Date();

  const [selectedHall, setSelectedHall] = useState(HALLS[0]);

  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const [bookings, setBookings] = useState([]);

  const [selectedBooking, setSelectedBooking] = useState(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  // ========================================
  // LOAD BOOKINGS
  // ========================================

  async function loadBookings() {
    setLoading(true);
    setError("");

    try {
      const year = currentMonth.getFullYear();

      const month = String(
        currentMonth.getMonth() + 1
      ).padStart(2, "0");

      const response = await fetch(
        `${API}/api/admin/bookings?hall=${encodeURIComponent(
          selectedHall
        )}&month=${year}-${month}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not load bookings."
        );
      }

      setBookings(data.bookings || []);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Cannot connect to VNL Decorations server."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBookings();
  }, [selectedHall, currentMonth]);

  // ========================================
  // CREATE CALENDAR DAYS
  // ========================================

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const daysInMonth = lastDay.getDate();

    // Monday = 0
    let startingDay = firstDay.getDay() - 1;

    if (startingDay < 0) {
      startingDay = 6;
    }

    const days = [];

    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  }, [currentMonth]);

  // ========================================
  // DATE FORMAT
  // ========================================

  function getDateString(date) {
    if (!date) return "";

    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  // ========================================
  // FIND BOOKING
  // ========================================

  function getBooking(date, time) {
    const dateString = getDateString(date);

    return bookings.find(
      (booking) =>
        booking.date === dateString &&
        booking.time === time
    );
  }

  // ========================================
  // MONTH NAVIGATION
  // ========================================

  function previousMonth() {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - 1,
        1
      )
    );

    setSelectedBooking(null);
  }

  function nextMonth() {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        1
      )
    );

    setSelectedBooking(null);
  }

  function goToToday() {
    setCurrentMonth(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      )
    );

    setSelectedBooking(null);
  }

  // ========================================
  // CANCEL BOOKING
  // ========================================

  async function cancelBooking(booking) {
    const confirmed = window.confirm(
      `Cancel booking #${booking.id} for ${booking.customer}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/admin/bookings/${booking.id}`,
        {
          method: "DELETE"
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Could not cancel booking."
        );
      }

      setSelectedBooking(null);

      await loadBookings();
    } catch (err) {
      alert(
        err.message ||
          "Could not cancel booking."
      );
    }
  }

  // ========================================
  // MONTH NAME
  // ========================================

  const monthName =
    currentMonth.toLocaleDateString(
      "en-IN",
      {
        month: "long",
        year: "numeric"
      }
    );

  // ========================================
  // UI
  // ========================================

  return (
    <div style={styles.page}>

      {/* HEADER */}

      <header style={styles.header}>

        <div style={styles.logo}>
          V
        </div>

        <div>
          <h1 style={styles.title}>
            VNL Decorations
          </h1>

          <p style={styles.subtitle}>
            Receiver Dashboard
          </p>
        </div>

      </header>

      {/* ERROR */}

      {error && (
        <div style={styles.error}>
          ⚠️ {error}
        </div>
      )}

      {/* CONTROLS */}

      <div style={styles.controlsCard}>

        <div style={styles.controlGroup}>

          <label style={styles.label}>
            Function Hall
          </label>

          <select
            value={selectedHall}
            onChange={(e) => {
              setSelectedHall(e.target.value);
              setSelectedBooking(null);
            }}
            style={styles.select}
          >

            {HALLS.map((hall) => (
              <option
                key={hall}
                value={hall}
              >
                {hall}
              </option>
            ))}

          </select>

        </div>

        <div style={styles.monthControls}>

          <button
            onClick={previousMonth}
            style={styles.navButton}
          >
            ←
          </button>

          <button
            onClick={goToToday}
            style={styles.todayButton}
          >
            Today
          </button>

          <button
            onClick={nextMonth}
            style={styles.navButton}
          >
            →
          </button>

        </div>

      </div>

      {/* CALENDAR */}

      <div style={styles.calendarCard}>

        <div style={styles.calendarHeader}>

          <h2 style={{ margin: 0 }}>
            {monthName}
          </h2>

          <span>
            {loading
              ? "Loading..."
              : `${bookings.length} confirmed booking${
                  bookings.length === 1
                    ? ""
                    : "s"
                }`}
          </span>

        </div>

        {/* WEEK DAYS */}

        <div style={styles.weekHeader}>

          {[
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday"
          ].map((day) => (
            <div
              key={day}
              style={styles.weekDay}
            >
              {day}
            </div>
          ))}

        </div>

        {/* CALENDAR */}

        <div style={styles.calendarGrid}>

          {calendarDays.map((date, index) => {

            if (!date) {
              return (
                <div
                  key={`empty-${index}`}
                  style={styles.emptyDay}
                />
              );
            }

            const morningBooking =
              getBooking(date, "Morning");

            const eveningBooking =
              getBooking(date, "Evening");

            const hasBooking =
              morningBooking ||
              eveningBooking;

            return (
              <div
                key={getDateString(date)}
                style={{
                  ...styles.day,
                  ...(hasBooking
                    ? styles.bookedDay
                    : {})
                }}
              >

                <div style={styles.dayNumber}>
                  {date.getDate()}
                </div>

                <div style={styles.slotContainer}>

                  {/* MORNING */}

                  {morningBooking ? (

                    <button
                      style={styles.bookedSlot}
                      onClick={() =>
                        setSelectedBooking(
                          morningBooking
                        )
                      }
                    >
                      🌅 Morning

                      <strong>
                        BOOKED
                      </strong>
                    </button>

                  ) : (

                    <div style={styles.availableSlot}>
                      🌅 Morning

                      <strong>
                        Available
                      </strong>
                    </div>

                  )}

                  {/* EVENING */}

                  {eveningBooking ? (

                    <button
                      style={styles.bookedSlot}
                      onClick={() =>
                        setSelectedBooking(
                          eveningBooking
                        )
                      }
                    >
                      🌙 Evening

                      <strong>
                        BOOKED
                      </strong>
                    </button>

                  ) : (

                    <div style={styles.availableSlot}>
                      🌙 Evening

                      <strong>
                        Available
                      </strong>
                    </div>

                  )}

                </div>

              </div>
            );
          })}

        </div>

      </div>

      {/* BOOKING DETAILS */}

      {selectedBooking && (

        <div style={styles.detailsCard}>

          <div style={styles.detailsHeader}>

            <div>
              <h2 style={{ margin: 0 }}>
                Booking Details
              </h2>

              <p style={{ color: "#666" }}>
                Booking #{selectedBooking.id}
              </p>
            </div>

            <button
              style={styles.closeButton}
              onClick={() =>
                setSelectedBooking(null)
              }
            >
              ✕
            </button>

          </div>

          <div style={styles.statusBadge}>
            CONFIRMED
          </div>

          <div style={styles.detailsGrid}>

            <Detail
              label="Customer"
              value={selectedBooking.customer}
            />

            <Detail
              label="Phone"
              value={selectedBooking.phone}
            />

            <Detail
              label="Email"
              value={
                selectedBooking.email ||
                "Not provided"
              }
            />

            <Detail
              label="Event"
              value={selectedBooking.event}
            />

            <Detail
              label="Function Hall"
              value={selectedBooking.hall}
            />

            <Detail
              label="Date"
              value={selectedBooking.date}
            />

            <Detail
              label="Time"
              value={selectedBooking.time}
            />

            <Detail
              label="Advance Amount"
              value={`₹${Number(
                selectedBooking.advance_amount || 0
              ).toLocaleString("en-IN")}`}
            />

            <Detail
              label="Payment"
              value={
                selectedBooking.payment_status
              }
            />

            <Detail
              label="Location"
              value={
                selectedBooking.location
              }
            />

          </div>

          <button
            style={styles.cancelButton}
            onClick={() =>
              cancelBooking(selectedBooking)
            }
          >
            Cancel Booking
          </button>

        </div>

      )}

      {/* LEGEND */}

      <div style={styles.legend}>

        <div>
          <span style={styles.greenDot} />
          Available
        </div>

        <div>
          <span style={styles.redDot} />
          Confirmed Booking
        </div>

      </div>

    </div>
  );
}

// ========================================
// DETAIL COMPONENT
// ========================================

function Detail({ label, value }) {
  return (
    <div style={styles.detailItem}>

      <span style={styles.detailLabel}>
        {label}
      </span>

      <strong style={styles.detailValue}>
        {value}
      </strong>

    </div>
  );
}

// ========================================
// STYLES
// ========================================

const styles = {

  page: {
    minHeight: "100vh",
    background: "#fff8f0",
    padding: "30px 20px",
    fontFamily: "Arial, sans-serif",
    boxSizing: "border-box"
  },

  header: {
    maxWidth: "1200px",
    margin: "0 auto 25px",
    display: "flex",
    alignItems: "center",
    gap: "15px"
  },

  logo: {
    width: "60px",
    height: "60px",
    borderRadius: "50%",
    background: "#a94f12",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "35px",
    fontWeight: "bold"
  },

  title: {
    margin: 0,
    color: "#8b4513",
    fontSize: "32px"
  },

  subtitle: {
    margin: "5px 0 0",
    color: "#666"
  },

  error: {
    maxWidth: "1200px",
    margin: "0 auto 20px",
    padding: "15px",
    borderRadius: "8px",
    background: "#ffe5e5",
    color: "#b00000"
  },

  controlsCard: {
    maxWidth: "1200px",
    margin: "0 auto 20px",
    background: "white",
    padding: "20px",
    borderRadius: "15px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "end",
    gap: "20px",
    flexWrap: "wrap"
  },

  controlGroup: {
    flex: 1,
    minWidth: "280px"
  },

  label: {
    display: "block",
    fontWeight: "bold",
    marginBottom: "8px"
  },

  select: {
    width: "100%",
    padding: "13px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    fontSize: "15px",
    background: "white"
  },

  monthControls: {
    display: "flex",
    gap: "8px"
  },

  navButton: {
    padding: "12px 18px",
    border: "none",
    borderRadius: "8px",
    background: "#a94f12",
    color: "white",
    cursor: "pointer",
    fontSize: "18px"
  },

  todayButton: {
    padding: "12px 18px",
    border: "1px solid #a94f12",
    borderRadius: "8px",
    background: "white",
    color: "#a94f12",
    cursor: "pointer",
    fontWeight: "bold"
  },

  calendarCard: {
    maxWidth: "1200px",
    margin: "0 auto",
    background: "white",
    padding: "20px",
    borderRadius: "15px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
    overflowX: "auto"
  },

  calendarHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px"
  },

  weekHeader: {
    display: "grid",
    gridTemplateColumns:
      "repeat(7, minmax(120px, 1fr))",
    gap: "5px",
    minWidth: "850px"
  },

  weekDay: {
    textAlign: "center",
    fontWeight: "bold",
    padding: "10px",
    color: "#8b4513",
    background: "#fff3e8",
    borderRadius: "6px"
  },

  calendarGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(7, minmax(120px, 1fr))",
    gap: "5px",
    minWidth: "850px"
  },

  emptyDay: {
    minHeight: "150px",
    background: "#fafafa",
    borderRadius: "6px"
  },

  day: {
    minHeight: "150px",
    border: "1px solid #e5e5e5",
    borderRadius: "8px",
    padding: "8px",
    background: "#fff"
  },

  bookedDay: {
    background: "#fffaf6"
  },

  dayNumber: {
    fontSize: "18px",
    fontWeight: "bold",
    marginBottom: "8px"
  },

  slotContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "6px"
  },

  bookedSlot: {
    border: "1px solid #d9534f",
    background: "#ffe9e7",
    color: "#b00000",
    borderRadius: "6px",
    padding: "7px",
    cursor: "pointer",
    textAlign: "left",
    fontSize: "11px",
    display: "flex",
    flexDirection: "column",
    gap: "3px"
  },

  availableSlot: {
    border: "1px solid #9bd3a5",
    background: "#effbf1",
    color: "#27733a",
    borderRadius: "6px",
    padding: "7px",
    fontSize: "11px",
    display: "flex",
    flexDirection: "column",
    gap: "3px"
  },

  detailsCard: {
    maxWidth: "1200px",
    margin: "20px auto",
    background: "white",
    padding: "25px",
    borderRadius: "15px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)"
  },

  detailsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  closeButton: {
    width: "40px",
    height: "40px",
    border: "none",
    borderRadius: "50%",
    background: "#eee",
    cursor: "pointer",
    fontSize: "18px"
  },

  statusBadge: {
    display: "inline-block",
    marginTop: "10px",
    padding: "7px 12px",
    borderRadius: "20px",
    background: "#dff5e3",
    color: "#18742d",
    fontWeight: "bold",
    fontSize: "13px"
  },

  detailsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "15px",
    marginTop: "20px"
  },

  detailItem: {
    padding: "15px",
    background: "#f7f7f7",
    borderRadius: "8px"
  },

  detailLabel: {
    display: "block",
    color: "#777",
    fontSize: "13px",
    marginBottom: "5px"
  },

  detailValue: {
    display: "block",
    color: "#333"
  },

  cancelButton: {
    marginTop: "20px",
    padding: "13px 20px",
    border: "none",
    borderRadius: "8px",
    background: "#c62828",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold"
  },

  legend: {
    maxWidth: "1200px",
    margin: "20px auto",
    display: "flex",
    gap: "25px",
    background: "white",
    padding: "15px",
    borderRadius: "10px"
  },

  greenDot: {
    display: "inline-block",
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    background: "#38a169",
    marginRight: "7px"
  },

  redDot: {
    display: "inline-block",
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    background: "#d9534f",
    marginRight: "7px"
  }
};

export default ReceiverDashboard;