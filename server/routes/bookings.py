"""
Booking routes - Person C. Covers the full rental lifecycle: create, list
mine, list what I own, update status/review, delete - plus additions for
self-drive/chauffeur hire and event-convoy bookings:

  POST /bookings          accepts hire_type + driver_id + contact_phone
                           (single vehicle)
  POST /bookings/convoy    books several vehicles at once for an event
                           (wedding/funeral/safari/group_transportation),
                           applying a volume discount based on how many
                           vehicles are booked together.

Two conflict checks run on every booking that involves a driver:
  1. Is this driver already confirmed/active on ANOTHER renter's booking
     that overlaps these dates? (a driver physically can't be in two
     places at once)
  2. Within a single convoy request, has the SAME driver been assigned to
     more than one vehicle? (same reason, just checked within one payload
     instead of against the database)
"""
import re
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify, g

from extensions import db
from models import Booking, Vehicle, User, Driver
from utils.decorators import jwt_required

bookings_bp = Blueprint("bookings", __name__)

CONVOY_DISCOUNT_TIERS = [
    (6, 0.15),
    (4, 0.10),
    (2, 0.05),
]

PHONE_PATTERN = re.compile(r"^\+254\d{9}$")

VALID_EVENT_TYPES = ("wedding", "funeral", "safari", "group_transportation", "international_traveller", "other")

# Sub-services offered under the "international_traveller" event type - see
# TRAVELLER_SERVICES in client/src/constants.js, which is the source of
# truth for the label/description/which-fields-are-required-for-which-service
# shown in the UI. This tuple is just the server-side allowlist.
VALID_TRAVELLER_SERVICES = (
    "airport_pickup",
    "airport_dropoff",
    "round_trip",
    "hotel_transfer",
    "tourist_transfer",
    "multi_day_driver",
    "multi_destination",
)


def _parse_date(value):
    return datetime.strptime(value, "%Y-%m-%d").date()


def _valid_phone(value):
    return bool(value) and bool(PHONE_PATTERN.match(value))


def _convoy_discount(vehicle_count):
    for min_count, discount in CONVOY_DISCOUNT_TIERS:
        if vehicle_count >= min_count:
            return discount
    return 0.0


def _has_conflict(vehicle_id, start, end):
    return (
        Booking.query.filter(
            Booking.vehicle_id == vehicle_id,
            Booking.status.in_(["confirmed", "active"]),
            Booking.start_date < end,
            Booking.end_date > start,
        ).first()
        is not None
    )


def _driver_has_conflict(driver_id, start, end, exclude_booking_id=None):
    """Same overlap logic as _has_conflict, but keyed on driver_id instead
    of vehicle_id - a driver already confirmed/active on ANY OTHER renter's
    booking for overlapping dates can't be double-booked here."""
    query = Booking.query.filter(
        Booking.driver_id == driver_id,
        Booking.status.in_(["confirmed", "active"]),
        Booking.start_date < end,
        Booking.end_date > start,
    )
    if exclude_booking_id:
        query = query.filter(Booking.id != exclude_booking_id)
    return query.first() is not None


def _price_for_vehicle(vehicle, driver, days):
    """Vehicle daily_rate x days, plus the driver's daily_rate x days on
    top if this is a chauffeur-driven hire (self-drive adds nothing)."""
    price = days * vehicle.daily_rate
    if driver:
        price += days * driver.daily_rate
    return price


