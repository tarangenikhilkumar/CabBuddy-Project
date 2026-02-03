import { useState, useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import SidebarItem from "@/components/profile/SidebarItem";
import ProfileOverview from "@/components/profile/ProfileOverview";
import ProfileVerification from "@/components/profile/ProfileVerification";
import ProfileRatings from "@/components/profile/ProfileRatings";
import { User, ShieldCheck, Star, Car, Route } from "lucide-react";
import { getMyRides } from "@/api/rideApi";
import AvailableRideCard from "@/components/AvailableRideCard";

// ✅ UPDATED IMPORT (renamed file)
import { Outlet } from "react-router-dom";
import Vehicle from "@/components/profile/Vehicle";
import { isDriver, isAdmin } from "@/config/auth";

// ✅ UPDATED IMPORT
import {
  fetchUserById,
  updateUserProfile,
} from "@/api/userfetchApi";

/**
 * Profile Component
 * Manages user profile data, verification status, and driver-specific ride listings.
 */
export default function Profile() {
  // State to track the currently selected sidebar section
  const [activeSection, setActiveSection] = useState("overview");

  /* =========================
      🔐 READ LOGIN DATA
      ========================= */
  // Attempt to retrieve user authentication data from multiple possible localStorage keys
  const loginData =
    JSON.parse(localStorage.getItem("user")) ||
    JSON.parse(localStorage.getItem("loginResponse")) ||
    JSON.parse(localStorage.getItem("auth"));

  const role = loginData?.role?.toUpperCase();
  const isRoleDriver = role === "DRIVER";
  const userId = loginData?.id;

  /* =========================
      🚗 MY RIDES STATE
      ========================= */
  const [myRides, setMyRides] = useState([]);
  const [ridesLoading, setRidesLoading] = useState(false);
  const [ridesError, setRidesError] = useState(null);

  /* =========================
      ✅ PROFILE STATE
      ========================= */
  // Holds the core user data fetched from the backend
  const [userProfile, setUserProfile] = useState(null);

  // Toggle for profile editing mode
  const [isEditing, setIsEditing] = useState(false);
  // Temporary state for the profile edit form fields
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
  });

  // Hydrate verification state from sessionStorage to persist during the session
  const verifiedStorageKey = userId ? `verifiedState_${userId}` : "verifiedState";

  const [verifiedState, setVerifiedState] = useState(() => {
    const saved = sessionStorage.getItem(verifiedStorageKey);

    return saved
      ? JSON.parse(saved)
      : { phone: false, email: false, govtId: false, drivingLicense: false };
  });

  const location = useLocation();
  

  /* --------------------------------------------------
      Fetch user profile (GET /api/users/{id})
  -------------------------------------------------- */
  // Initial load: Fetch the user's latest profile data from the API
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const response = await fetchUserById();
        setUserProfile(response.data);

        // Pre-fill edit form with current data
        setEditForm({
          name: response.data.name,
          phone: response.data.phone,
        });
      } catch (error) {
        console.error("Failed to load user profile", error);
      }
    };

    loadUserProfile();
  }, []);

  /* --------------------------------------------------
      Handle verification updates via navigation state
  -------------------------------------------------- */
  // Listens for updates passed through react-router-dom's location state (e.g., after a successful verification redirect)
  useEffect(() => {
    if (location.state?.verified) {
      setVerifiedState((prev) => {
        const updated = {
          ...prev,
          ...location.state.verified,
        };

        sessionStorage.setItem(
  verifiedStorageKey,
  JSON.stringify(updated)
);

        return updated;
      });
    }
  }, [location]);

  /* =========================
      📡 FETCH DRIVER RIDES
      ========================= */
  // Automatically trigger ride fetch when the user switches to the 'Rides' tab
  useEffect(() => {
    if (activeSection === "rides" && isRoleDriver) {
      fetchMyRides();
    }
  }, [activeSection, isRoleDriver]);

  /**
   * Fetches the rides associated with the current driver ID
   */
  const fetchMyRides = async () => {
    if (!userId) return;

    setRidesLoading(true);
    setRidesError(null);

    try {
      console.log("Fetching rides for driverId:", userId);
      const response = await getMyRides(); // ✅ Backend hit
      console.log("🚗 My Rides:", response.data);
      setMyRides(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Failed to load rides:", error);
      setRidesError("Failed to load your rides");
      setMyRides([]);
    } finally {
      setRidesLoading(false);
    }
  };

  /* =========================
      🏷 STATUS BADGE
      ========================= */
  // UI helper to render color-coded status pills
  const StatusBadge = ({ status }) => {
    const map = {
      active: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      completed: "bg-blue-100 text-blue-800",
      booked: "bg-yellow-100 text-yellow-800",
    };
    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-medium ${
          map[status?.toLowerCase()] || "bg-gray-100 text-gray-800"
        }`}
      >
        {status || "unknown"}
      </span>
    );
  };

  /* --------------------------------------------------
      Input Change Handler
  -------------------------------------------------- */
  // Synchronizes controlled input fields with editForm state
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  /* --------------------------------------------------
      Save Profile
  -------------------------------------------------- */
  // Persists edited profile changes to the server
  const handleSaveProfile = async () => {
    try {
      const response = await updateUserProfile(editForm);
      setUserProfile(response.data);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update profile", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  /* --------------------------------------------------
      Cancel Editing
  -------------------------------------------------- */
  // Reverts the form state to the original profile data and exits edit mode
  const handleCancelEdit = () => {
    setEditForm({
      name: userProfile.name,
      phone: userProfile.phone,
    });
    setIsEditing(false);
  };

  /* --------------------------------------------------
      Loading Guard
  -------------------------------------------------- */
  // Prevents rendering the UI until the user profile data is available
  if (!userProfile) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <p className="text-blue-700">Loading profile...</p>
      </div>
    );
  }

  /* --------------------------------------------------
      User object passed to child components
  -------------------------------------------------- */
  const user = {
    name: userProfile.name,
    email: userProfile.email,
    phone: userProfile.phone,
    verified: verifiedState,
  };

  /* --------------------------------------------------
      Section Renderer
  -------------------------------------------------- */
  // Logic to switch between different views based on the active sidebar selection
  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="animate-fadeIn space-y-6">
            <ProfileOverview
              user={user}
              isEditing={isEditing}
              editForm={editForm}
              onChange={handleInputChange}
            />
            <ProfileVerification user={user} />
          </div>
        );

      case "verification":
        return (
          <div className="animate-fadeIn">
            <ProfileVerification user={user} />
          </div>
        );

      case "rating":
        return (
          <div className="animate-fadeIn">
            <ProfileRatings />
          </div>
        );

      case "rides":
        return (
          <div className="space-y-6">
            {!isRoleDriver && (
              <Card className="p-10 text-center bg-yellow-50 border-yellow-200 rounded-2xl">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                  Driver access only
                </h3>
                <p className="text-yellow-700">
                  Only drivers can publish and manage rides.
                </p>
              </Card>
            )}

            {isRoleDriver && (
              <>
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold">My Rides</h2>
                    <p className="text-gray-600">
                      {ridesLoading
                        ? "Loading..."
                        : `${myRides.length} ride(s)`}
                    </p>
                  </div>
                  <button
                    onClick={fetchMyRides}
                    disabled={ridesLoading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-xl disabled:opacity-50"
                  >
                    Refresh
                  </button>
                </div>

                {ridesLoading && <p>Loading rides...</p>}
                {ridesError && <p className="text-red-600">{ridesError}</p>}

                {!ridesLoading && myRides.length === 0 && (
                  <Card className="p-10 text-center rounded-2xl">
                    <p className="mb-4">No rides published yet.</p>
                    <Link
                      to="/publish-ride"
                      className="text-blue-600 font-semibold"
                    >
                      Publish your first ride
                    </Link>
                  </Card>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {myRides.map((ride) => (
                    <Link key={ride.id} to={`/ride-details/${ride.id}`}>
                      <Card className="p-6 rounded-2xl hover:shadow-lg transition">
                        <div className="flex justify-between mb-3">
                          <StatusBadge status={ride.status} />
                        </div>
                        <AvailableRideCard
                          startTime={ride.departureTime?.substring(0, 5)}
                          endTime={ride.arrivalTime?.substring(0, 5)}
                          from={ride.source}
                          to={ride.destination}
                          price={ride.pricePerSeat}
                          rideDate={ride.rideDate}
                          availableSeats={ride.availableSeats}
                          status={ride.status}
                          driver={{ name: "You", rating: 4.8 }}
                        />
                      </Card>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        );

      case "vehicle":
        if (!isDriver() && !isAdmin()) return null;
        return (
          <div className="animate-fadeIn">
            <Vehicle />
          </div>
        );

      default:
        return null;
    }
  };

  /* --------------------------------------------------
      Main Render
  -------------------------------------------------- */
  return (
    <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50 py-10 flex justify-center items-start">
      <Card className="w-full max-w-5xl mx-auto p-8 shadow-2xl rounded-3xl bg-white/90 backdrop-blur border border-blue-100">
        
        {/* ✅ HEADER SECTION UPDATED */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-semibold text-blue-900">
            My Account
          </h1>

          {/* Logic for Edit/Cancel buttons commented out for now as per current layout */}
          {/* {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 rounded-full border border-blue-200 text-sm hover:bg-blue-50 transition"
            >
              Edit Profile
            </button>
          ) : (
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 rounded-full bg-red-500 text-white text-sm hover:bg-red-600 transition"
            >
              Cancel
            </button>
          )} */}
        </div>

        <div className="grid gap-6 md:grid-cols-[260px,1fr]">
          {/* Sidebar Navigation */}
          <aside className="bg-gradient-to-b from-blue-100 to-blue-50 rounded-2xl p-5 space-y-3 text-blue-900 shadow-lg">
            <SidebarItem
              label="Overview"
              icon={User}
              isActive={activeSection === "overview"}
              onClick={() => setActiveSection("overview")}
            />
            <SidebarItem
              label="Verification"
              icon={ShieldCheck}
              isActive={activeSection === "verification"}
              onClick={() => setActiveSection("verification")}
            />
            <SidebarItem
              label="Rating"
              icon={Star}
              isActive={activeSection === "rating"}
              onClick={() => setActiveSection("rating")}
            />
            <SidebarItem
              label="My Rides"
              icon={Route}
              isActive={activeSection === "rides"}
              onClick={() => setActiveSection("rides")}
            />
            {/* Conditional sidebar link for privileged roles */}
            {(isDriver() || isAdmin()) && (
              <SidebarItem
                label="Add Vehicle"
                icon={Car}
                isActive={activeSection === "vehicle"}
                onClick={() => setActiveSection("vehicle")}
              />
            )}
          </aside>

          {/* Content Viewport */}
          <main className="space-y-6 transition-all duration-300">
            {renderSection()}

            {/* Save button appears only when editing the Overview section */}
            {isEditing && activeSection === "overview" && (
              <div className="flex justify-end mt-6">
                <button
                  onClick={handleSaveProfile}
                  className="px-6 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  Save Changes
                </button>
              </div>
            )}
          </main>
        </div>
      </Card>

      {/* Local styles for tab-switching animations */}
      <style>{`
        .animate-fadeIn {
          animation: fadeIn 0.45s ease-in-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}