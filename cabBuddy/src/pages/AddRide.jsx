import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createRide } from "@/api/rideApi";
import { toast } from "react-toastify";
import { format } from "date-fns";
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  DollarSign,
  ArrowRight,
  Car,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import LocationAutocomplete from "@/components/LocationAutocomplete";

export default function PublishRide() {
  const navigate = useNavigate();

  const [date, setDate] = useState(new Date());
  const [departureTime, setDepartureTime] = useState("10:00");
  const [arrivalTime, setArrivalTime] = useState("13:00");
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [seats, setSeats] = useState(2);
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  const [driverId, setDriverId] = useState(null);

  /* ✅ Load driverId from logged-in user */
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user?.id) {
      setDriverId(user.id);
    } else {
      toast.error("Session expired. Please login again.");
      navigate("/login");
    }
  }, [navigate]);

  /* ✅ Auto-calculate arrival time (+3 hours) */
  useEffect(() => {
    const [h, m] = departureTime.split(":");
    const d = new Date();
    d.setHours(parseInt(h), parseInt(m), 0);
    d.setHours(d.getHours() + 3);
    setArrivalTime(
      `${String(d.getHours()).padStart(2, "0")}:${String(
        d.getMinutes()
      ).padStart(2, "0")}`
    );
  }, [departureTime]);

  const handlePriceChange = (e) => {
    const value = e.target.value;
    if (value === "" || /^\d*\.?\d{0,2}$/.test(value)) {
      if (Number(value) <= 5000) setPrice(value);
    }
  };

  const formatTime = (t) => `${t}:00`;

  const handlePublish = async () => {
    if (!driverId) {
      toast.error("Driver not identified. Please login again.");
      return;
    }

    if (!fromCity || !toCity) {
      toast.error("Please select source and destination");
      return;
    }

    if (fromCity.toLowerCase() === toCity.toLowerCase()) {
      toast.error("Source and destination cannot be same");
      return;
    }

    if (!price || Number(price) < 1) {
      toast.error("Enter valid price");
      return;
    }

    const payload = {
      source: fromCity.trim(),
      destination: toCity.trim(),
      rideDate: date.toISOString().split("T")[0],
      departureTime: formatTime(departureTime),
      arrivalTime: formatTime(arrivalTime),
      availableSeats: seats,
      pricePerSeat: Number(price),
      driverId,
    };

    console.log("Ride payload:", payload);

    setLoading(true);
    try {
      await createRide(payload);
      toast.success("Ride published successfully 🚗");
      navigate("/search");
    } catch (err) {
      console.error(err);
      toast.error("Failed to publish ride");
    } finally {
      setLoading(false);
    }
  };

  const handleSwap = () => {
    setFromCity(toCity);
    setToCity(fromCity);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 py-10">
      <div className="max-w-4xl mx-auto bg-white p-10 rounded-3xl shadow-xl">
        <h1 className="text-3xl font-bold text-center mb-6">
          Publish Your Ride
        </h1>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handlePublish();
          }}
          className="space-y-6"
        >
          {/* Route */}
          <div className="grid md:grid-cols-2 gap-4">
            <LocationAutocomplete
              value={fromCity}
              onChange={setFromCity}
              placeholder="From"
            />
            <LocationAutocomplete
              value={toCity}
              onChange={setToCity}
              placeholder="To"
            />
          </div>

          <button
            type="button"
            onClick={handleSwap}
            className="text-blue-600 text-sm flex items-center gap-1"
          >
            <ArrowRight size={16} /> Swap
          </button>

          {/* Date & Time */}
          <div className="grid md:grid-cols-3 gap-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <CalendarDays className="mr-2" />
                  {format(date, "dd MMM yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                />
              </PopoverContent>
            </Popover>

            <Input
              type="time"
              value={departureTime}
              onChange={(e) => setDepartureTime(e.target.value)}
            />

            <Input type="time" value={arrivalTime} disabled />
          </div>

          {/* Seats & Price */}
          <div className="grid md:grid-cols-2 gap-4">
            <Input
              type="number"
              min="1"
              max="8"
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
            />
            <Input
              placeholder="Price per seat"
              value={price}
              onChange={handlePriceChange}
            />
          </div>

          {/* Summary */}
          <div className="bg-blue-50 p-4 rounded-xl">
            <p>
              <strong>Total:</strong> ₹{price ? price * seats : 0}
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 text-lg"
          >
            {loading ? "Publishing..." : "Publish Ride"}
          </Button>
        </form>
      </div>
    </div>
  );
}