@bookings_bp.route("/bookings", methods=["POST"])
@jwt_required
def create_booking():
    data = request.get_json() or {}
    vehicle_id = data.get("vehicle_id")
    start_date = data.get("start_date")
    end_date = data.get("end_date")
    hire_type = data.get("hire_type", "self_drive")
    driver_id = data.get("driver_id")
    contact_phone = data.get("contact_phone")

    if not (vehicle_id and start_date and end_date):
        return jsonify({"error": "vehicle_id, start_date and end_date are required"}), 400

    if not _valid_phone(contact_phone):
        return jsonify({"error": "contact_phone must be in the format +254 followed by 9 digits, e.g. +254795038762"}), 400

    if hire_type not in ("self_drive", "chauffeur"):
        hire_type = "self_drive"

    vehicle = db.session.get(Vehicle, vehicle_id)
    if not vehicle or not vehicle.is_available:
        return jsonify({"error": "Vehicle not available"}), 404

    start = _parse_date(start_date)
    end = _parse_date(end_date)
    if end <= start:
        return jsonify({"error": "end_date must be after start_date"}), 400

    driver = None
    if hire_type == "chauffeur":
        if not driver_id:
            return jsonify({"error": "driver_id is required for a chauffeur-driven hire"}), 400
        driver = db.session.get(Driver, driver_id)
        if not driver or not driver.is_available:
            return jsonify({"error": "Driver not available"}), 404
        if _driver_has_conflict(driver_id, start, end):
            return jsonify({"error": f"{driver.name} is already booked for these dates - please choose a different driver or dates"}), 409

    # Conflict check: does an existing confirmed/active booking for this
    # vehicle overlap with the requested date range?
    if _has_conflict(vehicle_id, start, end):
        return jsonify({"error": "Vehicle not available for these dates"}), 409

    days = (end - start).days
    total_price = _price_for_vehicle(vehicle, driver, days)

    booking = Booking(
        vehicle_id=vehicle_id,
        renter_id=g.current_user.id,
        start_date=start,
        end_date=end,
        total_price=total_price,
        notes=data.get("notes"),
        status="pending",
        hire_type=hire_type,
        driver_id=driver.id if driver else None,
        # A driver only finds out - and can accept/decline - once they're
        # actually assigned to a booking. "pending" here means "awaiting
        # this driver's response", shown in their portal (see
        # routes/drivers.py's /driver/bookings).
        driver_status="pending" if driver else None,
        contact_phone=contact_phone,
    )
    db.session.add(booking)
    db.session.commit()
    return jsonify(booking.to_dict()), 201


@bookings_bp.route("/bookings/convoy", methods=["POST"])
@jwt_required
def create_convoy_booking():
    """
    Books multiple vehicles at once for an event (wedding, funeral, safari,
    group transportation, other). Every vehicle gets its own Booking row (so
    ownership, conflict-checking, and the confirm/cancel state machine all
    keep working exactly as they do for a single booking) - they're tied
    together only by a shared `convoy_id` and the same discount applied to
    each one's total_price.

    Body:
      {
        "event_type": "wedding" | "funeral" | "safari" | "group_transportation" | "international_traveller" | "other",
        "start_date": "YYYY-MM-DD", "end_date": "YYYY-MM-DD",
        "contact_phone": "+254795038762",
        "notes": "...",
        # Only when event_type is "international_traveller" - see
        # VALID_TRAVELLER_SERVICES above.
        "traveller_service": "airport_pickup" | "airport_dropoff" | "round_trip"
                              | "hotel_transfer" | "tourist_transfer"
                              | "multi_day_driver" | "multi_destination",
        "pickup_location": "...", "dropoff_location": "...",
        "meet_and_greet": true,
        "vehicles": [
          { "vehicle_id": 3, "hire_type": "chauffeur", "driver_id": 2 },
          { "vehicle_id": 7, "hire_type": "self_drive" }
        ]
      }
    """
    data = request.get_json() or {}
    event_type = data.get("event_type", "other")
    start_date = data.get("start_date")
    end_date = data.get("end_date")
    contact_phone = data.get("contact_phone")
    vehicles_payload = data.get("vehicles") or []

    if event_type not in VALID_EVENT_TYPES:
        event_type = "other"

    traveller_service = None
    if event_type == "international_traveller":
        traveller_service = data.get("traveller_service")
        if traveller_service not in VALID_TRAVELLER_SERVICES:
            return jsonify({"error": "traveller_service is required for an international traveller booking and must be one of: " + ", ".join(VALID_TRAVELLER_SERVICES)}), 400

    if not (start_date and end_date) or len(vehicles_payload) < 1:
        return jsonify({"error": "start_date, end_date and at least one vehicle are required"}), 400

    if not _valid_phone(contact_phone):
        return jsonify({"error": "contact_phone must be in the format +254 followed by 9 digits, e.g. +254795038762"}), 400

    start = _parse_date(start_date)
    end = _parse_date(end_date)
    if end <= start:
        return jsonify({"error": "end_date must be after start_date"}), 400
    days = (end - start).days

    # A renter can't assign the same chauffeur to two different vehicles in
    # the same convoy - physically impossible, and worth catching with a
    # clear error before we even touch the database.
    driver_ids_in_request = [
        entry.get("driver_id") for entry in vehicles_payload
        if entry.get("hire_type") == "chauffeur" and entry.get("driver_id")
    ]
    duplicates = {d for d in driver_ids_in_request if driver_ids_in_request.count(d) > 1}
    if duplicates:
        dup_names = [db.session.get(Driver, d).name for d in duplicates if db.session.get(Driver, d)]
        return jsonify({"error": f"The same driver ({', '.join(dup_names)}) can't be assigned to more than one vehicle in this convoy"}), 400

    # Validate every vehicle/driver BEFORE creating anything, so a bad
    # entry (already booked, missing driver) doesn't leave a half-created
    # convoy behind.
    resolved = []
    for entry in vehicles_payload:
        vehicle_id = entry.get("vehicle_id")
        hire_type = entry.get("hire_type", "self_drive")
        driver_id = entry.get("driver_id")

        vehicle = db.session.get(Vehicle, vehicle_id)
        if not vehicle or not vehicle.is_available:
            return jsonify({"error": f"Vehicle {vehicle_id} is not available"}), 404

        if _has_conflict(vehicle_id, start, end):
            return jsonify({"error": f"{vehicle.make} {vehicle.model} is not available for these dates"}), 409

        driver = None
        if hire_type == "chauffeur":
            driver = db.session.get(Driver, driver_id)
            if not driver or not driver.is_available:
                return jsonify({"error": f"Driver {driver_id} is not available"}), 404
            if _driver_has_conflict(driver_id, start, end):
                return jsonify({"error": f"{driver.name} is already booked for these dates - please choose a different driver"}), 409

        resolved.append((vehicle, driver, hire_type))

    discount = _convoy_discount(len(resolved))
    convoy_id = uuid.uuid4().hex

    # Only meaningful for event_type == "international_traveller" - the
    # columns stay null/false for every other event type.
    pickup_location = (data.get("pickup_location") or "").strip()[:120] or None
    dropoff_location = (data.get("dropoff_location") or "").strip()[:120] or None
    meet_and_greet = bool(data.get("meet_and_greet")) if traveller_service else False

    created = []
    for vehicle, driver, hire_type in resolved:
        base_price = _price_for_vehicle(vehicle, driver, days)
        booking = Booking(
            vehicle_id=vehicle.id,
            renter_id=g.current_user.id,
            start_date=start,
            end_date=end,
            total_price=round(base_price * (1 - discount), 2),
            notes=data.get("notes"),
            status="pending",
            hire_type=hire_type,
            driver_id=driver.id if driver else None,
            driver_status="pending" if driver else None,
            contact_phone=contact_phone,
            event_type=event_type,
            is_convoy=True,
            convoy_id=convoy_id,
            discount_percent=discount * 100,
            traveller_service=traveller_service,
            pickup_location=pickup_location,
            dropoff_location=dropoff_location,
            meet_and_greet=meet_and_greet,
        )
        db.session.add(booking)
        created.append(booking)

    db.session.commit()
    return jsonify({
        "convoy_id": convoy_id,
        "discount_percent": discount * 100,
        "bookings": [b.to_dict() for b in created],
    }), 201


@bookings_bp.route("/bookings/me", methods=["GET"])
@jwt_required
def my_bookings():
    bookings = (
        Booking.query.filter_by(renter_id=g.current_user.id)
        .order_by(Booking.created_at.desc())
        .all()
    )
    return jsonify([b.to_dict() for b in bookings]), 200


@bookings_bp.route("/bookings/owner", methods=["GET"])
@jwt_required
def owner_bookings():
    # Bookings for vehicles owned by the current user - joins through
    # Vehicle since Booking only stores vehicle_id, not owner_id directly.
    bookings = (
        Booking.query.join(Vehicle, Booking.vehicle_id == Vehicle.id)
        .filter(Vehicle.owner_id == g.current_user.id)
        .order_by(Booking.created_at.desc())
        .all()
    )
    return jsonify([b.to_dict() for b in bookings]), 200


@bookings_bp.route("/bookings/<int:booking_id>", methods=["PUT"])
@jwt_required
def update_booking(booking_id):
    booking = db.session.get(Booking, booking_id)
    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    data = request.get_json() or {}
    user = g.current_user
    is_owner = booking.vehicle.owner_id == user.id
    is_renter = booking.renter_id == user.id
    is_admin = user.role == "admin"

    if not (is_owner or is_renter or is_admin):
        return jsonify({"error": "Forbidden"}), 403

    VALID_STATUSES = {"pending", "confirmed", "active", "completed", "cancelled"}

    new_status = data.get("status")
    if new_status:
        # Admins are superusers - they can approve/decline a pending
        # request (used by the "Approve"/"Decline" buttons on
        # /admin/bookings), or force-cancel a confirmed/active booking to
        # resolve a dispute ("Force Cancel"). This bypasses the normal
        # owner/renter state machine below entirely, on purpose.
        if is_admin and new_status in VALID_STATUSES:
            # Confirming a chauffeur-driven booking re-checks the driver
            # isn't already confirmed elsewhere for overlapping dates -
            # this can happen if two pending requests for the same driver
            # were both still "pending" when they were created (which is
            # allowed - only confirmed/active bookings block a new request)
            # and now both are being approved.
            if new_status == "confirmed" and booking.driver_id:
                if _driver_has_conflict(booking.driver_id, booking.start_date, booking.end_date, exclude_booking_id=booking.id):
                    return jsonify({"error": "This driver is already confirmed on another booking for overlapping dates"}), 409
            booking.status = new_status
        elif is_owner and booking.status == "pending" and new_status in ("confirmed", "cancelled"):
            if new_status == "confirmed" and booking.driver_id:
                if _driver_has_conflict(booking.driver_id, booking.start_date, booking.end_date, exclude_booking_id=booking.id):
                    return jsonify({"error": "This driver is already confirmed on another booking for overlapping dates"}), 409
            booking.status = new_status
        elif is_owner and booking.status == "confirmed" and new_status == "completed":
            booking.status = new_status
        elif is_renter and booking.status == "pending" and new_status == "cancelled":
            booking.status = new_status
        else:
            return jsonify({"error": f"Cannot change status from {booking.status} to {new_status}"}), 400

    # Leaving a review: only the renter, only once the booking is completed.
    if "review_rating" in data:
        if not is_renter:
            return jsonify({"error": "Only the renter can leave a review"}), 403
        if booking.status != "completed":
            return jsonify({"error": "Can only review a completed booking"}), 400

        booking.review_rating = data["review_rating"]

        # Recalculate the vehicle owner's average rating across all their
        # reviewed bookings.
        owner = db.session.get(User, booking.vehicle.owner_id)
        reviewed = (
            Booking.query.join(Vehicle, Booking.vehicle_id == Vehicle.id)
            .filter(Vehicle.owner_id == owner.id, Booking.review_rating.isnot(None))
            .all()
        )
        owner.rating = sum(b.review_rating for b in reviewed) / len(reviewed)

    db.session.commit()
    return jsonify(booking.to_dict()), 200


@bookings_bp.route("/bookings/<int:booking_id>", methods=["DELETE"])
@jwt_required
def delete_booking(booking_id):
    booking = db.session.get(Booking, booking_id)
    if not booking:
        return jsonify({"error": "Booking not found"}), 404

    if booking.renter_id != g.current_user.id and booking.vehicle.owner_id != g.current_user.id:
        return jsonify({"error": "Forbidden"}), 403

    if booking.status not in ("pending", "cancelled"):
        return jsonify({"error": "Only pending or cancelled bookings can be deleted"}), 400

    db.session.delete(booking)
    db.session.commit()
    return jsonify({"message": "Booking deleted"}), 200
